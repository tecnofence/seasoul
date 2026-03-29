import axios from 'axios'

// ── Resend API — gestão de domínios por tenant ────────────────────────────────
// Docs: https://resend.com/docs/api-reference/domains

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const BASE_DOMAIN    = process.env.EMAIL_BASE_DOMAIN ?? 'engerisone.com'

const resendClient = axios.create({
  baseURL: 'https://api.resend.com',
  headers: {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
})

export interface ResendDomain {
  id:     string
  name:   string
  status: 'pending' | 'verified' | 'failed' | 'temporary_failure'
  records: {
    record:   string
    name:     string
    type:     string
    ttl:      string
    status:   string
    value:    string
    priority?: number
  }[]
  createdAt: string
}

/**
 * Cria um subdomínio de email para um tenant na Resend.
 * Ex: slug "seasoul" → domínio "seasoul.engerisone.com"
 */
export async function createTenantEmailDomain(slug: string): Promise<{
  domainId: string
  emailFrom: string
  records: ResendDomain['records']
}> {
  if (!RESEND_API_KEY || RESEND_API_KEY === 'CHANGE_ME_RESEND_API_KEY') {
    // Dev/sandbox: retornar valores fictícios sem chamar a API
    return {
      domainId:  `dev-${slug}`,
      emailFrom: `noreply@${slug}.${BASE_DOMAIN}`,
      records:   [],
    }
  }

  const domainName = `${slug}.${BASE_DOMAIN}`
  const response = await resendClient.post('/domains', { name: domainName })
  const domain: ResendDomain = response.data

  return {
    domainId:  domain.id,
    emailFrom: `noreply@${domainName}`,
    records:   domain.records,
  }
}

/**
 * Verifica o estado de um domínio Resend.
 * Chamado por polling para actualizar emailDomainStatus no tenant.
 */
export async function checkDomainStatus(domainId: string): Promise<'pending' | 'verified' | 'failed'> {
  if (!RESEND_API_KEY || RESEND_API_KEY === 'CHANGE_ME_RESEND_API_KEY') {
    return 'verified' // sandbox: sempre verificado
  }

  try {
    const response = await resendClient.get(`/domains/${domainId}`)
    const domain: ResendDomain = response.data
    if (domain.status === 'verified') return 'verified'
    if (domain.status === 'failed') return 'failed'
    return 'pending'
  } catch {
    return 'failed'
  }
}

/**
 * Remove um domínio Resend (quando tenant é desactivado/eliminado).
 */
export async function deleteTenantEmailDomain(domainId: string): Promise<void> {
  if (!RESEND_API_KEY || RESEND_API_KEY === 'CHANGE_ME_RESEND_API_KEY') return
  try {
    await resendClient.delete(`/domains/${domainId}`)
  } catch {
    // ignorar erros de remoção
  }
}

/**
 * Envia email transaccional via Resend.
 * Usado por notify.ts com fallback para domínio global.
 */
export async function sendResendEmail(opts: {
  from:    string
  to:      string
  subject: string
  html:    string
}): Promise<void> {
  if (!RESEND_API_KEY || RESEND_API_KEY === 'CHANGE_ME_RESEND_API_KEY') {
    console.warn(`[EMAIL] Resend não configurado — email ignorado (to: ${opts.to}, subject: ${opts.subject})`)
    return
  }

  await resendClient.post('/emails', {
    from:    opts.from,
    to:      opts.to,
    subject: opts.subject,
    html:    opts.html,
  })
}

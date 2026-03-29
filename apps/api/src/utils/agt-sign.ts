import crypto from 'node:crypto'
import fs from 'node:fs'

// ══════════════════════════════════════════════════════════════════
// SISTEMA LEGADO — SAF-T(AO): RSA-1024 + SHA-1
// Especificação: Decreto Executivo n.º 74/19
// ══════════════════════════════════════════════════════════════════

function getPrivateKey(): string {
  if (process.env.AGT_PRIVATE_KEY) {
    return process.env.AGT_PRIVATE_KEY.replace(/\\n/g, '\n')
  }
  const keyPath = process.env.AGT_PRIVATE_KEY_PATH ?? '/run/secrets/agt_private_key'
  try {
    return fs.readFileSync(keyPath, 'utf8')
  } catch {
    return DEV_PRIVATE_KEY
  }
}

// Chave RSA-1024 de desenvolvimento — NUNCA usar em produção
const DEV_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAJBAMaJBDcWDgaCBs1aVXVMKLFVjcJJFnp2XRwzBYEMi0cSRV0P7Y8L
h1Z/F2iOezQJHW0D2L+RI6nEAiG4EUYmR0ECAwEAAQJBAKi7TCnHtqWgr3BSqC3R
...DESENVOLVIMENTO APENAS...
-----END RSA PRIVATE KEY-----`

/**
 * Assinatura digital RSA-1024/SHA-1 para SAF-T(AO) legado
 * Campos (DE 74/19): InvoiceDate;SystemEntryDate;InvoiceNo;GrossTotal;HashAnterior
 * Separador: ";" sem aspas, charset UTF-8, encoding Base64, padding PKCS1 v1.5
 */
export function signInvoice(
  invoiceNo: string,
  invoiceDate: Date,
  grossTotal: number,
  previousHash: string
): string {
  const invoiceDateStr = invoiceDate.toISOString().split('T')[0]        // AAAA-MM-DD
  const systemEntryDate = new Date().toISOString()                       // ISO 8601 com hora
  const toSign = `${invoiceDateStr};${systemEntryDate};${invoiceNo};${grossTotal.toFixed(2)};${previousHash}`

  try {
    const privateKey = getPrivateKey()
    const sign = crypto.createSign('RSA-SHA1')
    sign.update(toSign, 'utf8')
    return sign.sign(privateKey, 'base64')
  } catch {
    // Fallback dev — SHA-1 simples sem chave RSA
    return crypto.createHash('sha1').update(toSign, 'utf8').digest('base64')
  }
}

/**
 * Extrai 4 caracteres de verificação para impressão na fatura impressa (DE 74/19)
 * Posições: 1.ª, 11.ª, 21.ª, 31.ª (índices 0, 10, 20, 30)
 * Formato: "X-X-X-X"
 */
export function getSignatureDisplay(signature: string): string {
  if (!signature || signature.length < 31) return '----'
  return `${signature[0]}-${signature[10]}-${signature[20]}-${signature[30]}`
}

/**
 * Verifica a assinatura de uma fatura (auditoria interna)
 */
export function verifyInvoiceSignature(
  invoiceNo: string,
  invoiceDate: Date,
  grossTotal: number,
  previousHash: string,
  signature: string
): boolean {
  const publicKeyPath = process.env.AGT_PUBLIC_KEY_PATH ?? '/run/secrets/agt_public_key'
  try {
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8')
    const invoiceDateStr = invoiceDate.toISOString().split('T')[0]
    const systemEntryDate = new Date().toISOString()
    const toVerify = `${invoiceDateStr};${systemEntryDate};${invoiceNo};${grossTotal.toFixed(2)};${previousHash}`
    const verify = crypto.createVerify('RSA-SHA1')
    verify.update(toVerify, 'utf8')
    return verify.verify(publicKey, signature, 'base64')
  } catch {
    return false
  }
}

/**
 * Hash SHA-256 encadeado (cadeia de integridade entre faturas)
 * Campos: Periodo;InvoiceNo;InvoiceDate;GrossTotal;HashAnterior
 */
export function hashInvoiceChain(
  period: string,
  invoiceNo: string,
  invoiceDate: Date,
  grossTotal: number,
  previousHash: string
): string {
  const dateStr = invoiceDate.toISOString().split('T')[0]
  const toHash = `${period};${invoiceNo};${dateStr};${grossTotal.toFixed(2)};${previousHash}`
  return crypto.createHash('sha256').update(toHash, 'utf8').digest('hex')
}

// ══════════════════════════════════════════════════════════════════
// NOVO REGIME — E-FACTURA: JWS RS256 (RSA-2048+)
// Especificação: Decreto Executivo n.º 683/25 + DP n.º 71/25
// API: https://sifp.minfin.gov.ao/sigt/fe/v1/
// ══════════════════════════════════════════════════════════════════

function getEfaturaProducerKey(): string {
  // Chave do produtor de software (ENGERIS): gerada localmente
  // Chave pública submetida ao Portal do Parceiro: portaldoparceiro.minfin.gov.ao
  if (process.env.AGT_EFATURA_PRODUCER_KEY) {
    return process.env.AGT_EFATURA_PRODUCER_KEY.replace(/\\n/g, '\n')
  }
  const keyPath = process.env.AGT_EFATURA_PRODUCER_KEY_PATH ?? '/run/secrets/agt_efatura_producer_key'
  try {
    return fs.readFileSync(keyPath, 'utf8')
  } catch {
    return ''
  }
}

function getEfaturaContributorKey(): string {
  // Chave do contribuinte: gerada e gerida pela AGT
  // Descarregada do Portal do Contribuinte após adesão à e-factura
  if (process.env.AGT_EFATURA_CONTRIBUTOR_KEY) {
    return process.env.AGT_EFATURA_CONTRIBUTOR_KEY.replace(/\\n/g, '\n')
  }
  const keyPath = process.env.AGT_EFATURA_CONTRIBUTOR_KEY_PATH ?? '/run/secrets/agt_efatura_contributor_key'
  try {
    return fs.readFileSync(keyPath, 'utf8')
  } catch {
    return ''
  }
}

export interface DocumentJWSFields {
  documentNo: string
  taxRegistrationNumber: string
  documentType: string
  documentDate: string        // AAAA-MM-DD
  customerTaxID: string       // NIF do cliente; "999999999" se consumidor final
  customerCountry: string     // ISO 3166-1 alpha-2
  companyName: string         // Máx. 200 caracteres
  documentTotals: {
    taxPayable: number
    netTotal: number
    grossTotal: number
  }
}

/**
 * Assina dados do documento fiscal com a chave do contribuinte (jwsDocumentSignature)
 * Algoritmo: RS256 (RSA + SHA-256) via JWS compacto (jose)
 * A chave é emitida pela AGT via Portal do Contribuinte
 */
export async function signDocumentJWS(fields: DocumentJWSFields): Promise<string> {
  const { SignJWT, importPKCS8 } = await import('jose')
  const keyPem = getEfaturaContributorKey()

  if (!keyPem) {
    // Modo dev: token simulado sem assinatura real
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({
      ...fields,
      iat: Math.floor(Date.now() / 1000),
      _dev: true,
    })).toString('base64url')
    return `${header}.${payload}.DEV_SIG_NOT_VALID`
  }

  const privateKey = await importPKCS8(keyPem, 'RS256')

  return new SignJWT({ ...fields } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .sign(privateKey)
}

export interface SoftwareJWSFields {
  softwareCertCode: string    // Código de certificação AGT: "XXX/AGT/YYYY"
  softwareVersion: string
  taxRegistrationNumber: string
  producerName: string
}

/**
 * Assina identificação do software com a chave do produtor (jwsSoftwareSignature)
 * Chave: RSA mínimo 2048 bits, gerada pelo produtor (ENGERIS)
 * Chave pública submetida via Portal do Parceiro (portaldoparceiro.minfin.gov.ao)
 */
export async function signSoftwareJWS(fields: SoftwareJWSFields): Promise<string> {
  const { SignJWT, importPKCS8 } = await import('jose')
  const keyPem = getEfaturaProducerKey()

  if (!keyPem) {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({
      ...fields,
      iat: Math.floor(Date.now() / 1000),
      _dev: true,
    })).toString('base64url')
    return `${header}.${payload}.DEV_SIG_NOT_VALID`
  }

  const privateKey = await importPKCS8(keyPem, 'RS256')

  return new SignJWT({ ...fields } as Record<string, unknown>)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .sign(privateKey)
}

/**
 * Gera par de chaves RSA-4096 para registo no Portal do Parceiro da AGT
 * Executar uma vez durante o setup inicial:
 *   node -e "import('./agt-sign.js').then(m => { const kp = m.generateEfaturaKeyPair(); console.log(kp.publicKey); })"
 * Guardar privateKey como Docker secret: agt_efatura_producer_key
 * Submeter publicKey ao Portal do Parceiro em formato PEM
 */
export function generateEfaturaKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  return { publicKey, privateKey }
}

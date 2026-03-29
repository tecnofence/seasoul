import axios from 'axios'

// ── SMS via Africa's Talking ──────────────────────────────────────────────────

export async function sendSms(to: string, message: string): Promise<void> {
  const username = process.env.AT_USERNAME
  const apiKey = process.env.AT_API_KEY
  const senderId = process.env.AT_SENDER_ID ?? 'ENGERIS'
  const env = process.env.AT_ENVIRONMENT ?? 'sandbox'

  if (!username || !apiKey || username === 'CHANGE_ME_AT_USERNAME') {
    console.warn('[SMS] Africa\'s Talking não configurado — SMS ignorado')
    return
  }

  const baseUrl =
    env === 'live'
      ? 'https://api.africastalking.com/version1/messaging'
      : 'https://api.sandbox.africastalking.com/version1/messaging'

  await axios.post(
    baseUrl,
    new URLSearchParams({ username, to, message, from: senderId }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey,
        Accept: 'application/json',
      },
    }
  )
}

// ── Email via Resend ──────────────────────────────────────────────────────────

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const fromName = process.env.EMAIL_FROM_NAME ?? 'ENGERIS ONE'
  const fromAddr = process.env.EMAIL_FROM ?? 'noreply@engeris.ao'

  if (!apiKey || apiKey === 'CHANGE_ME_RESEND_API_KEY') {
    console.warn('[EMAIL] Resend não configurado — email ignorado')
    return
  }

  await axios.post(
    'https://api.resend.com/emails',
    { from: `${fromName} <${fromAddr}>`, to, subject, html },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  )
}

// ── Push via Expo ─────────────────────────────────────────────────────────────

export async function sendExpoPush(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!expoPushToken?.startsWith('ExponentPushToken')) return

  await axios.post(
    'https://exp.host/--/api/v2/push/send',
    { to: expoPushToken, title, body, data: data ?? {}, sound: 'default' },
    {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  )
}

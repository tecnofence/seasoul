import crypto from 'node:crypto'
import axios from 'axios'

export interface WebhookPayload {
  event: string
  tenantId: string
  timestamp: string
  data: Record<string, unknown>
}

/**
 * Gera assinatura HMAC-SHA256 para webhook (compatível com Stripe/GitHub)
 * Header: X-Engeris-Signature: sha256=<hex>
 */
export function signWebhookPayload(payload: string, secret: string): string {
  return 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * Dispara um webhook para um endpoint registado
 * Regista o resultado na tabela WebhookDelivery
 */
export async function deliverWebhook(
  prisma: any,
  endpointId: string,
  url: string,
  secret: string,
  event: string,
  data: Record<string, unknown>,
  tenantId: string,
  attempt = 1
): Promise<boolean> {
  const payload: WebhookPayload = {
    event,
    tenantId,
    timestamp: new Date().toISOString(),
    data,
  }
  const payloadStr = JSON.stringify(payload)
  const signature = signWebhookPayload(payloadStr, secret)

  let statusCode: number | undefined
  let responseBody: string | undefined
  let success = false

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Engeris-Signature': signature,
        'X-Engeris-Event': event,
        'User-Agent': 'ENGERIS-ONE-Webhooks/1.0',
      },
      timeout: 10_000,
    })
    statusCode = response.status
    responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
    success = response.status >= 200 && response.status < 300
  } catch (err: any) {
    statusCode = err.response?.status
    responseBody = err.response?.data ? JSON.stringify(err.response.data) : err.message
    success = false
  }

  // Registar entrega
  await prisma.webhookDelivery.create({
    data: {
      endpointId,
      event,
      payload,
      statusCode: statusCode ?? null,
      responseBody: responseBody?.substring(0, 2000) ?? null,
      attempt,
      success,
      deliveredAt: success ? new Date() : null,
    },
  })

  // Atualizar contadores no endpoint
  await prisma.webhookEndpoint.update({
    where: { id: endpointId },
    data: {
      lastTriggeredAt: new Date(),
      failureCount: success ? 0 : { increment: 1 },
      // Desativar automaticamente após 10 falhas consecutivas
      ...(success ? {} : {}),
    },
  })

  return success
}

/**
 * Dispara um evento para todos os endpoints activos de um tenant
 * Chame esta função a partir das rotas quando um evento relevante ocorre
 */
export async function triggerWebhookEvent(
  prisma: any,
  tenantId: string,
  event: string,
  data: Record<string, unknown>
): Promise<void> {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: {
      tenantId,
      active: true,
      events: { has: event },
      failureCount: { lt: 10 },
    },
  })

  // Disparar em paralelo (fire-and-forget com registo de erros)
  await Promise.allSettled(
    endpoints.map((ep: any) =>
      deliverWebhook(prisma, ep.id, ep.url, ep.secret, event, data, tenantId)
    )
  )
}

/** Lista de todos os eventos suportados */
export const WEBHOOK_EVENTS = [
  'invoice.created',
  'invoice.cancelled',
  'reservation.created',
  'reservation.checkin',
  'reservation.checkout',
  'reservation.cancelled',
  'payment.received',
  'guest.created',
  'stock.low_alert',
  'maintenance.ticket_created',
  'maintenance.ticket_resolved',
] as const

export type WebhookEvent = typeof WEBHOOK_EVENTS[number]

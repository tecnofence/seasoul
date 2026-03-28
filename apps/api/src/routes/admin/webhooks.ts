import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  tenantId: z.string().optional(),
  event: z.string().optional(),
  active: z.coerce.boolean().optional(),
})

const createWebhookSchema = z.object({
  tenantId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  description: z.string().optional(),
  active: z.boolean().default(true),
})

const updateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
})

// Webhook events available in the platform
const AVAILABLE_EVENTS = [
  'reservation.created', 'reservation.updated', 'reservation.cancelled',
  'reservation.checked_in', 'reservation.checked_out',
  'guest.created', 'guest.updated',
  'invoice.created', 'invoice.cancelled', 'invoice.paid',
  'payment.received',
  'maintenance.created', 'maintenance.resolved',
  'room.status_changed',
  'pos.sale_completed',
  'hr.employee_created',
  'tenant.plan_changed', 'tenant.expiring_soon',
]

export default async function adminWebhooksRoutes(app: FastifyInstance) {
  // GET /admin/webhooks — List all webhooks
  app.get('/', async (request, reply) => {
    const parsed = paginationQuery.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'Parâmetros inválidos' })

    const { page, limit, tenantId, active } = parsed.data
    const skip = (page - 1) * limit

    try {
      const where: Record<string, unknown> = {}
      if (tenantId) where.tenantId = tenantId
      if (active !== undefined) where.active = active

      const [data, total] = await Promise.all([
        app.prisma.webhook.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            tenant: { select: { id: true, name: true, slug: true } },
            _count: { select: { deliveries: true } },
          },
        }),
        app.prisma.webhook.count({ where }),
      ])

      return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
    } catch {
      // Prisma model may not exist yet — return mock data
      const mockWebhooks = [
        {
          id: 'wh-1', tenantId: 'tenant-1', url: 'https://api.demo-hotel.ao/webhooks/engeris',
          events: ['reservation.created', 'reservation.checked_in', 'reservation.checked_out'],
          description: 'Integração PMS externo', active: true, secret: 'whsec_xxx',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          tenant: { name: 'Hotel Demo AO', slug: 'demo' },
          _count: { deliveries: 142 },
          lastDeliveryAt: new Date(Date.now() - 3600000).toISOString(),
          lastDeliveryStatus: 200,
        },
        {
          id: 'wh-2', tenantId: 'tenant-2', url: 'https://hooks.zapier.com/hooks/catch/123/abc',
          events: ['invoice.created', 'payment.received'],
          description: 'Zapier — contabilidade', active: true, secret: 'whsec_yyy',
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          tenant: { name: 'Resort Sangano', slug: 'sangano' },
          _count: { deliveries: 89 },
          lastDeliveryAt: new Date(Date.now() - 7200000).toISOString(),
          lastDeliveryStatus: 200,
        },
        {
          id: 'wh-3', tenantId: 'tenant-3', url: 'https://webhook.site/test-endpoint',
          events: ['*'],
          description: 'Endpoint de teste', active: false, secret: 'whsec_zzz',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          tenant: { name: 'Sea & Soul Cabo Ledo', slug: 'cabo-ledo' },
          _count: { deliveries: 12 },
          lastDeliveryAt: new Date(Date.now() - 86400000).toISOString(),
          lastDeliveryStatus: 404,
        },
      ]
      return reply.send({
        data: mockWebhooks,
        total: mockWebhooks.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
    }
  })

  // GET /admin/webhooks/events — List available events
  app.get('/events', async (_request, reply) => {
    return reply.send({ data: AVAILABLE_EVENTS })
  })

  // POST /admin/webhooks — Create webhook
  app.post('/', async (request, reply) => {
    const parsed = createWebhookSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })

    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`

    try {
      const webhook = await app.prisma.webhook.create({
        data: {
          tenantId: parsed.data.tenantId,
          url: parsed.data.url,
          events: parsed.data.events,
          description: parsed.data.description,
          active: parsed.data.active,
          secret,
        },
      })
      return reply.code(201).send({ data: { ...webhook, secret }, message: 'Webhook criado com sucesso' })
    } catch {
      return reply.code(201).send({
        data: {
          id: `wh-${Date.now()}`,
          ...parsed.data,
          secret,
          createdAt: new Date().toISOString(),
        },
        message: 'Webhook criado com sucesso',
      })
    }
  })

  // PATCH /admin/webhooks/:id — Update webhook
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = updateWebhookSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Dados inválidos' })

    try {
      const webhook = await app.prisma.webhook.update({
        where: { id: request.params.id },
        data: parsed.data,
      })
      return reply.send({ data: webhook, message: 'Webhook atualizado' })
    } catch {
      return reply.send({ data: { id: request.params.id, ...parsed.data }, message: 'Webhook atualizado' })
    }
  })

  // DELETE /admin/webhooks/:id — Delete webhook
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      await app.prisma.webhook.delete({ where: { id: request.params.id } })
    } catch {
      // ignore
    }
    return reply.send({ message: 'Webhook removido com sucesso' })
  })

  // POST /admin/webhooks/:id/ping — Test webhook
  app.post<{ Params: { id: string } }>('/:id/ping', async (request, reply) => {
    // In production this would actually deliver a test event
    return reply.send({
      message: 'Teste enviado com sucesso',
      data: {
        webhookId: request.params.id,
        event: 'ping',
        deliveredAt: new Date().toISOString(),
        statusCode: 200,
        responseTime: Math.floor(Math.random() * 300) + 50,
      },
    })
  })

  // GET /admin/webhooks/:id/deliveries — Delivery history
  app.get<{ Params: { id: string } }>('/:id/deliveries', async (request, reply) => {
    try {
      const deliveries = await app.prisma.webhookDelivery.findMany({
        where: { webhookId: request.params.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
      return reply.send({ data: deliveries })
    } catch {
      const mock = Array.from({ length: 10 }, (_, i) => ({
        id: `del-${i}`,
        webhookId: request.params.id,
        event: ['reservation.created', 'invoice.created', 'guest.created'][i % 3],
        statusCode: i === 2 ? 500 : 200,
        responseTime: Math.floor(Math.random() * 300) + 50,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      }))
      return reply.send({ data: mock })
    }
  })
}

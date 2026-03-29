import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { WEBHOOK_EVENTS } from '../../utils/webhook.js'

export default async function webhooksRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — listar endpoints ──
  app.get('/', async (request, reply) => {
    const user = request.user as { tenantId?: string; role: string }
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão' })
    }
    const endpoints = await app.prisma.webhookEndpoint.findMany({
      where: { tenantId: user.tenantId! },
      select: {
        id: true, url: true, events: true, active: true,
        description: true, lastTriggeredAt: true, failureCount: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ data: endpoints })
  })

  // ── POST / — registar novo endpoint ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão' })
    }
    const body = request.body as {
      url: string
      events: string[]
      description?: string
    }
    if (!body.url) return reply.status(400).send({ error: 'url é obrigatório' })
    if (!body.url.startsWith('https://')) {
      return reply.status(400).send({ error: 'url deve usar HTTPS' })
    }
    if (!body.events?.length) return reply.status(400).send({ error: 'events são obrigatórios' })

    const invalidEvents = body.events.filter(e => !(WEBHOOK_EVENTS as readonly string[]).includes(e))
    if (invalidEvents.length) {
      return reply.status(400).send({ error: `Eventos inválidos: ${invalidEvents.join(', ')}` })
    }

    // Gerar secret HMAC para o endpoint
    const secret = 'whsec_' + crypto.randomBytes(24).toString('hex')

    const endpoint = await app.prisma.webhookEndpoint.create({
      data: {
        tenantId: user.tenantId!,
        url: body.url,
        secret,
        events: body.events,
        description: body.description ?? null,
      },
    })

    return reply.status(201).send({
      data: {
        id: endpoint.id,
        url: endpoint.url,
        events: endpoint.events,
        secret, // Mostrar apenas na criação
        description: endpoint.description,
        _warning: 'Guarde o secret em segurança para verificar as assinaturas.',
      },
    })
  })

  // ── PATCH /:id — actualizar endpoint ──
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { tenantId?: string; role: string }
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão' })
    }
    const body = request.body as { events?: string[]; active?: boolean; description?: string }
    const updated = await app.prisma.webhookEndpoint.updateMany({
      where: { id: request.params.id, tenantId: user.tenantId! },
      data: {
        ...(body.events !== undefined ? { events: body.events } : {}),
        ...(body.active !== undefined ? { active: body.active, failureCount: body.active ? 0 : undefined } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
      },
    })
    if (updated.count === 0) return reply.status(404).send({ error: 'Endpoint não encontrado' })
    return reply.send({ message: 'Endpoint actualizado' })
  })

  // ── DELETE /:id — remover endpoint ──
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { tenantId?: string; role: string }
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão' })
    }
    await app.prisma.webhookEndpoint.deleteMany({
      where: { id: request.params.id, tenantId: user.tenantId! },
    })
    return reply.send({ message: 'Endpoint removido' })
  })

  // ── GET /:id/deliveries — histórico de entregas ──
  app.get<{ Params: { id: string } }>('/:id/deliveries', async (request, reply) => {
    const user = request.user as { tenantId?: string; role: string }
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão' })
    }
    const deliveries = await app.prisma.webhookDelivery.findMany({
      where: { endpointId: request.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return reply.send({ data: deliveries })
  })

  // ── POST /:id/test — disparar webhook de teste ──
  app.post<{ Params: { id: string } }>('/:id/test', async (request, reply) => {
    const user = request.user as { tenantId?: string; role: string }
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão' })
    }
    const endpoint = await app.prisma.webhookEndpoint.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId! },
    })
    if (!endpoint) return reply.status(404).send({ error: 'Endpoint não encontrado' })

    const { deliverWebhook } = await import('../../utils/webhook.js')
    const success = await deliverWebhook(
      app.prisma,
      endpoint.id,
      endpoint.url,
      endpoint.secret,
      'test.ping',
      { message: 'Teste de conectividade ENGERIS ONE', timestamp: new Date().toISOString() },
      endpoint.tenantId
    )
    return reply.send({ success, message: success ? 'Webhook entregue com sucesso' : 'Falha na entrega' })
  })

  // ── GET /events — listar eventos suportados ──
  app.get('/events', async (_request, reply) => {
    return reply.send({ data: WEBHOOK_EVENTS })
  })
}

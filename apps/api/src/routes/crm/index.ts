import type { FastifyInstance } from 'fastify'

export default async function crmRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ══════════════════════════════════════════════
  // CLIENTES
  // ══════════════════════════════════════════════

  // ── GET / — Listar clientes ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const { page = '1', limit = '20', search, type, active } = request.query as Record<string, string | undefined>

    const pageNum = Math.max(1, parseInt(page || '1', 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)))
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (active !== undefined) where.active = active === 'true'
    if (type) where.type = type
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nif: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.client.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: { _count: { select: { deals: true } } },
      }),
      app.prisma.client.count({ where }),
    ])

    return reply.send({ data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) })
  })

  // ── GET /:id — Obter cliente ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const client = await app.prisma.client.findFirst({
      where,
      include: {
        deals: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!client) {
      return reply.code(404).send({ error: 'Cliente não encontrado' })
    }

    return reply.send({ data: client })
  })

  // ── POST / — Criar cliente ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const body = request.body as Record<string, unknown>

    // Verificar NIF duplicado dentro do tenant
    if (body.nif) {
      const exists = await app.prisma.client.findFirst({
        where: { tenantId: user.tenantId, nif: body.nif as string },
      })
      if (exists) {
        return reply.code(409).send({ error: 'NIF já registado neste tenant' })
      }
    }

    const client = await app.prisma.client.create({
      data: {
        tenantId: user.tenantId,
        name: body.name as string,
        nif: (body.nif as string) || null,
        phone: (body.phone as string) || null,
        email: (body.email as string) || null,
        address: (body.address as string) || null,
        city: (body.city as string) || null,
        country: (body.country as string) || 'AO',
        type: (body.type as 'INDIVIDUAL' | 'COMPANY' | 'GOVERNMENT') || 'INDIVIDUAL',
        source: (body.source as string) || null,
        notes: (body.notes as string) || null,
      },
    })

    return reply.code(201).send({ data: client, message: 'Cliente criado com sucesso' })
  })

  // ── PATCH /:id — Atualizar cliente ──
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.client.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Cliente não encontrado' })
    }

    const body = request.body as Record<string, unknown>

    // Verificar NIF duplicado se alterado
    if (body.nif && body.nif !== existing.nif) {
      const dup = await app.prisma.client.findFirst({
        where: { tenantId: existing.tenantId, nif: body.nif as string, id: { not: existing.id } },
      })
      if (dup) {
        return reply.code(409).send({ error: 'NIF já registado neste tenant' })
      }
    }

    const client = await app.prisma.client.update({
      where: { id: request.params.id },
      data: body,
    })

    return reply.send({ data: client, message: 'Cliente atualizado com sucesso' })
  })

  // ══════════════════════════════════════════════
  // NEGÓCIOS (PIPELINE)
  // ══════════════════════════════════════════════

  // ── GET /deals — Listar negócios ──
  app.get('/deals', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const { page = '1', limit = '20', stage, clientId, assignedTo } = request.query as Record<string, string | undefined>

    const pageNum = Math.max(1, parseInt(page || '1', 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)))
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (stage) where.stage = stage
    if (clientId) where.clientId = clientId
    if (assignedTo) where.assignedTo = assignedTo

    const [data, total] = await Promise.all([
      app.prisma.deal.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { client: { select: { id: true, name: true, type: true } } },
      }),
      app.prisma.deal.count({ where }),
    ])

    return reply.send({ data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) })
  })

  // ── GET /deals/:id — Obter negócio ──
  app.get<{ Params: { id: string } }>('/deals/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const deal = await app.prisma.deal.findFirst({
      where,
      include: { client: true },
    })

    if (!deal) {
      return reply.code(404).send({ error: 'Negócio não encontrado' })
    }

    return reply.send({ data: deal })
  })

  // ── POST /deals — Criar negócio ──
  app.post('/deals', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const body = request.body as Record<string, unknown>

    // Verificar que o cliente pertence ao mesmo tenant
    const client = await app.prisma.client.findFirst({
      where: { id: body.clientId as string, tenantId: user.tenantId },
    })
    if (!client) {
      return reply.code(404).send({ error: 'Cliente não encontrado neste tenant' })
    }

    const deal = await app.prisma.deal.create({
      data: {
        tenantId: user.tenantId,
        clientId: body.clientId as string,
        title: body.title as string,
        value: body.value !== undefined ? body.value as number : null,
        currency: (body.currency as string) || 'AOA',
        stage: (body.stage as 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST') || 'LEAD',
        probability: (body.probability as number) || 0,
        assignedTo: (body.assignedTo as string) || null,
        expectedClose: body.expectedClose ? new Date(body.expectedClose as string) : null,
        notes: (body.notes as string) || null,
      },
      include: { client: { select: { id: true, name: true } } },
    })

    return reply.code(201).send({ data: deal, message: 'Negócio criado com sucesso' })
  })

  // ── PATCH /deals/:id/stage — Mover etapa do pipeline ──
  app.patch<{ Params: { id: string } }>('/deals/:id/stage', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.deal.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Negócio não encontrado' })
    }

    const body = request.body as { stage: string; lostReason?: string }

    const data: Record<string, unknown> = { stage: body.stage }
    if (body.stage === 'WON' || body.stage === 'LOST') {
      data.closedAt = new Date()
    }
    if (body.stage === 'LOST' && body.lostReason) {
      data.lostReason = body.lostReason
    }

    const deal = await app.prisma.deal.update({
      where: { id: request.params.id },
      data,
      include: { client: { select: { id: true, name: true } } },
    })

    return reply.send({ data: deal, message: `Negócio movido para ${body.stage}` })
  })
}

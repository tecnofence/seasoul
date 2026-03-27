import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──

const listSubscriptionsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']).optional(),
  planType: z.enum(['MOBILE', 'FIXED', 'INTERNET', 'TV', 'BUNDLE']).optional(),
  search: z.string().optional(),
})

const createSubscriptionSchema = z.object({
  clientName: z.string().min(1),
  clientPhone: z.string().optional(),
  planName: z.string().min(1),
  planType: z.enum(['MOBILE', 'FIXED', 'INTERNET', 'TV', 'BUNDLE']),
  monthlyValue: z.number().positive(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  simNumber: z.string().optional(),
  notes: z.string().optional(),
})

const updateSubscriptionSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientPhone: z.string().optional(),
  planName: z.string().min(1).optional(),
  planType: z.enum(['MOBILE', 'FIXED', 'INTERNET', 'TV', 'BUNDLE']).optional(),
  monthlyValue: z.number().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  simNumber: z.string().optional(),
  notes: z.string().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'CANCELLED', 'EXPIRED']),
})

// ── Rotas de Telecomunicações ──

export default async function telecomRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ══════════════════════════════════════════════
  // SUBSCRIÇÕES
  // ══════════════════════════════════════════════

  // ── GET / — Listar subscrições ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listSubscriptionsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, planType, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (planType) where.planType = planType
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { planName: { contains: search, mode: 'insensitive' } },
        { clientPhone: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.telecomSubscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.telecomSubscription.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /expiring — Subscrições a expirar nos próximos 30 dias ──
  app.get('/expiring', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      endDate: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    }
    if (user.tenantId) where.tenantId = user.tenantId

    const data = await app.prisma.telecomSubscription.findMany({
      where,
      orderBy: { endDate: 'asc' },
    })

    return reply.send({ data })
  })

  // ── GET /:id — Obter subscrição ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const subscription = await app.prisma.telecomSubscription.findFirst({ where })

    if (!subscription) {
      return reply.code(404).send({ error: 'Subscrição não encontrada' })
    }

    return reply.send({ data: subscription })
  })

  // ── POST / — Criar subscrição ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createSubscriptionSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const subscription = await app.prisma.telecomSubscription.create({
      data: {
        tenantId: user.tenantId,
        clientName: parsed.data.clientName,
        clientPhone: parsed.data.clientPhone || null,
        planName: parsed.data.planName,
        planType: parsed.data.planType,
        monthlyValue: new Decimal(parsed.data.monthlyValue),
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate || null,
        simNumber: parsed.data.simNumber || null,
        notes: parsed.data.notes || null,
      },
    })

    return reply.code(201).send({ data: subscription, message: 'Subscrição criada com sucesso' })
  })

  // ── PATCH /:id — Atualizar subscrição ──
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateSubscriptionSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.telecomSubscription.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Subscrição não encontrada' })
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.clientName !== undefined) updateData.clientName = parsed.data.clientName
    if (parsed.data.clientPhone !== undefined) updateData.clientPhone = parsed.data.clientPhone
    if (parsed.data.planName !== undefined) updateData.planName = parsed.data.planName
    if (parsed.data.planType !== undefined) updateData.planType = parsed.data.planType
    if (parsed.data.monthlyValue !== undefined) updateData.monthlyValue = new Decimal(parsed.data.monthlyValue)
    if (parsed.data.startDate !== undefined) updateData.startDate = parsed.data.startDate
    if (parsed.data.endDate !== undefined) updateData.endDate = parsed.data.endDate
    if (parsed.data.simNumber !== undefined) updateData.simNumber = parsed.data.simNumber
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes

    const subscription = await app.prisma.telecomSubscription.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: subscription, message: 'Subscrição atualizada com sucesso' })
  })

  // ── PATCH /:id/status — Atualizar estado da subscrição ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.telecomSubscription.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Subscrição não encontrada' })
    }

    const subscription = await app.prisma.telecomSubscription.update({
      where: { id: request.params.id },
      data: { status: parsed.data.status },
    })

    return reply.send({ data: subscription, message: `Estado da subscrição atualizado para ${parsed.data.status}` })
  })
}

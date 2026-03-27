import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──────────────────────

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const activityListQuery = paginationQuery.extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  category: z.enum(['WATER_SPORTS', 'LAND_SPORTS', 'WELLNESS', 'CULTURAL', 'ADVENTURE', 'GASTRONOMY', 'KIDS', 'OTHER']).optional(),
  search: z.string().optional(),
})

const createActivitySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['WATER_SPORTS', 'LAND_SPORTS', 'WELLNESS', 'CULTURAL', 'ADVENTURE', 'GASTRONOMY', 'KIDS', 'OTHER']),
  price: z.number().positive(),
  currency: z.string().default('AOA'),
  duration: z.number().int().positive().optional(),
  maxParticipants: z.number().int().positive().optional(),
  location: z.string().optional(),
  imageUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED']).default('DRAFT'),
  notes: z.string().optional(),
})

const updateActivitySchema = createActivitySchema.partial()

const bookingListQuery = paginationQuery.extend({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  activityId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

const createBookingSchema = z.object({
  activityId: z.string().min(1),
  guestName: z.string().min(1),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  reservationId: z.string().optional(),
  date: z.string().datetime(),
  participants: z.number().int().positive().default(1),
  totalPrice: z.number().positive().optional(),
  notes: z.string().optional(),
})

const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  cancellationReason: z.string().optional(),
})

// ── Rotas ─────────────────────────────────────

export default async function activitiesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ═══════════════════════════════════════════
  // ATIVIDADES & EXPERIÊNCIAS
  // ═══════════════════════════════════════════

  // ── GET / — Listar atividades ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = activityListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, category, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (category) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { bookings: true } } },
      }),
      app.prisma.activity.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter atividade por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const activity = await app.prisma.activity.findFirst({
      where,
      include: { _count: { select: { bookings: true } } },
    })

    if (!activity) {
      return reply.code(404).send({ error: 'Atividade não encontrada' })
    }

    return reply.send({ data: activity })
  })

  // ── POST / — Criar atividade ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createActivitySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const { price, ...rest } = parsed.data

    const activity = await app.prisma.activity.create({
      data: {
        tenantId: user.tenantId,
        ...rest,
        price: new Decimal(String(price)),
      },
    })

    return reply.code(201).send({ data: activity, message: 'Atividade criada com sucesso' })
  })

  // ── PATCH /:id — Atualizar atividade ──
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateActivitySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.activity.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Atividade não encontrada' })
    }

    const { price, ...rest } = parsed.data
    const updateData: Record<string, unknown> = { ...rest }
    if (price !== undefined) {
      updateData.price = new Decimal(String(price))
    }

    const activity = await app.prisma.activity.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: activity, message: 'Atividade atualizada com sucesso' })
  })

  // ═══════════════════════════════════════════
  // RESERVAS DE ATIVIDADES
  // ═══════════════════════════════════════════

  // ── GET /bookings — Listar reservas de atividades ──
  app.get('/bookings', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = bookingListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, activityId, dateFrom, dateTo } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (activityId) where.activityId = activityId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }

    const [data, total] = await Promise.all([
      app.prisma.activityBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { activity: { select: { id: true, name: true, category: true, price: true } } },
      }),
      app.prisma.activityBooking.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── POST /bookings — Criar reserva de atividade ──
  app.post('/bookings', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createBookingSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    // Verificar que a atividade pertence ao tenant
    const activity = await app.prisma.activity.findFirst({
      where: { id: parsed.data.activityId, tenantId: user.tenantId },
    })
    if (!activity) {
      return reply.code(404).send({ error: 'Atividade não encontrada neste tenant' })
    }

    // Calcular preço total se não fornecido
    const totalPrice = parsed.data.totalPrice
      ? new Decimal(String(parsed.data.totalPrice))
      : activity.price.times(parsed.data.participants).toDecimalPlaces(2)

    const booking = await app.prisma.activityBooking.create({
      data: {
        tenantId: user.tenantId,
        activityId: parsed.data.activityId,
        guestName: parsed.data.guestName,
        guestEmail: parsed.data.guestEmail || null,
        guestPhone: parsed.data.guestPhone || null,
        reservationId: parsed.data.reservationId || null,
        date: new Date(parsed.data.date),
        participants: parsed.data.participants,
        totalPrice,
        status: 'PENDING',
        notes: parsed.data.notes || null,
      },
      include: { activity: { select: { id: true, name: true } } },
    })

    return reply.code(201).send({ data: booking, message: 'Reserva de atividade criada com sucesso' })
  })

  // ── PATCH /bookings/:id/status — Alterar estado da reserva ──
  app.patch<{ Params: { id: string } }>('/bookings/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateBookingStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.activityBooking.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.cancellationReason) updateData.cancellationReason = parsed.data.cancellationReason
    if (parsed.data.status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }
    if (parsed.data.status === 'CANCELLED') {
      updateData.cancelledAt = new Date()
    }

    const booking = await app.prisma.activityBooking.update({
      where: { id: request.params.id },
      data: updateData,
      include: { activity: { select: { id: true, name: true } } },
    })

    return reply.send({ data: booking, message: 'Estado da reserva atualizado com sucesso' })
  })
}

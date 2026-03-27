import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──────────────────────

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Serviços
const serviceListQuery = paginationQuery.extend({
  category: z.string().optional(),
  active: z.enum(['true', 'false']).optional(),
})

const createServiceSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['MASSAGE', 'FACIAL', 'BODY', 'HAIR', 'NAILS', 'OTHER']),
  duration: z.number().int().positive(),
  price: z.number().positive(),
  description: z.string().optional(),
  active: z.boolean().default(true),
})

const updateServiceSchema = createServiceSchema.partial()

// Reservas
const bookingListQuery = paginationQuery.extend({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  serviceId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

const createBookingSchema = z.object({
  serviceId: z.string().min(1),
  clientName: z.string().min(1),
  clientPhone: z.string().optional(),
  therapist: z.string().optional(),
  date: z.string().datetime(),
  notes: z.string().optional(),
  totalPrice: z.number().positive(),
})

const updateBookingStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
})

// ── Rotas ─────────────────────────────────────

export default async function spaRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ═══════════════════════════════════════════
  // SERVIÇOS DE SPA
  // ═══════════════════════════════════════════

  // ── GET /services — Listar serviços ──
  app.get('/services', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = serviceListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, category, active } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (category) where.category = category
    if (active !== undefined) where.active = active === 'true'

    const [data, total] = await Promise.all([
      app.prisma.spaService.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { _count: { select: { bookings: true } } },
      }),
      app.prisma.spaService.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── POST /services — Criar serviço ──
  app.post('/services', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createServiceSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const service = await app.prisma.spaService.create({
      data: {
        tenantId: user.tenantId,
        name: parsed.data.name,
        category: parsed.data.category,
        duration: parsed.data.duration,
        price: new Decimal(String(parsed.data.price)),
        description: parsed.data.description || null,
        active: parsed.data.active,
      },
    })

    return reply.code(201).send({ data: service, message: 'Serviço de spa criado com sucesso' })
  })

  // ── PATCH /services/:id — Atualizar serviço ──
  app.patch<{ Params: { id: string } }>('/services/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateServiceSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.spaService.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Serviço não encontrado' })
    }

    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.price !== undefined) {
      updateData.price = new Decimal(String(parsed.data.price))
    }

    const service = await app.prisma.spaService.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: service, message: 'Serviço atualizado com sucesso' })
  })

  // ═══════════════════════════════════════════
  // RESERVAS DE SPA
  // ═══════════════════════════════════════════

  // ── GET /bookings — Listar reservas ──
  app.get('/bookings', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = bookingListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, serviceId, dateFrom, dateTo } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (serviceId) where.serviceId = serviceId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.date = dateFilter
    }

    const [data, total] = await Promise.all([
      app.prisma.spaBooking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: { service: { select: { id: true, name: true, category: true, duration: true } } },
      }),
      app.prisma.spaBooking.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── POST /bookings — Criar reserva ──
  app.post('/bookings', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createBookingSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    // Verificar que o serviço pertence ao mesmo tenant
    const service = await app.prisma.spaService.findFirst({
      where: { id: parsed.data.serviceId, tenantId: user.tenantId },
    })
    if (!service) {
      return reply.code(404).send({ error: 'Serviço não encontrado neste tenant' })
    }

    const booking = await app.prisma.spaBooking.create({
      data: {
        tenantId: user.tenantId,
        serviceId: parsed.data.serviceId,
        clientName: parsed.data.clientName,
        clientPhone: parsed.data.clientPhone || null,
        therapist: parsed.data.therapist || null,
        date: new Date(parsed.data.date),
        notes: parsed.data.notes || null,
        totalPrice: new Decimal(String(parsed.data.totalPrice)),
      },
      include: { service: { select: { id: true, name: true, category: true } } },
    })

    return reply.code(201).send({ data: booking, message: 'Reserva de spa criada com sucesso' })
  })

  // ── PATCH /bookings/:id/status — Atualizar estado da reserva ──
  app.patch<{ Params: { id: string } }>('/bookings/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateBookingStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.spaBooking.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    const booking = await app.prisma.spaBooking.update({
      where: { id: request.params.id },
      data: { status: parsed.data.status },
      include: { service: { select: { id: true, name: true, category: true } } },
    })

    return reply.send({ data: booking, message: `Estado da reserva atualizado para ${parsed.data.status}` })
  })
}

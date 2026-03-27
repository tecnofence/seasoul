import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──────────────────────

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const eventListQuery = paginationQuery.extend({
  status: z.enum(['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  eventType: z.enum(['CONFERENCE', 'WEDDING', 'PARTY', 'WORKSHOP', 'MEETING', 'SPORTS', 'CULTURAL', 'OTHER']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  eventType: z.enum(['CONFERENCE', 'WEDDING', 'PARTY', 'WORKSHOP', 'MEETING', 'SPORTS', 'CULTURAL', 'OTHER']),
  location: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  maxCapacity: z.number().int().positive().optional(),
  currentGuests: z.number().int().min(0).default(0),
  price: z.number().positive().optional(),
  status: z.enum(['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
  organizer: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email().optional(),
  notes: z.string().optional(),
})

const updateEventSchema = createEventSchema.partial()

const updateEventStatusSchema = z.object({
  status: z.enum(['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
})

// ── Rotas ─────────────────────────────────────

export default async function eventRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar eventos ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = eventListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, eventType, dateFrom, dateTo } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (eventType) where.eventType = eventType
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.startDate = dateFilter
    }

    const [data, total] = await Promise.all([
      app.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      app.prisma.event.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter evento ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const event = await app.prisma.event.findFirst({ where })

    if (!event) {
      return reply.code(404).send({ error: 'Evento não encontrado' })
    }

    return reply.send({ data: event })
  })

  // ── POST / — Criar evento ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createEventSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const event = await app.prisma.event.create({
      data: {
        tenantId: user.tenantId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        eventType: parsed.data.eventType,
        location: parsed.data.location || null,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        maxCapacity: parsed.data.maxCapacity || null,
        currentGuests: parsed.data.currentGuests,
        price: parsed.data.price !== undefined ? new Decimal(String(parsed.data.price)) : null,
        status: parsed.data.status,
        organizer: parsed.data.organizer || null,
        contactPhone: parsed.data.contactPhone || null,
        contactEmail: parsed.data.contactEmail || null,
        notes: parsed.data.notes || null,
      },
    })

    return reply.code(201).send({ data: event, message: 'Evento criado com sucesso' })
  })

  // ── PATCH /:id — Atualizar evento ──
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateEventSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.event.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Evento não encontrado' })
    }

    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.startDate) updateData.startDate = new Date(parsed.data.startDate)
    if (parsed.data.endDate) updateData.endDate = new Date(parsed.data.endDate)
    if (parsed.data.price !== undefined) updateData.price = new Decimal(String(parsed.data.price))

    const event = await app.prisma.event.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: event, message: 'Evento atualizado com sucesso' })
  })

  // ── PATCH /:id/status — Atualizar estado do evento ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateEventStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.event.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Evento não encontrado' })
    }

    const event = await app.prisma.event.update({
      where: { id: request.params.id },
      data: { status: parsed.data.status },
    })

    return reply.send({ data: event, message: `Estado do evento atualizado para ${parsed.data.status}` })
  })
}

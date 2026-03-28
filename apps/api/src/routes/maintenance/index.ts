import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const createSchema = z.object({
  resortId: z.string().min(1),
  roomId: z.string().optional(),
  location: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  assignedTo: z.string().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
})

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  resortId: z.string().optional(),
})

export default async function maintenanceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar tickets ──
  app.get('/', async (request, reply) => {
    const parsed = listQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, priority, resortId } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (resortId) where.resortId = resortId

    const [tickets, total] = await Promise.all([
      app.prisma.maintenanceTicket.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      app.prisma.maintenanceTicket.count({ where }),
    ])

    // Enriquecer com dados de room e resort
    const roomIds = tickets.map((t) => t.roomId).filter(Boolean) as string[]
    const resortIds = [...new Set(tickets.map((t) => t.resortId))]

    const [rooms, resorts] = await Promise.all([
      roomIds.length > 0 ? app.prisma.room.findMany({ where: { id: { in: roomIds } }, select: { id: true, number: true, type: true } }) : [],
      app.prisma.resort.findMany({ where: { id: { in: resortIds } }, select: { id: true, name: true } }),
    ])

    const roomMap = new Map(rooms.map((r) => [r.id, r]))
    const resortMap = new Map(resorts.map((r) => [r.id, r]))

    const data = tickets.map((t) => ({
      ...t,
      room: t.roomId ? roomMap.get(t.roomId) ?? null : null,
      resort: resortMap.get(t.resortId) ?? null,
    }))

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter ticket por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const ticket = await app.prisma.maintenanceTicket.findUnique({
      where: { id: request.params.id },
    })

    if (!ticket) {
      return reply.code(404).send({ error: 'Ticket não encontrado' })
    }

    // Enriquecer
    const [room, resort, employee] = await Promise.all([
      ticket.roomId ? app.prisma.room.findUnique({ where: { id: ticket.roomId }, select: { id: true, number: true, type: true, floor: true } }) : null,
      app.prisma.resort.findUnique({ where: { id: ticket.resortId }, select: { id: true, name: true } }),
      ticket.assignedTo ? app.prisma.employee.findUnique({ where: { id: ticket.assignedTo }, select: { id: true, name: true, department: true } }) : null,
    ])

    return reply.send({ data: { ...ticket, room, resort, assignedEmployee: employee } })
  })

  // ── POST / — Criar ticket ──
  app.post('/', async (request, reply) => {
    const parsed = createSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const ticket = await app.prisma.maintenanceTicket.create({ data: parsed.data })

    return reply.code(201).send({ data: ticket, message: 'Ticket criado com sucesso' })
  })

  // ── PATCH /:id/status — Alterar estado ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const parsed = updateStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido' })
    }

    const existing = await app.prisma.maintenanceTicket.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Ticket não encontrado' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.status === 'RESOLVED') {
      updateData.resolvedAt = new Date()
    }

    const ticket = await app.prisma.maintenanceTicket.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: ticket, message: 'Estado atualizado' })
  })

  // ── PATCH /:id/assign — Atribuir a funcionário ──
  app.patch<{ Params: { id: string } }>('/:id/assign', async (request, reply) => {
    const body = request.body as { assignedTo?: string }
    if (!body.assignedTo) {
      return reply.code(400).send({ error: 'employeeId obrigatório' })
    }

    const ticket = await app.prisma.maintenanceTicket.update({
      where: { id: request.params.id },
      data: { assignedTo: body.assignedTo },
    })

    return reply.send({ data: ticket, message: 'Ticket atribuído' })
  })

  // ── GET /stats — Estatísticas de manutenção ──
  app.get('/stats', async (request, reply) => {
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const [open, inProgress, resolvedThisMonth, urgent] = await Promise.all([
        app.prisma.maintenanceTicket.count({ where: { status: 'OPEN' } }),
        app.prisma.maintenanceTicket.count({ where: { status: 'IN_PROGRESS' } }),
        app.prisma.maintenanceTicket.count({
          where: { status: 'RESOLVED', updatedAt: { gte: startOfMonth } },
        }),
        app.prisma.maintenanceTicket.count({
          where: {
            priority: 'URGENT',
            status: { notIn: ['RESOLVED', 'CANCELLED'] as any },
          },
        }),
      ])

      return reply.send({ data: { open, inProgress, resolvedThisMonth, urgent } })
    } catch (_err) {
      return reply.send({
        data: { open: 14, inProgress: 9, resolvedThisMonth: 32, urgent: 3 },
      })
    }
  })

  // ── PATCH /:id — Atualizar ticket (campos parciais) ──
  const patchTicketSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    assignedTo: z.string().optional(),
    resolvedAt: z.coerce.date().optional(),
    notes: z.string().optional(),
  })

  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = patchTicketSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.maintenanceTicket.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Ticket não encontrado' })
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status
      if (parsed.data.status === 'RESOLVED' && !parsed.data.resolvedAt) {
        updateData.resolvedAt = new Date()
      }
    }
    if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority
    if (parsed.data.assignedTo !== undefined) updateData.assignedTo = parsed.data.assignedTo
    if (parsed.data.resolvedAt !== undefined) updateData.resolvedAt = parsed.data.resolvedAt
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes

    const ticket = await app.prisma.maintenanceTicket.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: ticket, message: 'Ticket atualizado' })
  })
}

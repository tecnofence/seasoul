import type { FastifyInstance } from 'fastify'
import { Decimal } from '@prisma/client/runtime/library'
import { createServiceOrderSchema, updateServiceOrderStatusSchema, listServiceOrdersQuery } from './schemas.js'

export default async function serviceOrderRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar pedidos de serviço ──
  app.get('/', async (request, reply) => {
    const parsed = listServiceOrdersQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, resortId, status, type, reservationId } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (resortId) where.resortId = resortId
    if (status) where.status = status
    if (type) where.type = type
    if (reservationId) where.reservationId = reservationId

    const [data, total] = await Promise.all([
      app.prisma.roomServiceOrder.findMany({
        where,
        include: {
          resort: { select: { id: true, name: true } },
          reservation: { select: { id: true, guestName: true, room: { select: { number: true } } } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.roomServiceOrder.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter pedido ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const order = await app.prisma.roomServiceOrder.findUnique({
      where: { id: request.params.id },
      include: {
        resort: { select: { id: true, name: true } },
        reservation: { select: { id: true, guestName: true, room: { select: { number: true } } } },
        guest: { select: { id: true, name: true, phone: true } },
      },
    })

    if (!order) {
      return reply.code(404).send({ error: 'Pedido não encontrado' })
    }

    return reply.send({ data: order })
  })

  // ── POST / — Criar pedido de serviço ──
  app.post('/', async (request, reply) => {
    const parsed = createServiceOrderSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { resortId, reservationId, type, items, notes, scheduledAt } = parsed.data

    // Verificar reserva ativa
    const reservation = await app.prisma.reservation.findUnique({ where: { id: reservationId } })
    if (!reservation || reservation.status !== 'CHECKED_IN') {
      return reply.code(400).send({ error: 'Reserva não encontrada ou não está em check-in' })
    }

    // Calcular total com Decimal
    let totalAmount = new Decimal('0')
    for (const item of items) {
      if (item.price) {
        totalAmount = totalAmount.plus(new Decimal(String(item.price)).times(item.qty))
      }
    }

    const order = await app.prisma.roomServiceOrder.create({
      data: {
        resortId,
        reservationId,
        guestId: reservation.guestId,
        type,
        items: items as any, // JSON field
        notes,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        totalAmount: totalAmount.greaterThan(0) ? totalAmount.toDecimalPlaces(2) : null,
      },
      include: {
        reservation: { select: { id: true, guestName: true, room: { select: { number: true } } } },
      },
    })

    return reply.code(201).send({ data: order, message: 'Pedido criado com sucesso' })
  })

  // ── PATCH /:id/status — Atualizar estado do pedido ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const parsed = updateServiceOrderStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.roomServiceOrder.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Pedido não encontrado' })
    }

    const data: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.assignedTo) data.assignedTo = parsed.data.assignedTo
    if (parsed.data.status === 'COMPLETED') data.completedAt = new Date()

    const order = await app.prisma.roomServiceOrder.update({
      where: { id: request.params.id },
      data,
    })

    return reply.send({ data: order, message: `Estado alterado para ${parsed.data.status}` })
  })
}

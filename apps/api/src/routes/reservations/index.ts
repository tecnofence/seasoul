import type { FastifyInstance } from 'fastify'
import { createReservationSchema, updateReservationSchema, listReservationsQuery } from './schemas.js'

export default async function reservationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar reservas (paginado + filtros) ──
  app.get('/', async (request, reply) => {
    const parsed = listReservationsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, resortId, status, roomId, from, to, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (resortId) where.resortId = resortId
    if (status) where.status = status
    if (roomId) where.roomId = roomId
    if (from || to) {
      where.checkIn = {}
      if (from) (where.checkIn as Record<string, unknown>).gte = new Date(from)
      if (to) (where.checkIn as Record<string, unknown>).lte = new Date(to)
    }
    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { guestPhone: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.reservation.findMany({
        where,
        include: {
          room: { select: { id: true, number: true, type: true } },
          resort: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { checkIn: 'desc' },
      }),
      app.prisma.reservation.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /today — Reservas com check-in/check-out hoje ──
  app.get('/today', async (request, reply) => {
    const { resortId } = request.query as { resortId?: string }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const where: Record<string, unknown> = resortId ? { resortId } : {}

    const [checkIns, checkOuts] = await Promise.all([
      app.prisma.reservation.findMany({
        where: { ...where, checkIn: { gte: todayStart, lte: todayEnd }, status: 'CONFIRMED' },
        include: { room: { select: { id: true, number: true, type: true } } },
        orderBy: { checkIn: 'asc' },
      }),
      app.prisma.reservation.findMany({
        where: { ...where, checkOut: { gte: todayStart, lte: todayEnd }, status: 'CHECKED_IN' },
        include: { room: { select: { id: true, number: true, type: true } } },
        orderBy: { checkOut: 'asc' },
      }),
    ])

    return reply.send({ data: { checkIns, checkOuts } })
  })

  // ── GET /:id — Obter reserva por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const reservation = await app.prisma.reservation.findUnique({
      where: { id: request.params.id },
      include: {
        room: { select: { id: true, number: true, type: true, floor: true } },
        resort: { select: { id: true, name: true } },
        guest: { select: { id: true, name: true, phone: true, language: true } },
        sales: { select: { id: true, totalAmount: true, status: true, invoiceNumber: true, createdAt: true } },
        serviceOrders: { select: { id: true, type: true, status: true, createdAt: true } },
      },
    })

    if (!reservation) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    return reply.send({ data: reservation })
  })

  // ── POST / — Criar reserva ──
  app.post('/', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'RECEPTIONIST'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão para criar reservas' })
    }

    const parsed = createReservationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { checkIn, checkOut, roomId, resortId, ...rest } = parsed.data
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkOutDate <= checkInDate) {
      return reply.code(400).send({ error: 'Check-out deve ser posterior ao check-in' })
    }

    // Verificar que o quarto existe e pertence ao resort
    const room = await app.prisma.room.findUnique({ where: { id: roomId } })
    if (!room || room.resortId !== resortId) {
      return reply.code(404).send({ error: 'Quarto não encontrado neste resort' })
    }

    // Verificar conflitos de datas no mesmo quarto
    const conflict = await app.prisma.reservation.findFirst({
      where: {
        roomId,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    })
    if (conflict) {
      return reply.code(409).send({ error: 'Quarto indisponível para as datas selecionadas' })
    }

    // Calcular noites
    const nights = Math.max(1, Math.round(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    ))

    const reservation = await app.prisma.reservation.create({
      data: {
        resortId,
        roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        ...rest,
      },
      include: {
        room: { select: { id: true, number: true, type: true } },
        resort: { select: { id: true, name: true } },
      },
    })

    return reply.code(201).send({ data: reservation, message: 'Reserva criada com sucesso' })
  })

  // ── PUT /:id — Atualizar reserva ──
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const parsed = updateReservationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.reservation.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    if (['CHECKED_OUT', 'CANCELLED'].includes(existing.status)) {
      return reply.code(400).send({ error: 'Não é possível editar reservas finalizadas ou canceladas' })
    }

    const { checkIn, checkOut, roomId, ...rest } = parsed.data
    const data: Record<string, unknown> = { ...rest }

    const newCheckIn = checkIn ? new Date(checkIn) : existing.checkIn
    const newCheckOut = checkOut ? new Date(checkOut) : existing.checkOut
    const newRoomId = roomId || existing.roomId

    if (checkIn) data.checkIn = newCheckIn
    if (checkOut) data.checkOut = newCheckOut
    if (roomId) data.roomId = roomId

    // Recalcular noites se datas mudaram
    if (checkIn || checkOut) {
      data.nights = Math.max(1, Math.round(
        (newCheckOut.getTime() - newCheckIn.getTime()) / (1000 * 60 * 60 * 24),
      ))
    }

    // Verificar conflitos se mudou quarto ou datas
    if (checkIn || checkOut || roomId) {
      const conflict = await app.prisma.reservation.findFirst({
        where: {
          roomId: newRoomId,
          id: { not: request.params.id },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lt: newCheckOut },
          checkOut: { gt: newCheckIn },
        },
      })
      if (conflict) {
        return reply.code(409).send({ error: 'Quarto indisponível para as datas selecionadas' })
      }
    }

    const reservation = await app.prisma.reservation.update({
      where: { id: request.params.id },
      data,
      include: {
        room: { select: { id: true, number: true, type: true } },
        resort: { select: { id: true, name: true } },
      },
    })

    return reply.send({ data: reservation, message: 'Reserva atualizada' })
  })

  // ── PATCH /:id/check-in — Efetuar check-in ──
  app.patch<{ Params: { id: string } }>('/:id/check-in', async (request, reply) => {
    const reservation = await app.prisma.reservation.findUnique({
      where: { id: request.params.id },
      include: { room: true },
    })

    if (!reservation) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    if (reservation.status !== 'CONFIRMED') {
      return reply.code(400).send({ error: `Check-in não permitido. Estado atual: ${reservation.status}` })
    }

    // Atualizar reserva e quarto em transação
    const updated = await app.prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id: request.params.id },
        data: { status: 'CHECKED_IN' },
        include: {
          room: { select: { id: true, number: true, type: true } },
          resort: { select: { id: true, name: true } },
        },
      })

      await tx.room.update({
        where: { id: reservation.roomId },
        data: { status: 'OCCUPIED' },
      })

      return res
    })

    return reply.send({ data: updated, message: 'Check-in efetuado com sucesso' })
  })

  // ── PATCH /:id/check-out — Efetuar check-out ──
  app.patch<{ Params: { id: string } }>('/:id/check-out', async (request, reply) => {
    const reservation = await app.prisma.reservation.findUnique({
      where: { id: request.params.id },
      include: { room: true },
    })

    if (!reservation) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    if (reservation.status !== 'CHECKED_IN') {
      return reply.code(400).send({ error: `Check-out não permitido. Estado atual: ${reservation.status}` })
    }

    const updated = await app.prisma.$transaction(async (tx) => {
      const res = await tx.reservation.update({
        where: { id: request.params.id },
        data: { status: 'CHECKED_OUT' },
        include: {
          room: { select: { id: true, number: true, type: true } },
          resort: { select: { id: true, name: true } },
        },
      })

      // Quarto vai para limpeza após check-out
      await tx.room.update({
        where: { id: reservation.roomId },
        data: { status: 'CLEANING' },
      })

      return res
    })

    return reply.send({ data: updated, message: 'Check-out efetuado com sucesso' })
  })

  // ── PATCH /:id/cancel — Cancelar reserva ──
  app.patch<{ Params: { id: string } }>('/:id/cancel', async (request, reply) => {
    const reservation = await app.prisma.reservation.findUnique({
      where: { id: request.params.id },
    })

    if (!reservation) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    if (['CHECKED_OUT', 'CANCELLED'].includes(reservation.status)) {
      return reply.code(400).send({ error: 'Reserva já finalizada ou cancelada' })
    }

    // Se estava checked-in, libertar quarto
    if (reservation.status === 'CHECKED_IN') {
      await app.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: 'AVAILABLE' },
      })
    }

    const updated = await app.prisma.reservation.update({
      where: { id: request.params.id },
      data: { status: 'CANCELLED' },
      include: {
        room: { select: { id: true, number: true, type: true } },
        resort: { select: { id: true, name: true } },
      },
    })

    return reply.send({ data: updated, message: 'Reserva cancelada' })
  })
}

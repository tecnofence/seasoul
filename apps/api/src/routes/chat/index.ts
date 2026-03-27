import type { FastifyInstance } from 'fastify'
import { sendMessageSchema, listMessagesQuery } from './schemas.js'

export default async function chatRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET /unread — Contar mensagens não lidas (antes de /:params) ──
  app.get('/unread', async (request, reply) => {
    const { reservationId } = request.query as { reservationId?: string }
    const isGuest = request.user.type === 'guest'

    const where: Record<string, unknown> = {
      senderType: isGuest ? 'STAFF' : 'GUEST',
      readAt: null,
    }
    if (reservationId) where.reservationId = reservationId

    const count = await app.prisma.chatMessage.count({ where })

    return reply.send({ data: { unread: count } })
  })

  // ── GET / — Listar mensagens de uma reserva ──
  app.get('/', async (request, reply) => {
    const parsed = listMessagesQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { reservationId, page, limit } = parsed.data
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      app.prisma.chatMessage.findMany({
        where: { reservationId },
        include: {
          guest: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      app.prisma.chatMessage.count({ where: { reservationId } }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── POST / — Enviar mensagem ──
  app.post('/', async (request, reply) => {
    const parsed = sendMessageSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { reservationId, content } = parsed.data
    const isGuest = request.user.type === 'guest'

    // Verificar reserva
    const reservation = await app.prisma.reservation.findUnique({ where: { id: reservationId } })
    if (!reservation) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    const message = await app.prisma.chatMessage.create({
      data: {
        reservationId,
        guestId: isGuest ? request.user.id : null,
        senderType: isGuest ? 'GUEST' : 'STAFF',
        senderId: request.user.id,
        content,
      },
      include: {
        guest: { select: { id: true, name: true } },
      },
    })

    // TODO: Emitir via WebSocket para atualização em tempo real

    return reply.code(201).send({ data: message })
  })

  // ── PATCH /read — Marcar mensagens como lidas ──
  app.patch('/read', async (request, reply) => {
    const { reservationId } = request.body as { reservationId?: string }
    if (!reservationId) {
      return reply.code(400).send({ error: 'reservationId obrigatório' })
    }

    const isGuest = request.user.type === 'guest'

    await app.prisma.chatMessage.updateMany({
      where: {
        reservationId,
        senderType: isGuest ? 'STAFF' : 'GUEST',
        readAt: null,
      },
      data: { readAt: new Date() },
    })

    return reply.send({ message: 'Mensagens marcadas como lidas' })
  })
}

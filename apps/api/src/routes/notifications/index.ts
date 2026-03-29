import type { FastifyInstance } from 'fastify'
import { createNotificationSchema, listNotificationsQuery } from './schemas.js'
import { sendSms, sendEmail, sendExpoPush } from '../../utils/notify.js'

export default async function notificationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar notificações ──
  app.get('/', async (request, reply) => {
    const parsed = listNotificationsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, userId, guestId, status, channel } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (guestId) where.guestId = guestId
    if (status) where.status = status
    if (channel) where.channel = channel

    const [data, total] = await Promise.all([
      app.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.notification.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /me — Notificações do utilizador autenticado ──
  app.get('/me', async (request, reply) => {
    const user = request.user as any
    const isGuest = user.type === 'guest'

    const where = isGuest
      ? { guestId: user.id }
      : { userId: user.id }

    const data = await app.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const unread = data.filter((n) => !n.readAt).length

    return reply.send({ data, unread })
  })

  // ── POST / — Criar e enviar notificação ──
  app.post('/', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = createNotificationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!parsed.data.userId && !parsed.data.guestId) {
      return reply.code(400).send({ error: 'userId ou guestId obrigatório' })
    }

    const notification = await app.prisma.notification.create({
      data: parsed.data as any,
    })

    // Despachar via canal correto
    const { channel, title, body, userId, guestId } = parsed.data as any

    try {
      if (channel === 'SMS') {
        // Obter telefone do destinatário (User não tem phone, só Guest)
        let phone: string | null = null
        if (guestId) {
          const guest = await app.prisma.guest.findUnique({ where: { id: guestId }, select: { phone: true } })
          phone = guest?.phone ?? null
        }
        if (phone) {
          await sendSms(phone, `${title}: ${body}`)
        }
      } else if (channel === 'EMAIL') {
        // Obter email do destinatário
        let email: string | null = null
        if (userId) {
          const user = await app.prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
          email = user?.email ?? null
        } else if (guestId) {
          const guest = await app.prisma.guest.findUnique({ where: { id: guestId }, select: { email: true } })
          email = guest?.email ?? null
        }
        if (email) {
          await sendEmail(
            email,
            title,
            `<p>${body}</p><p style="color:#666;font-size:12px">Sea and Soul Resort — ENGERIS ONE</p>`
          )
        }
      } else if (channel === 'PUSH') {
        // Obter Expo push token do hóspede
        if (guestId) {
          const guest = await app.prisma.guest.findUnique({ where: { id: guestId }, select: { deviceToken: true } })
          if (guest?.deviceToken) {
            await sendExpoPush(guest.deviceToken, title, body)
          }
        }
      }

      // Marcar como enviada
      await app.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'SENT', sentAt: new Date() },
      })
    } catch (err) {
      app.log.error({ err, channel }, 'Erro ao despachar notificação')
      await app.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'FAILED' },
      })
    }

    return reply.code(201).send({ data: notification, message: 'Notificação criada' })
  })

  // ── PATCH /:id/read — Marcar como lida ──
  app.patch<{ Params: { id: string } }>('/:id/read', async (request, reply) => {
    const notification = await app.prisma.notification.findUnique({ where: { id: request.params.id } })
    if (!notification) {
      return reply.code(404).send({ error: 'Notificação não encontrada' })
    }

    const updated = await app.prisma.notification.update({
      where: { id: request.params.id },
      data: { readAt: new Date(), status: 'READ' },
    })

    return reply.send({ data: updated })
  })

  // ── PATCH /read-all — Marcar todas como lidas ──
  app.patch('/read-all', async (request, reply) => {
    const user = request.user as any
    const isGuest = user.type === 'guest'

    const where = isGuest
      ? { guestId: user.id, readAt: null }
      : { userId: user.id, readAt: null }

    await app.prisma.notification.updateMany({
      where,
      data: { readAt: new Date(), status: 'READ' },
    })

    return reply.send({ message: 'Todas as notificações marcadas como lidas' })
  })
}

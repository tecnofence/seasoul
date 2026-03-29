import type { FastifyInstance } from 'fastify'
import { registerGuestSchema, updateGuestSchema, guestLoginSchema } from './schemas.js'

// OTP store simples — produção deve usar Redis com TTL
const otpStore = new Map<string, { code: string; expiresAt: number }>()

// Limpar OTPs expirados a cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of otpStore.entries()) {
    if (val.expiresAt < now) otpStore.delete(key)
  }
}, 5 * 60 * 1000)

export default async function guestRoutes(app: FastifyInstance) {
  // ── GET /list — Listar hóspedes (admin) ──
  app.get('/list', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const query = request.query as { page?: string; limit?: string; search?: string }
    const page = Math.max(1, parseInt(query.page ?? '1'))
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20')))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.guest.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      app.prisma.guest.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /admin/:id — Detalhe de hóspede (admin) ──
  app.get<{ Params: { id: string } }>('/admin/:id', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const guest = await app.prisma.guest.findUnique({
      where: { id: request.params.id },
      include: {
        reservations: {
          include: { room: { select: { id: true, number: true, type: true } } },
          orderBy: { checkIn: 'desc' },
          take: 10,
        },
        reviews: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })

    if (!guest) {
      return reply.code(404).send({ error: 'Hóspede não encontrado' })
    }

    return reply.send({ data: guest })
  })

  // ── POST /register — Registar hóspede na app ──
  app.post('/register', async (request, reply) => {
    const parsed = registerGuestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { phone, email, ...rest } = parsed.data

    // Verificar duplicados
    const exists = await app.prisma.guest.findUnique({ where: { phone } })
    if (exists) {
      return reply.code(409).send({ error: 'Telefone já registado' })
    }

    if (email) {
      const emailExists = await app.prisma.guest.findUnique({ where: { email } })
      if (emailExists) {
        return reply.code(409).send({ error: 'Email já registado' })
      }
    }

    const guest = await app.prisma.guest.create({
      data: { phone, email, ...rest },
    })

    // Gerar token JWT para o hóspede
    const token = app.jwt.sign(
      { id: guest.id, phone: guest.phone, type: 'guest' },
      { expiresIn: '30d' },
    )

    return reply.code(201).send({
      data: { guest, token },
      message: 'Registo efetuado com sucesso',
    })
  })

  // ── POST /login — Login por telefone (enviar OTP via SMS) ──
  app.post('/login', async (request, reply) => {
    const parsed = guestLoginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const guest = await app.prisma.guest.findUnique({ where: { phone: parsed.data.phone } })
    if (!guest) {
      return reply.code(404).send({ error: 'Telefone não registado' })
    }

    // TODO: Gerar OTP e enviar via Africa's Talking SMS
    // Por agora, gerar token direto (simplificado para dev)
    const token = app.jwt.sign(
      { id: guest.id, phone: guest.phone, type: 'guest' },
      { expiresIn: '30d' },
    )

    return reply.send({
      data: { guest, token },
      message: 'Login efetuado',
    })
  })

  // ── GET /me — Perfil do hóspede autenticado ──
  app.get('/me', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    if (request.user.type !== 'guest') {
      return reply.code(403).send({ error: 'Endpoint exclusivo para hóspedes' })
    }

    const guest = await app.prisma.guest.findUnique({
      where: { id: request.user.id },
    })

    if (!guest) {
      return reply.code(404).send({ error: 'Hóspede não encontrado' })
    }

    return reply.send({ data: guest })
  })

  // ── PUT /me — Atualizar perfil ──
  app.put('/me', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const parsed = updateGuestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const guest = await app.prisma.guest.update({
      where: { id: request.user.id },
      data: parsed.data,
    })

    return reply.send({ data: guest, message: 'Perfil atualizado' })
  })

  // ── PATCH /device-token — Registar Expo push token do hóspede ──
  app.patch('/device-token', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    if (request.user.type !== 'guest') {
      return reply.code(403).send({ error: 'Endpoint exclusivo para hóspedes' })
    }

    const guestId = request.user.id
    const { deviceToken } = request.body as { deviceToken: string }

    if (!deviceToken || typeof deviceToken !== 'string') {
      return reply.code(400).send({ error: 'deviceToken obrigatório' })
    }

    await app.prisma.guest.update({
      where: { id: guestId },
      data: { deviceToken },
    })

    return reply.send({ message: 'Token registado' })
  })

  // ── GET /reservations — Reservas do hóspede ──
  app.get('/reservations', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const reservations = await app.prisma.reservation.findMany({
      where: { guestId: request.user.id },
      include: {
        room: { select: { id: true, number: true, type: true } },
        resort: { select: { id: true, name: true } },
      },
      orderBy: { checkIn: 'desc' },
    })

    return reply.send({ data: reservations })
  })

  // ── POST /otp/request — Pedir código OTP por SMS ──
  app.post('/otp/request', { config: { rateLimit: { max: 3, timeWindow: '15m' } } }, async (request, reply) => {
    const { phone } = request.body as { phone?: string }
    if (!phone || typeof phone !== 'string') {
      return reply.code(400).send({ error: 'Número de telemóvel obrigatório' })
    }

    // Verificar se hóspede existe (ou criar automaticamente)
    const guest = await app.prisma.guest.findFirst({ where: { phone } })
    if (!guest) {
      return reply.code(404).send({ error: 'Nenhuma reserva encontrada para este número' })
    }

    // Gerar OTP de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutos
    otpStore.set(phone, { code, expiresAt })

    // Enviar SMS
    try {
      const { sendSms } = await import('../../utils/notify.js')
      await sendSms(phone, `Sea & Soul Resort — O seu código de acesso é: ${code}\nVálido por 5 minutos.`)
    } catch {
      // Em dev, mostrar no log
      app.log.info({ phone, code }, '[DEV] OTP gerado — SMS não enviado em dev')
    }

    return reply.send({ message: 'Código enviado por SMS', expiresIn: 300 })
  })

  // ── POST /otp/verify — Verificar OTP e fazer login ──
  app.post('/otp/verify', async (request, reply) => {
    const { phone, code } = request.body as { phone?: string; code?: string }
    if (!phone || !code) {
      return reply.code(400).send({ error: 'Telemóvel e código obrigatórios' })
    }

    const stored = otpStore.get(phone)
    if (!stored || stored.expiresAt < Date.now()) {
      return reply.code(401).send({ error: 'Código expirado ou inválido' })
    }
    if (stored.code !== code) {
      return reply.code(401).send({ error: 'Código incorreto' })
    }

    otpStore.delete(phone)

    const guest = await app.prisma.guest.findFirst({ where: { phone } })
    if (!guest) return reply.code(404).send({ error: 'Hóspede não encontrado' })

    // Gerar JWT para o hóspede
    const token = app.jwt.sign(
      { id: guest.id, type: 'guest', name: guest.name, phone: guest.phone },
      { expiresIn: '7d' }
    )

    return reply.send({
      data: { token, guest: { id: guest.id, name: guest.name, phone: guest.phone, email: guest.email } },
      message: 'Login efectuado com sucesso',
    })
  })
}

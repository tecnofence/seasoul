import type { FastifyInstance } from 'fastify'
import { registerGuestSchema, updateGuestSchema, guestLoginSchema } from './schemas.js'

export default async function guestRoutes(app: FastifyInstance) {
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
}

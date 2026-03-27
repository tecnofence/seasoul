import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import { generatePinSchema, listLocksQuery } from './schemas.js'

// Gerar PIN numérico seguro
function generateSecurePin(length = 6): string {
  const max = Math.pow(10, length)
  return String(crypto.randomInt(0, max)).padStart(length, '0')
}

// Encriptar PIN com AES-256 (simétrico)
function encryptPin(pin: string, key: string): string {
  const iv = crypto.randomBytes(16)
  const keyBuffer = crypto.scryptSync(key, 'salt', 32)
  const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv)
  let encrypted = cipher.update(pin, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

export default async function locksRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar quartos com fechadura (Seam devices) ──
  app.get('/', async (request, reply) => {
    const parsed = listLocksQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos' })
    }

    const { resortId } = parsed.data

    const where: Record<string, unknown> = {
      seamDeviceId: { not: null },
    }
    if (resortId) where.resortId = resortId

    const rooms = await app.prisma.room.findMany({
      where,
      select: {
        id: true,
        number: true,
        type: true,
        status: true,
        seamDeviceId: true,
        resortId: true,
        resort: { select: { id: true, name: true } },
      },
      orderBy: { number: 'asc' },
    })

    return reply.send({ data: rooms })
  })

  // ── POST /pin — Gerar PIN de acesso para uma reserva ──
  app.post('/pin', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'RECEPTIONIST'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = generatePinSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { reservationId, validFrom, validUntil } = parsed.data

    const reservation = await app.prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { room: true },
    })

    if (!reservation) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    if (!['CONFIRMED', 'CHECKED_IN'].includes(reservation.status)) {
      return reply.code(400).send({ error: 'Reserva não está confirmada ou em check-in' })
    }

    if (!reservation.room.seamDeviceId) {
      return reply.code(400).send({ error: 'Quarto não tem fechadura inteligente configurada' })
    }

    // Gerar PIN e encriptar
    const pin = generateSecurePin(6)
    const encryptionKey = process.env.TOTP_SECRET_ENCRYPTION_KEY || 'default-dev-key-change-me'
    const accessPinEncrypted = encryptPin(pin, encryptionKey)

    const pinValidFrom = validFrom ? new Date(validFrom) : reservation.checkIn
    const pinValidUntil = validUntil ? new Date(validUntil) : reservation.checkOut

    await app.prisma.reservation.update({
      where: { id: reservationId },
      data: { accessPinEncrypted, pinValidFrom, pinValidUntil },
    })

    // TODO: Enviar PIN via Seam API para a fechadura TTLock
    // TODO: Enviar SMS/Push ao hóspede com o PIN

    return reply.send({
      data: {
        reservationId,
        roomNumber: reservation.room.number,
        pin, // Só mostrado uma vez — depois fica encriptado na BD
        validFrom: pinValidFrom,
        validUntil: pinValidUntil,
      },
      message: `PIN gerado para quarto ${reservation.room.number}`,
    })
  })

  // ── DELETE /pin/:reservationId — Revogar PIN ──
  app.delete<{ Params: { reservationId: string } }>('/pin/:reservationId', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'RECEPTIONIST'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const reservation = await app.prisma.reservation.findUnique({
      where: { id: request.params.reservationId },
    })

    if (!reservation) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    await app.prisma.reservation.update({
      where: { id: request.params.reservationId },
      data: { accessPinEncrypted: null, pinValidFrom: null, pinValidUntil: null },
    })

    // TODO: Revogar PIN na fechadura via Seam API

    return reply.send({ message: 'PIN revogado com sucesso' })
  })
}

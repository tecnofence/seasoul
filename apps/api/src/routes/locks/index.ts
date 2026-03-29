import type { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import { generatePinSchema, listLocksQuery } from './schemas.js'
import { createLockPin, deleteLockPin } from '../../utils/seam.js'
import { sendSms, sendExpoPush } from '../../utils/notify.js'

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
      include: { room: true, guest: true },
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

    // Enviar PIN para a fechadura via Seam API
    let seamAccessCodeId: string | null = null
    try {
      seamAccessCodeId = await createLockPin(
        reservation.room.seamDeviceId,
        pin,
        pinValidFrom,
        pinValidUntil,
        `Reserva ${reservationId} — ${reservation.guestName}`
      )
    } catch (err) {
      app.log.warn({ err }, 'Erro ao criar PIN na Seam API — PIN guardado localmente apenas')
    }

    await app.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        accessPinEncrypted,
        pinValidFrom,
        pinValidUntil,
        seamAccessCodeId,
      },
    })

    // Notificar hóspede via SMS
    const checkInFormatted = pinValidFrom.toLocaleDateString('pt-AO')
    const checkOutFormatted = pinValidUntil.toLocaleDateString('pt-AO')
    const smsMessage = `Sea & Soul Resort — Quarto ${reservation.room.number}\nPIN de acesso: ${pin}\nVálido: ${checkInFormatted} a ${checkOutFormatted}\nBoa estadia!`

    try {
      await sendSms(reservation.guestPhone, smsMessage)
    } catch (err) {
      app.log.warn({ err }, 'Erro ao enviar SMS com PIN ao hóspede')
    }

    // Notificar via Push se o hóspede tiver a app
    if (reservation.guest?.deviceToken) {
      try {
        await sendExpoPush(
          reservation.guest.deviceToken,
          'PIN do seu quarto',
          `Quarto ${reservation.room.number} — PIN: ${pin}. Válido até ao check-out.`,
          { type: 'LOCK_PIN', pin, roomNumber: reservation.room.number }
        )
      } catch (err) {
        app.log.warn({ err }, 'Erro ao enviar push notification com PIN')
      }
    }

    return reply.send({
      data: {
        reservationId,
        roomNumber: reservation.room.number,
        pin, // Só mostrado uma vez — depois fica encriptado na BD
        validFrom: pinValidFrom,
        validUntil: pinValidUntil,
        seamSynced: seamAccessCodeId !== null,
      },
      message: `PIN gerado para quarto ${reservation.room.number}`,
    })
  })

  // ── POST /webhook — Receber eventos Seam API ──────────────────────────────
  // Esta rota NÃO usa autenticação JWT — usa assinatura HMAC da Seam
  // preHandler: [] sobrepõe o hook global de autenticação para esta rota
  app.post('/webhook', {
    preHandler: [],
    config: { rawBody: true }, // precisamos do body raw para verificar a assinatura
  }, async (request, reply) => {
    // 1. Verificar assinatura Seam
    const seamSecret = process.env.SEAM_WEBHOOK_SECRET
    if (seamSecret) {
      const signature = request.headers['seam-signature'] as string
      const rawBody = (request as any).rawBody as string
      if (!rawBody || !signature) {
        return reply.code(400).send({ error: 'Assinatura em falta' })
      }
      const expected = crypto
        .createHmac('sha256', seamSecret)
        .update(rawBody)
        .digest('hex')
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return reply.code(401).send({ error: 'Assinatura inválida' })
      }
    }

    const event = request.body as any
    const eventType: string = event?.event_type ?? ''
    const deviceId: string = event?.device?.device_id ?? event?.access_code?.device_id ?? ''

    app.log.info({ eventType, deviceId }, 'Seam webhook recebido')

    // Encontrar o quarto associado ao device
    const room = deviceId
      ? await app.prisma.room.findFirst({
          where: { seamDeviceId: deviceId },
          include: { resort: true },
        })
      : null

    switch (eventType) {
      case 'device.low_battery': {
        // Criar chamado de manutenção — bateria fraca
        if (room) {
          await app.prisma.maintenanceTicket.create({
            data: {
              resortId: room.resortId,
              roomId: room.id,
              location: `Quarto ${room.number}`,
              description: `A fechadura inteligente do quarto ${room.number} tem bateria abaixo de 20%. Substituir pilhas urgentemente.`,
              priority: 'HIGH',
              status: 'OPEN',
            },
          })
          app.log.warn({ roomId: room.id }, 'Bateria fraca na fechadura')
        }
        break
      }

      case 'device.disconnected': {
        // Criar chamado urgente — fechadura offline
        if (room) {
          await app.prisma.maintenanceTicket.create({
            data: {
              resortId: room.resortId,
              roomId: room.id,
              location: `Quarto ${room.number}`,
              description: `A fechadura inteligente do quarto ${room.number} está offline/desligada. Verificar gateway TTLock e ligação de rede.`,
              priority: 'URGENT',
              status: 'OPEN',
            },
          })
          app.log.error({ roomId: room.id }, 'Fechadura offline')
        }
        break
      }

      case 'access_code.failed_to_set_on_device': {
        // Notificar gestor do resort — falha ao programar PIN
        if (room) {
          const manager = await app.prisma.user.findFirst({
            where: { resortId: room.resortId, role: 'RESORT_MANAGER', active: true },
          })
          if (manager) {
            await app.prisma.notification.create({
              data: {
                userId: manager.id,
                resortId: room.resortId,
                type: 'MAINTENANCE_ASSIGNED',
                channel: 'IN_APP',
                title: 'Falha na fechadura',
                body: `Não foi possível programar o PIN na fechadura do quarto ${room.number}. Contactar hóspede manualmente.`,
                status: 'PENDING',
              },
            })
          }
        }
        break
      }

      case 'lock.unlocked': {
        // Registar no audit log
        await app.prisma.auditLog.create({
          data: {
            action: 'LOCK_UNLOCKED',
            entity: 'Room',
            entityId: room?.id ?? deviceId,
            userId: null,
            after: { deviceId, eventType, timestamp: event.created_at },
          },
        })
        break
      }

      case 'access_code.created':
      case 'access_code.deleted':
        // Confirmação de operações — apenas log
        app.log.info({ eventType, deviceId }, 'Código de acesso confirmado pela Seam')
        break

      default:
        app.log.debug({ eventType }, 'Evento Seam não tratado')
    }

    return reply.send({ received: true })
  })

  // ── DELETE /pin/:reservationId — Revogar PIN ──
  app.delete<{ Params: { reservationId: string } }>('/pin/:reservationId', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'RECEPTIONIST'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const reservation = await app.prisma.reservation.findUnique({
      where: { id: request.params.reservationId },
      include: { room: true },
    })

    if (!reservation) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    // Revogar PIN na fechadura via Seam API
    if (reservation.room.seamDeviceId && reservation.seamAccessCodeId) {
      try {
        await deleteLockPin(reservation.room.seamDeviceId, reservation.seamAccessCodeId)
      } catch (err) {
        app.log.warn({ err }, 'Erro ao revogar PIN na Seam API')
      }
    }

    await app.prisma.reservation.update({
      where: { id: request.params.reservationId },
      data: {
        accessPinEncrypted: null,
        pinValidFrom: null,
        pinValidUntil: null,
        seamAccessCodeId: null,
      },
    })

    return reply.send({ message: 'PIN revogado com sucesso' })
  })
}

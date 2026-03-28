import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

export default async function publicRoutes(app: FastifyInstance) {
  // ── GET /public/:slug/info ─────────────────────────────────────────────────
  app.get<{ Params: { slug: string } }>('/public/:slug/info', async (request, reply) => {
    try {
      const { slug } = request.params

      const resort = await app.prisma.resort.findUnique({
        where: { slug },
      })

      if (!resort) {
        return reply.code(404).send({ error: 'Resort não encontrado' })
      }

      // Tenta encontrar branding do Tenant pelo mesmo slug
      let tenant: { logo: string | null; primaryColor: string | null } | null = null
      try {
        tenant = await app.prisma.tenant.findFirst({
          where: { slug },
          select: { logo: true, primaryColor: true },
        })
      } catch {
        // Tenant não encontrado ou slug diferente — não é obrigatório
      }

      return reply.send({
        data: {
          id:           resort.id,
          name:         resort.name,
          slug:         resort.slug,
          description:  null,
          logo:         tenant?.logo ?? null,
          primaryColor: tenant?.primaryColor ?? '#1A3E6E',
          bannerImage:  null,
          location:     { lat: resort.lat, lng: resort.lng },
          contact:      { phone: null, email: null },
        },
      })
    } catch (err) {
      request.log.error(err)
      return reply.code(500).send({ error: 'Erro ao carregar informações do resort' })
    }
  })

  // ── GET /public/:slug/rooms ────────────────────────────────────────────────
  app.get<{
    Params: { slug: string }
    Querystring: { checkIn?: string; checkOut?: string }
  }>('/public/:slug/rooms', async (request, reply) => {
    try {
      const { slug } = request.params

      const resort = await app.prisma.resort.findUnique({ where: { slug } })
      if (!resort) {
        return reply.code(404).send({ error: 'Resort não encontrado' })
      }

      // Quartos activos (excluindo em manutenção)
      const rooms = await app.prisma.room.findMany({
        where: {
          resort:  { slug },
          status:  { not: 'MAINTENANCE' },
        },
      })

      // Tarifas activas por tipo de quarto para este resort
      const tariffs = await app.prisma.tariff.findMany({
        where:   { resortId: resort.id, active: true },
        orderBy: { validFrom: 'desc' },
      })

      const now = new Date()
      const roomsWithTariff = rooms.map((room) => {
        // Tarifa activa mais recente para o tipo deste quarto
        const tariff = tariffs.find(
          (t) =>
            t.roomType === room.type &&
            new Date(t.validFrom) <= now &&
            new Date(t.validUntil) >= now,
        )

        return {
          id:            room.id,
          number:        room.number,
          type:          room.type,
          floor:         room.floor,
          capacity:      room.capacity,
          status:        room.status,
          description:   room.description,
          amenities:     room.amenities,
          pricePerNight: tariff ? tariff.pricePerNight : room.pricePerNight,
          tariffName:    tariff?.name ?? null,
        }
      })

      return reply.send({ data: roomsWithTariff })
    } catch (err) {
      request.log.error(err)
      return reply.code(500).send({ error: 'Erro ao carregar quartos' })
    }
  })

  // ── GET /public/:slug/availability ────────────────────────────────────────
  app.get<{
    Params: { slug: string }
    Querystring: { checkIn?: string; checkOut?: string; adults?: string }
  }>('/public/:slug/availability', async (request, reply) => {
    try {
      const { slug } = request.params
      const { checkIn: checkInStr, checkOut: checkOutStr, adults: adultsStr } = request.query

      if (!checkInStr || !checkOutStr) {
        return reply.code(400).send({ error: 'Parâmetros checkIn e checkOut são obrigatórios' })
      }

      const checkIn  = new Date(checkInStr)
      const checkOut = new Date(checkOutStr)
      const adults   = parseInt(adultsStr ?? '1', 10) || 1

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return reply.code(400).send({ error: 'Datas inválidas' })
      }

      if (checkOut <= checkIn) {
        return reply.code(400).send({ error: 'checkOut deve ser posterior a checkIn' })
      }

      const resort = await app.prisma.resort.findUnique({ where: { slug } })
      if (!resort) {
        return reply.code(404).send({ error: 'Resort não encontrado' })
      }

      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86_400_000)

      // Todos os quartos activos
      const rooms = await app.prisma.room.findMany({
        where: { resortId: resort.id, status: { not: 'MAINTENANCE' } },
      })

      // Tarifas activas para este resort
      const tariffs = await app.prisma.tariff.findMany({
        where:   { resortId: resort.id, active: true },
        orderBy: { validFrom: 'desc' },
      })

      const now = new Date()

      // Verifica disponibilidade de cada quarto em paralelo
      const availabilityChecks = await Promise.all(
        rooms.map(async (room) => {
          // Ignora quartos com capacidade insuficiente
          if (room.capacity < adults) return null

          // Verifica conflito de reservas
          const conflict = await app.prisma.reservation.findFirst({
            where: {
              roomId: room.id,
              status: { in: ['CONFIRMED', 'CHECKED_IN'] },
              checkIn:  { lt: checkOut },
              checkOut: { gt: checkIn },
            },
          })

          if (conflict) return null

          // Tarifa activa mais recente para o tipo deste quarto
          const tariff = tariffs.find(
            (t) =>
              t.roomType === room.type &&
              new Date(t.validFrom) <= now &&
              new Date(t.validUntil) >= now,
          )

          const pricePerNight = tariff ? Number(tariff.pricePerNight) : Number(room.pricePerNight)
          const totalPrice    = pricePerNight * nights

          return {
            id:            room.id,
            number:        room.number,
            type:          room.type,
            floor:         room.floor,
            capacity:      room.capacity,
            description:   room.description,
            amenities:     room.amenities,
            pricePerNight,
            tariffName:    tariff?.name ?? null,
            nights,
            totalPrice,
          }
        }),
      )

      const available = availabilityChecks.filter(Boolean)

      return reply.send({ data: available, checkIn: checkInStr, checkOut: checkOutStr, nights, adults })
    } catch (err) {
      request.log.error(err)
      return reply.code(500).send({ error: 'Erro ao verificar disponibilidade' })
    }
  })

  // ── GET /public/:slug/spa ──────────────────────────────────────────────────
  app.get<{ Params: { slug: string } }>('/public/:slug/spa', async (request, reply) => {
    try {
      const { slug } = request.params

      // SpaService está ligado a Tenant (não a Resort directamente)
      const tenant = await app.prisma.tenant.findFirst({ where: { slug } })

      if (!tenant) {
        // Resort pode existir sem Tenant com o mesmo slug — retorna vazio
        return reply.send({ data: [] })
      }

      const services = await app.prisma.spaService.findMany({
        where:   { tenantId: tenant.id, active: true },
        orderBy: { category: 'asc' },
        select: {
          id:          true,
          name:        true,
          category:    true,
          duration:    true,
          price:       true,
          description: true,
        },
      })

      return reply.send({ data: services })
    } catch (err) {
      request.log.error(err)
      return reply.code(500).send({ error: 'Erro ao carregar serviços de spa' })
    }
  })

  // ── GET /public/:slug/activities ──────────────────────────────────────────
  app.get<{ Params: { slug: string } }>('/public/:slug/activities', async (request, reply) => {
    try {
      const { slug } = request.params

      // Activity está ligado a Tenant (não a Resort directamente)
      const tenant = await app.prisma.tenant.findFirst({ where: { slug } })

      if (!tenant) {
        return reply.send({ data: [] })
      }

      const activities = await app.prisma.activity.findMany({
        where:   { tenantId: tenant.id, status: 'ACTIVE' },
        orderBy: { category: 'asc' },
        select: {
          id:              true,
          name:            true,
          category:        true,
          description:     true,
          location:        true,
          duration:        true,
          maxParticipants: true,
          price:           true,
          difficulty:      true,
          status:          true,
        },
      })

      return reply.send({ data: activities })
    } catch (err) {
      request.log.error(err)
      return reply.code(500).send({ error: 'Erro ao carregar actividades' })
    }
  })

  // ── GET /public/:slug/reviews ──────────────────────────────────────────────
  app.get<{ Params: { slug: string } }>('/public/:slug/reviews', async (request, reply) => {
    try {
      const { slug } = request.params

      const resort = await app.prisma.resort.findUnique({ where: { slug } })
      if (!resort) {
        return reply.code(404).send({ error: 'Resort não encontrado' })
      }

      const reviews = await app.prisma.guestReview.findMany({
        where:   { resort: { slug }, published: true },
        orderBy: { createdAt: 'desc' },
        take:    10,
        select: {
          id:            true,
          guestName:     true,
          overallRating: true,
          cleanliness:   true,
          service:       true,
          location:      true,
          valueForMoney: true,
          comment:       true,
          language:      true,
          createdAt:     true,
        },
      })

      return reply.send({ data: reviews })
    } catch (err) {
      request.log.error(err)
      return reply.code(500).send({ error: 'Erro ao carregar avaliações' })
    }
  })

  // ── POST /public/:slug/booking ─────────────────────────────────────────────
  const bookingSchema = z.object({
    guestName:   z.string().min(2),
    guestEmail:  z.string().email(),
    guestPhone:  z.string().min(7),
    roomId:      z.string().min(1),
    checkIn:     z.string().min(1),
    checkOut:    z.string().min(1),
    adults:      z.number().int().min(1).default(1),
    children:    z.number().int().min(0).optional(),
    totalAmount: z.number().positive(),
    notes:       z.string().optional(),
  })

  app.post<{ Params: { slug: string } }>('/public/:slug/booking', async (request, reply) => {
    try {
      const { slug } = request.params

      // Validação do body
      const parsed = bookingSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({
          error:   'Dados inválidos',
          details: parsed.error.flatten(),
        })
      }

      const {
        guestName,
        guestEmail,
        guestPhone,
        roomId,
        checkIn:     checkInStr,
        checkOut:    checkOutStr,
        adults,
        children,
        totalAmount,
        notes,
      } = parsed.data

      const checkIn  = new Date(checkInStr)
      const checkOut = new Date(checkOutStr)

      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return reply.code(400).send({ error: 'Datas inválidas' })
      }

      if (checkOut <= checkIn) {
        return reply.code(400).send({ error: 'checkOut deve ser posterior a checkIn' })
      }

      // Encontra o resort pelo slug
      const resort = await app.prisma.resort.findUnique({ where: { slug } })
      if (!resort) {
        return reply.code(404).send({ error: 'Resort não encontrado' })
      }

      // Verifica se o quarto pertence a este resort
      const room = await app.prisma.room.findFirst({
        where: { id: roomId, resortId: resort.id },
      })
      if (!room) {
        return reply.code(404).send({ error: 'Quarto não encontrado neste resort' })
      }

      // Verifica disponibilidade
      const conflict = await app.prisma.reservation.findFirst({
        where: {
          roomId,
          status:   { in: ['CONFIRMED', 'CHECKED_IN'] },
          checkIn:  { lt: checkOut },
          checkOut: { gt: checkIn },
        },
      })

      if (conflict) {
        return reply.code(409).send({ error: 'Quarto não disponível para as datas seleccionadas' })
      }

      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86_400_000)

      // Cria a reserva
      const reservation = await app.prisma.reservation.create({
        data: {
          resortId:      resort.id,
          roomId,
          guestName,
          guestEmail,
          guestPhone,
          checkIn,
          checkOut,
          nights,
          adults,
          children:      children ?? 0,
          totalAmount,
          status:        'CONFIRMED',
          bookingSource: 'WEBSITE',
          paymentStatus: 'PENDING',
          notes,
        },
      })

      return reply.code(201).send({
        data: {
          id:                 reservation.id,
          confirmationNumber: reservation.id.slice(-8).toUpperCase(),
          status:             reservation.status,
          checkIn:            reservation.checkIn,
          checkOut:           reservation.checkOut,
          nights:             reservation.nights,
          totalAmount:        reservation.totalAmount,
          guestName:          reservation.guestName,
          guestEmail:         reservation.guestEmail,
        },
      })
    } catch (err) {
      request.log.error(err)
      return reply.code(500).send({
        error:   'Erro ao criar reserva',
        message: err instanceof Error ? err.message : 'Erro desconhecido',
      })
    }
  })
}

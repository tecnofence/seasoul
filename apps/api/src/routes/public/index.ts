import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

// Demo data for tenants not yet in DB
const DEMO_RESORTS: Record<string, any> = {
  'palmeira': {
    id: 'demo-palmeira',
    name: 'Palmeira Beach Hotel',
    slug: 'palmeira',
    description: 'Hotel urbano 4 estrelas na Ilha de Luanda. Vista panorâmica para o oceano Atlântico, piscina infinity e restaurante gourmet.',
    logo: null,
    primaryColor: '#D97706',
    bannerImage: null,
    location: { lat: -8.8147, lng: 13.2302, address: 'Ilha de Luanda, Luanda, Angola' },
    contact: {
      phone: '+244 923 456 789',
      email: 'reservas@palmeirahotel.ao',
      whatsapp: '+244923456789'
    }
  },
  'seaandsoul': {
    id: 'demo-seaandsoul',
    name: 'Sea and Soul Resorts',
    slug: 'seaandsoul',
    description: 'Dois resorts de luxo na costa angolana. Refúgio de paz e natureza em Cabo Ledo e Sangano.',
    logo: null,
    primaryColor: '#1A3E6E',
    bannerImage: null,
    location: { lat: -9.0333, lng: 13.2333, address: 'Cabo Ledo, Bengo, Angola' },
    contact: {
      phone: '+244 912 345 678',
      email: 'reservas@seaandsoul.ao',
      whatsapp: '+244912345678'
    }
  }
}

const DEMO_ROOMS: Record<string, any[]> = {
  'palmeira': [
    { id: 'p-r1', number: '101', type: 'STANDARD', floor: 1, capacity: 2, status: 'AVAILABLE', pricePerNight: 35000, totalPrice: 35000, nights: 1 },
    { id: 'p-r2', number: '201', type: 'SUPERIOR', floor: 2, capacity: 2, status: 'AVAILABLE', pricePerNight: 50000, totalPrice: 50000, nights: 1 },
    { id: 'p-r3', number: '301', type: 'SUPERIOR', floor: 3, capacity: 2, status: 'AVAILABLE', pricePerNight: 75000, totalPrice: 75000, nights: 1 },
    { id: 'p-r4', number: '401', type: 'SUITE', floor: 4, capacity: 4, status: 'AVAILABLE', pricePerNight: 120000, totalPrice: 120000, nights: 1 },
    { id: 'p-r5', number: '402', type: 'SUITE', floor: 4, capacity: 2, status: 'OCCUPIED', pricePerNight: 120000, totalPrice: 120000, nights: 1 },
    { id: 'p-r6', number: '501', type: 'SUITE', floor: 5, capacity: 6, status: 'AVAILABLE', pricePerNight: 250000, totalPrice: 250000, nights: 1 },
  ],
  'seaandsoul': [
    { id: 's-r1', number: '101', type: 'STANDARD', floor: 1, capacity: 2, status: 'AVAILABLE', pricePerNight: 45000, totalPrice: 45000, nights: 1 },
    { id: 's-r2', number: '102', type: 'STANDARD', floor: 1, capacity: 2, status: 'AVAILABLE', pricePerNight: 45000, totalPrice: 45000, nights: 1 },
    { id: 's-r3', number: '201', type: 'VILLA', floor: 2, capacity: 4, status: 'AVAILABLE', pricePerNight: 95000, totalPrice: 95000, nights: 1 },
    { id: 's-r4', number: '202', type: 'VILLA', floor: 2, capacity: 4, status: 'OCCUPIED', pricePerNight: 95000, totalPrice: 95000, nights: 1 },
    { id: 's-r5', number: '301', type: 'SUITE', floor: 3, capacity: 2, status: 'AVAILABLE', pricePerNight: 130000, totalPrice: 130000, nights: 1 },
    { id: 's-r6', number: 'VIP-1', type: 'SUITE', floor: 1, capacity: 6, status: 'AVAILABLE', pricePerNight: 300000, totalPrice: 300000, nights: 1 },
  ]
}

const DEMO_REVIEWS: Record<string, any[]> = {
  'palmeira': [
    { id: 'pr1', guestName: 'António Ferreira', overallRating: 5, comment: 'Hotel incrível com vista deslumbrante para o oceano. Serviço impecável e quartos espaçosos.', createdAt: new Date('2026-02-15') },
    { id: 'pr2', guestName: 'Maria João Silva', overallRating: 4, comment: 'Excelente localização na Ilha de Luanda. Piscina maravilhosa e restaurante de qualidade.', createdAt: new Date('2026-01-28') },
    { id: 'pr3', guestName: 'Carlos Mendes', overallRating: 5, comment: 'Melhor hotel de Luanda! Recomendo vivamente para viagens de negócios e lazer.', createdAt: new Date('2026-03-01') },
  ],
  'seaandsoul': [
    { id: 'sr1', guestName: 'João Baptista', overallRating: 5, comment: 'Um verdadeiro paraíso na costa angolana. Natureza pura com todo o conforto de luxo.', createdAt: new Date('2026-02-20') },
    { id: 'sr2', guestName: 'Ana Paula Costa', overallRating: 5, comment: 'Bungalows perfeitos com acesso direto à praia. Pessoal extremamente atencioso.', createdAt: new Date('2026-01-15') },
    { id: 'sr3', guestName: 'Pedro Lopes', overallRating: 4, comment: 'Experiência única em Angola. Resort de luxo com actividades fantásticas.', createdAt: new Date('2026-03-10') },
  ]
}

export default async function publicRoutes(app: FastifyInstance) {
  // ── GET /public/:slug/info ─────────────────────────────────────────────────
  app.get<{ Params: { slug: string } }>('/public/:slug/info', async (request, reply) => {
    try {
      const { slug } = request.params

      const resort = await app.prisma.resort.findUnique({
        where: { slug },
      })

      if (!resort) {
        // Fallback para demo tenants não presentes na BD
        const demo = DEMO_RESORTS[slug]
        if (demo) {
          return reply.send({ data: demo })
        }
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
        // Fallback para demo tenants não presentes na BD
        const demoRooms = DEMO_ROOMS[slug]
        if (demoRooms) {
          return reply.send({ data: demoRooms })
        }
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
        // Fallback para demo tenants não presentes na BD
        const demoRooms = DEMO_ROOMS[slug]
        if (demoRooms) {
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86_400_000)
          const available = demoRooms
            .filter((r) => r.status !== 'OCCUPIED' && r.capacity >= adults)
            .map((r) => ({ ...r, nights, totalPrice: r.pricePerNight * nights }))
          return reply.send({ data: available, checkIn: checkInStr, checkOut: checkOutStr, nights, adults })
        }
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
        // Fallback para demo tenants não presentes na BD
        const demoReviews = DEMO_REVIEWS[slug]
        if (demoReviews) {
          return reply.send({ data: demoReviews })
        }
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
        // Fallback para demo tenants não presentes na BD
        if (DEMO_RESORTS[slug]) {
          return reply.code(201).send({
            data: {
              id: 'demo-' + Date.now(),
              confirmationNumber: 'DEMO' + Math.random().toString(36).slice(2, 8).toUpperCase(),
              status: 'CONFIRMED',
              checkIn,
              checkOut,
              nights: Math.ceil((checkOut.getTime() - checkIn.getTime()) / 86_400_000),
              totalAmount,
              guestName,
              guestEmail,
              message: 'Reserva demo criada com sucesso',
            },
          })
        }
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

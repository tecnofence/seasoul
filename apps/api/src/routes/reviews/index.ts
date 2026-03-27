import type { FastifyInstance } from 'fastify'
import { createReviewSchema, replyReviewSchema, listReviewsQuery } from './schemas.js'

export default async function reviewsRoutes(app: FastifyInstance) {
  // ── GET / — Listar avaliações (público para o site) ──
  app.get('/', async (request, reply) => {
    const parsed = listReviewsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, resortId, published, minRating } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (resortId) where.resortId = resortId
    if (published !== undefined) where.published = published
    if (minRating) where.overallRating = { gte: minRating }

    const [data, total] = await Promise.all([
      app.prisma.guestReview.findMany({
        where,
        include: { resort: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.guestReview.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /stats — Estatísticas de avaliações ──
  app.get('/stats', async (request, reply) => {
    const { resortId } = request.query as { resortId?: string }

    const where: Record<string, unknown> = { published: true }
    if (resortId) where.resortId = resortId

    const reviews = await app.prisma.guestReview.findMany({
      where,
      select: { overallRating: true, cleanliness: true, service: true, location: true, valueForMoney: true },
    })

    if (reviews.length === 0) {
      return reply.send({ data: { total: 0, averages: null } })
    }

    const avg = (arr: (number | null)[]) => {
      const valid = arr.filter((v): v is number => v !== null)
      return valid.length ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : null
    }

    return reply.send({
      data: {
        total: reviews.length,
        averages: {
          overall: avg(reviews.map((r) => r.overallRating)),
          cleanliness: avg(reviews.map((r) => r.cleanliness)),
          service: avg(reviews.map((r) => r.service)),
          location: avg(reviews.map((r) => r.location)),
          valueForMoney: avg(reviews.map((r) => r.valueForMoney)),
        },
      },
    })
  })

  // ── POST / — Criar avaliação (hóspede) ──
  app.post('/', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    const parsed = createReviewSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { reservationId, ...rest } = parsed.data

    const reservation = await app.prisma.reservation.findUnique({ where: { id: reservationId } })
    if (!reservation) {
      return reply.code(404).send({ error: 'Reserva não encontrada' })
    }

    if (reservation.status !== 'CHECKED_OUT') {
      return reply.code(400).send({ error: 'Só é possível avaliar após check-out' })
    }

    // Verificar se já existe avaliação
    const exists = await app.prisma.guestReview.findUnique({ where: { reservationId } })
    if (exists) {
      return reply.code(409).send({ error: 'Avaliação já submetida para esta reserva' })
    }

    const review = await app.prisma.guestReview.create({
      data: {
        resortId: reservation.resortId,
        reservationId,
        guestId: reservation.guestId,
        guestName: reservation.guestName,
        ...rest,
      },
    })

    return reply.code(201).send({ data: review, message: 'Avaliação submetida com sucesso' })
  })

  // ── PATCH /:id/publish — Publicar/despublicar avaliação ──
  app.patch<{ Params: { id: string } }>('/:id/publish', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const review = await app.prisma.guestReview.findUnique({ where: { id: request.params.id } })
    if (!review) {
      return reply.code(404).send({ error: 'Avaliação não encontrada' })
    }

    const updated = await app.prisma.guestReview.update({
      where: { id: request.params.id },
      data: { published: !review.published },
    })

    return reply.send({
      data: updated,
      message: updated.published ? 'Avaliação publicada' : 'Avaliação despublicada',
    })
  })

  // ── POST /:id/reply — Responder a avaliação (gestão) ──
  app.post<{ Params: { id: string } }>('/:id/reply', {
    preHandler: [app.authenticate],
  }, async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = replyReviewSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const review = await app.prisma.guestReview.findUnique({ where: { id: request.params.id } })
    if (!review) {
      return reply.code(404).send({ error: 'Avaliação não encontrada' })
    }

    const updated = await app.prisma.guestReview.update({
      where: { id: request.params.id },
      data: { reply: parsed.data.reply, repliedAt: new Date() },
    })

    return reply.send({ data: updated, message: 'Resposta publicada' })
  })
}

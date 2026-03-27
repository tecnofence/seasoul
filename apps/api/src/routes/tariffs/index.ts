import type { FastifyInstance } from 'fastify'
import { createTariffSchema, updateTariffSchema, listTariffsQuery } from './schemas.js'

export default async function tariffsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar tarifas (paginado + filtros) ──
  app.get('/', async (request, reply) => {
    const parsed = listTariffsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, resortId, roomType, active } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (resortId) where.resortId = resortId
    if (roomType) where.roomType = roomType
    if (active !== undefined) where.active = active

    const [data, total] = await Promise.all([
      app.prisma.tariff.findMany({
        where,
        include: { resort: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { validFrom: 'desc' },
      }),
      app.prisma.tariff.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /active — Obter tarifa ativa para um tipo de quarto ──
  app.get('/active', async (request, reply) => {
    const { resortId, roomType } = request.query as { resortId?: string; roomType?: string }

    if (!resortId || !roomType) {
      return reply.code(400).send({ error: 'resortId e roomType são obrigatórios' })
    }

    const now = new Date()

    const tariff = await app.prisma.tariff.findFirst({
      where: {
        resortId,
        roomType: roomType as any,
        active: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: { validFrom: 'desc' },
    })

    if (!tariff) {
      return reply.code(404).send({ error: 'Nenhuma tarifa ativa para este tipo de quarto' })
    }

    return reply.send({ data: tariff })
  })

  // ── GET /:id — Obter tarifa por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const tariff = await app.prisma.tariff.findUnique({
      where: { id: request.params.id },
      include: { resort: { select: { id: true, name: true } } },
    })

    if (!tariff) {
      return reply.code(404).send({ error: 'Tarifa não encontrada' })
    }

    return reply.send({ data: tariff })
  })

  // ── POST / — Criar tarifa ──
  app.post('/', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = createTariffSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { validFrom, validUntil, ...rest } = parsed.data

    if (new Date(validUntil) <= new Date(validFrom)) {
      return reply.code(400).send({ error: 'Data fim deve ser posterior à data início' })
    }

    const resort = await app.prisma.resort.findUnique({ where: { id: rest.resortId } })
    if (!resort) {
      return reply.code(404).send({ error: 'Resort não encontrado' })
    }

    const tariff = await app.prisma.tariff.create({
      data: { ...rest, validFrom: new Date(validFrom), validUntil: new Date(validUntil) },
      include: { resort: { select: { id: true, name: true } } },
    })

    return reply.code(201).send({ data: tariff, message: 'Tarifa criada com sucesso' })
  })

  // ── PUT /:id — Atualizar tarifa ──
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = updateTariffSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.tariff.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Tarifa não encontrada' })
    }

    const { validFrom, validUntil, ...rest } = parsed.data
    const data: Record<string, unknown> = { ...rest }
    if (validFrom) data.validFrom = new Date(validFrom)
    if (validUntil) data.validUntil = new Date(validUntil)

    const tariff = await app.prisma.tariff.update({
      where: { id: request.params.id },
      data,
      include: { resort: { select: { id: true, name: true } } },
    })

    return reply.send({ data: tariff, message: 'Tarifa atualizada' })
  })

  // ── DELETE /:id — Desativar tarifa ──
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const existing = await app.prisma.tariff.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Tarifa não encontrada' })
    }

    await app.prisma.tariff.update({
      where: { id: request.params.id },
      data: { active: false },
    })

    return reply.send({ message: 'Tarifa desativada' })
  })
}

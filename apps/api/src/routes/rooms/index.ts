import type { FastifyInstance } from 'fastify'
import { createRoomSchema, updateRoomSchema, updateRoomStatusSchema, listRoomsQuery } from './schemas.js'

export default async function roomsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar quartos (paginado + filtros) ──
  app.get('/', async (request, reply) => {
    const parsed = listRoomsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, resortId, type, status, floor } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (resortId) where.resortId = resortId
    if (type) where.type = type
    if (status) where.status = status
    if (floor !== undefined) where.floor = floor

    const [data, total] = await Promise.all([
      app.prisma.room.findMany({
        where,
        include: { resort: { select: { id: true, name: true, slug: true } } },
        skip,
        take: limit,
        orderBy: [{ resortId: 'asc' }, { number: 'asc' }],
      }),
      app.prisma.room.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter quarto por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const room = await app.prisma.room.findUnique({
      where: { id: request.params.id },
      include: { resort: { select: { id: true, name: true, slug: true } } },
    })

    if (!room) {
      return reply.code(404).send({ error: 'Quarto não encontrado' })
    }

    return reply.send({ data: room })
  })

  // ── POST / — Criar quarto ──
  app.post('/', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = createRoomSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    // Verificar resort existe
    const resort = await app.prisma.resort.findUnique({ where: { id: parsed.data.resortId } })
    if (!resort) {
      return reply.code(404).send({ error: 'Resort não encontrado' })
    }

    // Verificar número duplicado no mesmo resort
    const exists = await app.prisma.room.findUnique({
      where: { resortId_number: { resortId: parsed.data.resortId, number: parsed.data.number } },
    })
    if (exists) {
      return reply.code(409).send({ error: `Quarto ${parsed.data.number} já existe neste resort` })
    }

    const room = await app.prisma.room.create({
      data: parsed.data,
      include: { resort: { select: { id: true, name: true, slug: true } } },
    })

    return reply.code(201).send({ data: room, message: 'Quarto criado com sucesso' })
  })

  // ── PUT /:id — Atualizar quarto ──
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = updateRoomSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.room.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Quarto não encontrado' })
    }

    // Verificar número duplicado se está a mudar
    if (parsed.data.number && parsed.data.number !== existing.number) {
      const dup = await app.prisma.room.findUnique({
        where: { resortId_number: { resortId: existing.resortId, number: parsed.data.number } },
      })
      if (dup) {
        return reply.code(409).send({ error: `Quarto ${parsed.data.number} já existe neste resort` })
      }
    }

    const room = await app.prisma.room.update({
      where: { id: request.params.id },
      data: parsed.data,
      include: { resort: { select: { id: true, name: true, slug: true } } },
    })

    return reply.send({ data: room, message: 'Quarto atualizado' })
  })

  // ── PATCH /:id/status — Alterar estado do quarto ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const parsed = updateRoomStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.room.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Quarto não encontrado' })
    }

    const room = await app.prisma.room.update({
      where: { id: request.params.id },
      data: { status: parsed.data.status },
    })

    return reply.send({ data: room, message: `Estado alterado para ${parsed.data.status}` })
  })
}

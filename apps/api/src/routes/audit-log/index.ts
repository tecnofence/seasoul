import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
  userId: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export default async function auditLogRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar registos de auditoria ──
  app.get('/', async (request, reply) => {
    // Apenas admins e gestores podem ver audit logs
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão para ver registos de auditoria' })
    }

    const parsed = listQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, userId, entity, entityId, action, from, to } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    if (entity) where.entity = entity
    if (entityId) where.entityId = entityId
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (from || to) {
      where.createdAt = {}
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from)
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to)
    }

    const [data, total] = await Promise.all([
      app.prisma.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      app.prisma.auditLog.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /entities — Listar entidades distintas ──
  app.get('/entities', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const entities = await app.prisma.auditLog.findMany({
      distinct: ['entity'],
      select: { entity: true },
      orderBy: { entity: 'asc' },
    })

    return reply.send({ data: entities.map((e) => e.entity) })
  })

  // ── GET /:id — Detalhe de um registo ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const log = await app.prisma.auditLog.findUnique({ where: { id: request.params.id } })
    if (!log) {
      return reply.code(404).send({ error: 'Registo não encontrado' })
    }

    return reply.send({ data: log })
  })
}

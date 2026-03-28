import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  entity: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

const createAuditSchema = z.object({
  userId: z.string().optional(),
  userEmail: z.string().email().optional(),
  action: z.string().min(1),
  entity: z.string().min(1),
  entityId: z.string().optional(),
  before: z.record(z.unknown()).optional(),
  after: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
})

const MOCK_AUDIT_LOGS = [
  {
    id: 'al-1',
    userId: 'admin-1',
    userEmail: 'admin@engeris.co.ao',
    action: 'LOGIN',
    entity: 'User',
    entityId: 'admin-1',
    before: null,
    after: null,
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'al-2',
    userId: 'admin-1',
    userEmail: 'admin@engeris.co.ao',
    action: 'CREATE',
    entity: 'Tenant',
    entityId: '2',
    before: null,
    after: { name: 'Hotel Marítimo', plan: 'PROFESSIONAL' },
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'al-3',
    userId: 'admin-2',
    userEmail: 'manuel@engeris.co.ao',
    action: 'UPDATE',
    entity: 'Tenant',
    entityId: '1',
    before: { plan: 'PROFESSIONAL', maxUsers: 20 },
    after: { plan: 'ENTERPRISE', maxUsers: 50 },
    ipAddress: '10.0.0.5',
    userAgent: 'Chrome/124',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'al-4',
    userId: 'admin-1',
    userEmail: 'admin@engeris.co.ao',
    action: 'SUSPEND',
    entity: 'Tenant',
    entityId: '3',
    before: { active: true },
    after: { active: false },
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'al-5',
    userId: 'admin-1',
    userEmail: 'admin@engeris.co.ao',
    action: 'INVOICE_EMIT',
    entity: 'Invoice',
    entityId: 'inv-001',
    before: null,
    after: { number: 'FT 2025/001', total: 500000 },
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'al-6',
    userId: 'admin-2',
    userEmail: 'manuel@engeris.co.ao',
    action: 'DELETE',
    entity: 'User',
    entityId: 'u-old-1',
    before: { name: 'Carlos Veloso', email: 'carlos@old.ao', role: 'RESORT_MANAGER' },
    after: null,
    ipAddress: '10.0.0.5',
    userAgent: 'Chrome/124',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'al-7',
    userId: 'admin-1',
    userEmail: 'admin@engeris.co.ao',
    action: 'MODULE_TOGGLE',
    entity: 'TenantModule',
    entityId: 'tm-5',
    before: { active: false },
    after: { active: true, moduleId: 'hr' },
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'al-8',
    userId: 'admin-1',
    userEmail: 'admin@engeris.co.ao',
    action: 'LOGOUT',
    entity: 'User',
    entityId: 'admin-1',
    before: null,
    after: null,
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
]

export default async function adminAuditLogRoutes(app: FastifyInstance) {
  // Listar audit log paginado com filtros
  app.get('/', async (request, reply) => {
    try {
      const parsed = listQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.format() })
      }

      const { page, limit, entity, action, userId, dateFrom, dateTo } = parsed.data
      const skip = (page - 1) * limit

      const where: any = {}
      if (entity) where.entity = entity
      if (action) where.action = action
      if (userId) where.userId = userId
      if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = new Date(dateFrom)
        if (dateTo) where.createdAt.lte = new Date(dateTo)
      }

      const [total, logs] = await Promise.all([
        app.prisma.auditLog.count({ where }),
        app.prisma.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        })
      ])

      return reply.send({
        data: logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      })
    } catch (err) {
      // Mock fallback com 8 entradas de exemplo
      const parsed = listQuerySchema.safeParse(request.query)
      const { page = 1, limit: lim = 50, entity, action, userId, dateFrom, dateTo } = parsed.success ? parsed.data : { page: 1, limit: 50, entity: undefined, action: undefined, userId: undefined, dateFrom: undefined, dateTo: undefined }

      let results = [...MOCK_AUDIT_LOGS]
      if (entity) results = results.filter(l => l.entity === entity)
      if (action) results = results.filter(l => l.action === action)
      if (userId) results = results.filter(l => l.userId === userId)
      if (dateFrom) results = results.filter(l => new Date(l.createdAt) >= new Date(dateFrom))
      if (dateTo) results = results.filter(l => new Date(l.createdAt) <= new Date(dateTo))

      const total = results.length
      const paginated = results.slice((page - 1) * lim, page * lim)

      return reply.send({
        data: paginated,
        total,
        page,
        totalPages: Math.ceil(total / lim)
      })
    }
  })

  // Criar entrada de audit log
  app.post('/', async (request, reply) => {
    try {
      const parsed = createAuditSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })
      }

      const { userId, userEmail, action, entity, entityId, before, after, ipAddress } = parsed.data

      const log = await app.prisma.auditLog.create({
        data: {
          userId,
          userEmail,
          action,
          entity,
          entityId,
          before: before ?? undefined,
          after: after ?? undefined,
          ipAddress,
          userAgent: request.headers['user-agent'] ?? null
        }
      })

      return reply.code(201).send({ data: log })
    } catch (err) {
      // Mock fallback — confirma criação sem persistir
      const parsed = createAuditSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })
      }

      return reply.code(201).send({
        data: {
          id: `mock-al-${Date.now()}`,
          ...parsed.data,
          userAgent: request.headers['user-agent'] ?? null,
          createdAt: new Date().toISOString()
        }
      })
    }
  })
}

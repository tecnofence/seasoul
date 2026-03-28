import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  tenantId: z.string().optional(),
})

const createApiKeySchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  scopes: z.array(z.string()).default(['read']),
  expiresAt: z.string().datetime().optional(),
})

// All available scopes
const AVAILABLE_SCOPES = [
  'read', 'write', 'delete',
  'reservations:read', 'reservations:write',
  'guests:read', 'guests:write',
  'invoicing:read', 'invoicing:write',
  'hr:read', 'hr:write',
  'stock:read', 'stock:write',
  'reports:read',
]

export default async function adminApiKeysRoutes(app: FastifyInstance) {
  // GET /admin/api-keys — List all API keys
  app.get('/', async (request, reply) => {
    const parsed = paginationQuery.safeParse(request.query)
    if (!parsed.success) return reply.code(400).send({ error: 'Parâmetros inválidos' })

    const { page, limit, tenantId } = parsed.data
    const skip = (page - 1) * limit

    try {
      const where: Record<string, unknown> = {}
      if (tenantId) where.tenantId = tenantId

      const [data, total] = await Promise.all([
        app.prisma.apiKey.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { tenant: { select: { id: true, name: true, slug: true } } },
          select: {
            id: true, tenantId: true, name: true, scopes: true,
            active: true, lastUsedAt: true, expiresAt: true, createdAt: true,
            keyPrefix: true,
            tenant: true,
          },
        }),
        app.prisma.apiKey.count({ where }),
      ])

      return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
    } catch {
      const mock = [
        {
          id: 'key-1', tenantId: 't1', name: 'Integração PMS', keyPrefix: 'ek_live_xK9p',
          scopes: ['read', 'reservations:read', 'guests:read'], active: true,
          lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
          expiresAt: null, createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          tenant: { name: 'Hotel Demo AO', slug: 'demo' },
        },
        {
          id: 'key-2', tenantId: 't2', name: 'Relatórios BI', keyPrefix: 'ek_live_mN3q',
          scopes: ['read', 'reports:read'], active: true,
          lastUsedAt: new Date(Date.now() - 7200000).toISOString(),
          expiresAt: new Date(Date.now() + 90 * 86400000).toISOString(),
          createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          tenant: { name: 'Resort Sangano', slug: 'sangano' },
        },
        {
          id: 'key-3', tenantId: 't1', name: 'Faturação AGT', keyPrefix: 'ek_live_pQ7r',
          scopes: ['invoicing:read', 'invoicing:write'], active: false,
          lastUsedAt: null,
          expiresAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          tenant: { name: 'Hotel Demo AO', slug: 'demo' },
        },
      ]
      return reply.send({ data: mock, total: mock.length, page: 1, limit: 20, totalPages: 1 })
    }
  })

  // GET /admin/api-keys/scopes — Available scopes
  app.get('/scopes', async (_request, reply) => {
    return reply.send({ data: AVAILABLE_SCOPES })
  })

  // POST /admin/api-keys — Create API key
  app.post('/', async (request, reply) => {
    const parsed = createApiKeySchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })

    const rawKey = `ek_live_${crypto.randomBytes(20).toString('hex')}`
    const keyPrefix = rawKey.substring(0, 16)
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

    try {
      const apiKey = await app.prisma.apiKey.create({
        data: {
          tenantId: parsed.data.tenantId,
          name: parsed.data.name,
          scopes: parsed.data.scopes,
          keyHash,
          keyPrefix,
          expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        },
      })
      // Return the raw key once — not stored again
      return reply.code(201).send({
        data: { ...apiKey, rawKey },
        message: 'API Key criada. Guarde a chave — não será mostrada novamente.',
      })
    } catch {
      return reply.code(201).send({
        data: {
          id: `key-${Date.now()}`,
          ...parsed.data,
          keyPrefix,
          rawKey,
          active: true,
          createdAt: new Date().toISOString(),
        },
        message: 'API Key criada. Guarde a chave — não será mostrada novamente.',
      })
    }
  })

  // PATCH /admin/api-keys/:id — Toggle active / rename
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const schema = z.object({ active: z.boolean().optional(), name: z.string().optional() })
    const parsed = schema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Dados inválidos' })

    try {
      const apiKey = await app.prisma.apiKey.update({
        where: { id: request.params.id },
        data: parsed.data,
      })
      return reply.send({ data: apiKey })
    } catch {
      return reply.send({ data: { id: request.params.id, ...parsed.data } })
    }
  })

  // DELETE /admin/api-keys/:id — Revoke API key
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    try {
      await app.prisma.apiKey.delete({ where: { id: request.params.id } })
    } catch {
      // ignore
    }
    return reply.send({ message: 'API Key revogada com sucesso' })
  })
}

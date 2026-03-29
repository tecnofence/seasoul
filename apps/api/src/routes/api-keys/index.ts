import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'

// Scopes disponíveis para API Keys
const AVAILABLE_SCOPES = [
  'invoices:read', 'invoices:write',
  'reservations:read', 'reservations:write',
  'guests:read', 'guests:write',
  'stock:read', 'stock:write',
  'hr:read',
  'reports:read',
  'webhooks:manage',
]

function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = 'sk_live_' + crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  const prefix = raw.substring(0, 16) // "sk_live_XXXXXXXX"
  return { raw, hash, prefix }
}

export default async function apiKeysRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — listar API keys do tenant ──
  app.get('/', async (request, reply) => {
    const user = request.user as { tenantId?: string; role: string }
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão' })
    }
    const keys = await app.prisma.apiKey.findMany({
      where: { tenantId: user.tenantId!, active: true },
      select: {
        id: true, name: true, keyPrefix: true, scopes: true,
        lastUsedAt: true, expiresAt: true, createdAt: true, createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ data: keys })
  })

  // ── POST / — criar nova API key ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão' })
    }
    const body = request.body as {
      name: string
      scopes: string[]
      expiresAt?: string
    }
    if (!body.name) return reply.status(400).send({ error: 'name é obrigatório' })
    if (!body.scopes?.length) return reply.status(400).send({ error: 'scopes são obrigatórios' })

    const invalidScopes = body.scopes.filter(s => !AVAILABLE_SCOPES.includes(s))
    if (invalidScopes.length) {
      return reply.status(400).send({ error: `Scopes inválidos: ${invalidScopes.join(', ')}` })
    }

    const { raw, hash, prefix } = generateApiKey()

    const key = await app.prisma.apiKey.create({
      data: {
        tenantId: user.tenantId!,
        name: body.name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: body.scopes,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        createdBy: user.id,
      },
    })

    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'API_KEY_CREATED',
        entity: 'ApiKey',
        entityId: key.id,
        after: { name: body.name, scopes: body.scopes, prefix },
      },
    })

    // Mostrar o token em claro UMA única vez — depois nunca mais é acessível
    return reply.status(201).send({
      data: {
        id: key.id,
        name: key.name,
        key: raw, // APENAS NA CRIAÇÃO
        keyPrefix: prefix,
        scopes: key.scopes,
        expiresAt: key.expiresAt,
        _warning: 'Guarde esta chave em segurança. Não será mostrada novamente.',
      },
    })
  })

  // ── DELETE /:id — revogar API key ──
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão' })
    }
    await app.prisma.apiKey.updateMany({
      where: { id: request.params.id, tenantId: user.tenantId! },
      data: { active: false },
    })
    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'API_KEY_REVOKED',
        entity: 'ApiKey',
        entityId: request.params.id,
        after: { revokedBy: user.id },
      },
    })
    return reply.send({ message: 'API key revogada com sucesso' })
  })

  // ── GET /scopes — listar scopes disponíveis ──
  app.get('/scopes', async (_request, reply) => {
    return reply.send({ data: AVAILABLE_SCOPES })
  })
}

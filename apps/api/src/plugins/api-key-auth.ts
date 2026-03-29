import crypto from 'node:crypto'
import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

/**
 * Plugin para autenticação via API Key (Bearer sk_live_...)
 * Complementa o JWT auth para integrações B2B
 * Uso: Bearer sk_live_<token> no header Authorization
 */
export default fp(async function apiKeyAuthPlugin(app: FastifyInstance) {
  app.decorate('authenticateApiKey', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer sk_live_')) {
      return reply.status(401).send({ error: 'API Key inválida ou em falta' })
    }

    const rawKey = authHeader.replace('Bearer ', '')
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

    const apiKey = await (app as any).prisma.apiKey.findUnique({
      where: { keyHash },
      include: { tenant: { select: { id: true, name: true, active: true } } },
    })

    if (!apiKey || !apiKey.active) {
      return reply.status(401).send({ error: 'API Key inválida ou revogada' })
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return reply.status(401).send({ error: 'API Key expirada' })
    }

    if (!apiKey.tenant?.active) {
      return reply.status(403).send({ error: 'Tenant inactivo' })
    }

    // Actualizar lastUsedAt (fire-and-forget)
    ;(app as any).prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {})

    // Injectar contexto na request (compatível com o JWT user)
    ;(request as any).user = {
      id: `apikey:${apiKey.id}`,
      tenantId: apiKey.tenantId,
      role: 'API_CLIENT',
      scopes: apiKey.scopes,
      apiKeyId: apiKey.id,
    }
  })
})

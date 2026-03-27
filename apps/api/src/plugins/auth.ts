import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

async function authPlugin(app: FastifyInstance) {
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = await request.jwtVerify<{
        id: string
        email?: string
        phone?: string
        role?: string
        resortId?: string | null
        tenantId?: string | null
        type?: 'staff' | 'guest'
      }>()

      // Normalizar: staff tokens têm email/role, guest tokens têm phone/type
      request.user = {
        id: decoded.id,
        email: decoded.email,
        phone: decoded.phone,
        role: decoded.role || 'GUEST',
        resortId: decoded.resortId,
        tenantId: decoded.tenantId ?? null,
        type: decoded.type || 'staff',
      }

      // Inicializar tenant como null (será preenchido pelo loadTenantContext)
      request.tenant = null
    } catch {
      reply.code(401).send({ error: 'Token inválido ou expirado' })
    }
  })

  app.decorate('adminAuthenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    await app.authenticate(request, reply)
    if (reply.sent) return

    const user = request.user as { role?: string }
    if (user?.role !== 'SUPER_ADMIN') {
      return reply.code(403).send({ error: 'Acesso restrito a administradores do sistema' })
    }
  })
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['@fastify/jwt'],
})

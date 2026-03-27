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
        type?: 'staff' | 'guest'
      }>()

      // Normalizar: staff tokens têm email/role, guest tokens têm phone/type
      request.user = {
        id: decoded.id,
        email: decoded.email,
        phone: decoded.phone,
        role: decoded.role || 'GUEST',
        resortId: decoded.resortId,
        type: decoded.type || 'staff',
      }
    } catch {
      reply.code(401).send({ error: 'Token inválido ou expirado' })
    }
  })
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['@fastify/jwt'],
})

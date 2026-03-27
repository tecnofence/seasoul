import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

async function authPlugin(app: FastifyInstance) {
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const decoded = await request.jwtVerify<{
        id: string
        email: string
        role: string
        resortId?: string | null
      }>()
      request.user = decoded
    } catch {
      reply.code(401).send({ error: 'Token inválido ou expirado' })
    }
  })
}

export default fp(authPlugin, {
  name: 'auth',
  dependencies: ['@fastify/jwt'],
})

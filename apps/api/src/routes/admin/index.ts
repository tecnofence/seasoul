import { FastifyInstance } from 'fastify'
import adminTenantsRoutes from './tenants.js'
import adminAnalyticsRoutes from './analytics.js'
import adminModulesRoutes from './modules.js'

export default async function adminRoutes(app: FastifyInstance) {
  // Middleware global para todas as rotas de admin
  app.addHook('preHandler', app.adminAuthenticate)

  // Sub-rotas do admin
  await app.register(adminTenantsRoutes, { prefix: '/tenants' })
  await app.register(adminAnalyticsRoutes, { prefix: '/analytics' })
  await app.register(adminModulesRoutes, { prefix: '/modules' })
}

import { FastifyInstance } from 'fastify'
import adminTenantsRoutes from './tenants.js'
import adminAnalyticsRoutes from './analytics.js'
import adminModulesRoutes from './modules.js'
import adminUsersRoutes from './users.js'
import adminBillingRoutes from './billing.js'
import adminAuditLogRoutes from './audit-log.js'
import adminSettingsRoutes from './settings.js'
import adminWebhooksRoutes from './webhooks.js'
import adminApiKeysRoutes from './api-keys.js'

export default async function adminRoutes(app: FastifyInstance) {
  // Middleware global para todas as rotas de admin
  app.addHook('preHandler', app.adminAuthenticate)

  // Sub-rotas do admin
  await app.register(adminTenantsRoutes, { prefix: '/tenants' })
  await app.register(adminAnalyticsRoutes, { prefix: '/analytics' })
  await app.register(adminModulesRoutes, { prefix: '/modules' })
  await app.register(adminUsersRoutes, { prefix: '/users' })
  await app.register(adminBillingRoutes, { prefix: '/billing' })
  await app.register(adminAuditLogRoutes, { prefix: '/audit-log' })
  await app.register(adminSettingsRoutes, { prefix: '/settings' })
  await app.register(adminWebhooksRoutes, { prefix: '/webhooks' })
  await app.register(adminApiKeysRoutes, { prefix: '/api-keys' })
}

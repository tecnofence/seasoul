import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

// Plugins
import prismaPlugin from './plugins/prisma.js'
import authPlugin from './plugins/auth.js'
import rbacPlugin from './plugins/rbac.js'
import tenantContextPlugin from './plugins/tenant-context.js'

// Rotas — Sprint 1
import authRoutes from './routes/auth/index.js'
import usersRoutes from './routes/users/index.js'
import roomsRoutes from './routes/rooms/index.js'
import tariffsRoutes from './routes/tariffs/index.js'
import reservationsRoutes from './routes/reservations/index.js'

// Rotas — Produtos
import productsRoutes from './routes/products/index.js'

// Rotas — Sprint 2
import posRoutes from './routes/pos/index.js'
import invoicesRoutes from './routes/invoices/index.js'
import stockRoutes from './routes/stock/index.js'
import suppliersRoutes from './routes/suppliers/index.js'
import hrRoutes from './routes/hr/index.js'
import attendanceRoutes from './routes/attendance/index.js'
import payrollRoutes from './routes/payroll/index.js'

// Rotas — Sprint 3
import locksRoutes from './routes/locks/index.js'
import guestRoutes from './routes/guest/index.js'
import serviceOrderRoutes from './routes/service-orders/index.js'
import chatRoutes from './routes/chat/index.js'
import reviewsRoutes from './routes/reviews/index.js'
import dashboardRoutes from './routes/dashboard/index.js'
import notificationsRoutes from './routes/notifications/index.js'
import alertsRoutes from './routes/alerts/index.js'
import maintenanceRoutes from './routes/maintenance/index.js'
import auditLogRoutes from './routes/audit-log/index.js'
import documentsRoutes from './routes/documents/index.js'
import tenantsRoutes from './routes/tenants/index.js'
import trainingModeRoutes from './routes/training-mode/index.js'

// Rotas — Módulos ENGERIS ONE
import invoicingRoutes from './routes/invoicing/index.js'
import securityRoutes from './routes/security/index.js'
import engineeringRoutes from './routes/engineering/index.js'
import electricalRoutes from './routes/electrical/index.js'
import crmRoutes from './routes/crm/index.js'
import fleetRoutes from './routes/fleet/index.js'
import contractsRoutes from './routes/contracts/index.js'

// Rotas — Módulos Verticais (Fase 2)
import spaRoutes from './routes/spa/index.js'
import eventsRoutes from './routes/events/index.js'
import realEstateRoutes from './routes/real-estate/index.js'
import logisticsRoutes from './routes/logistics/index.js'
import educationRoutes from './routes/education/index.js'
import healthcareRoutes from './routes/healthcare/index.js'
import agricultureRoutes from './routes/agriculture/index.js'
import manufacturingRoutes from './routes/manufacturing/index.js'
import consultingRoutes from './routes/consulting/index.js'
import telecomRoutes from './routes/telecom/index.js'
import legalRoutes from './routes/legal/index.js'
import accountingRoutes from './routes/accounting/index.js'
import activitiesRoutes from './routes/activities/index.js'
import retailRoutes from './routes/retail/index.js'
import adminRoutes from './routes/admin/index.js'

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss' },
    },
  },
})

// ── PLUGINS ───────────────────────────────────
await app.register(prismaPlugin)

await app.register(cors, {
  origin: process.env.CORS_ORIGINS?.split(',') ?? [],
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET!,
})

await app.register(authPlugin)
await app.register(rbacPlugin)
await app.register(tenantContextPlugin)

await app.register(rateLimit, {
  max:        Number(process.env.RATE_LIMIT_MAX) || 100,
  timeWindow: Number(process.env.RATE_LIMIT_WINDOW) || 60_000,
})

await app.register(swagger, {
  openapi: {
    info: {
      title:       'ENGERIS ONE API',
      description: 'Plataforma ERP Modular — ENGERIS',
      version:     '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
})

await app.register(swaggerUi, { routePrefix: '/docs' })

// ── ERROR HANDLER GLOBAL ──────────────────────
app.setErrorHandler((error, request, reply) => {
  const prismaError = error as any

  // Prisma unique constraint violation
  if (prismaError.code === 'P2002') {
    return reply.status(409).send({
      error: 'Registo duplicado',
      field: prismaError.meta?.target?.[0],
    })
  }

  // Prisma record not found
  if (prismaError.code === 'P2025') {
    return reply.status(404).send({ error: 'Registo não encontrado' })
  }

  // Prisma foreign key constraint
  if (prismaError.code === 'P2003') {
    return reply.status(400).send({ error: 'Referência inválida', field: prismaError.meta?.field_name })
  }

  // Log unexpected errors
  request.log.error(error)
  return reply.status(500).send({ error: 'Erro interno do servidor' })
})

// ── SAÚDE ─────────────────────────────────────
app.get('/health', async () => ({
  status:    'ok',
  timestamp: new Date().toISOString(),
  version:   process.env.npm_package_version ?? '1.0.0',
}))

// ── ROTAS — Sprint 1 ─────────────────────────
await app.register(authRoutes,         { prefix: '/v1/auth' })
await app.register(usersRoutes,        { prefix: '/v1/users' })
await app.register(roomsRoutes,        { prefix: '/v1/rooms' })
await app.register(tariffsRoutes,      { prefix: '/v1/tariffs' })
await app.register(reservationsRoutes, { prefix: '/v1/reservations' })

// ── ROTAS — Produtos ─────────────────────────
await app.register(productsRoutes,     { prefix: '/v1/products' })

// ── ROTAS — Sprint 2 ─────────────────────────
await app.register(posRoutes,          { prefix: '/v1/pos' })
await app.register(invoicesRoutes,     { prefix: '/v1/invoices' })
await app.register(stockRoutes,        { prefix: '/v1/stock' })
await app.register(suppliersRoutes,    { prefix: '/v1/suppliers' })
await app.register(hrRoutes,           { prefix: '/v1/hr' })
await app.register(attendanceRoutes,   { prefix: '/v1/attendance' })
await app.register(payrollRoutes,      { prefix: '/v1/payroll' })

// ── ROTAS — Sprint 3 ─────────────────────────
await app.register(locksRoutes,          { prefix: '/v1/locks' })
await app.register(guestRoutes,          { prefix: '/v1/guest' })
await app.register(serviceOrderRoutes,   { prefix: '/v1/service-orders' })
await app.register(chatRoutes,           { prefix: '/v1/chat' })
await app.register(reviewsRoutes,        { prefix: '/v1/reviews' })
await app.register(dashboardRoutes,      { prefix: '/v1/dashboard' })
await app.register(notificationsRoutes,  { prefix: '/v1/notifications' })
await app.register(alertsRoutes,         { prefix: '/v1/alerts' })
await app.register(maintenanceRoutes,    { prefix: '/v1/maintenance' })
await app.register(auditLogRoutes,       { prefix: '/v1/audit-log' })
await app.register(documentsRoutes,      { prefix: '/v1/documents' })

// ── ROTAS — Multi-Tenant & Módulos ─────────
await app.register(tenantsRoutes,        { prefix: '/v1/tenants' })
await app.register(adminRoutes,          { prefix: '/v1/admin' })
await app.register(trainingModeRoutes,   { prefix: '/v1/training-mode' })

// ── ROTAS — Módulos ENGERIS ONE ─────────────
await app.register(invoicingRoutes,     { prefix: '/v1/invoicing' })
await app.register(securityRoutes,      { prefix: '/v1/security' })
await app.register(engineeringRoutes,   { prefix: '/v1/engineering' })
await app.register(electricalRoutes,    { prefix: '/v1/electrical' })
await app.register(crmRoutes,           { prefix: '/v1/crm' })
await app.register(fleetRoutes,         { prefix: '/v1/fleet' })
await app.register(contractsRoutes,     { prefix: '/v1/contracts' })

// ── ROTAS — Módulos Verticais (Fase 2) ──────
await app.register(spaRoutes,           { prefix: '/v1/spa' })
await app.register(eventsRoutes,        { prefix: '/v1/events' })
await app.register(realEstateRoutes,    { prefix: '/v1/real-estate' })
await app.register(logisticsRoutes,     { prefix: '/v1/logistics' })
await app.register(educationRoutes,     { prefix: '/v1/education' })
await app.register(healthcareRoutes,    { prefix: '/v1/healthcare' })
await app.register(agricultureRoutes,   { prefix: '/v1/agriculture' })
await app.register(manufacturingRoutes, { prefix: '/v1/manufacturing' })
await app.register(consultingRoutes,    { prefix: '/v1/consulting' })
await app.register(telecomRoutes,       { prefix: '/v1/telecom' })
await app.register(legalRoutes,         { prefix: '/v1/legal' })
await app.register(accountingRoutes,    { prefix: '/v1/accounting' })
await app.register(activitiesRoutes,   { prefix: '/v1/activities' })
await app.register(retailRoutes,       { prefix: '/v1/retail' })

// ── Webhooks (TODO) ──────────────────────────
// await app.register(seamWebhookRoutes, { prefix: '/webhooks/seam' })
// await app.register(agtWebhookRoutes,  { prefix: '/webhooks/agt' })

// ── START ─────────────────────────────────────
const port = Number(process.env.API_PORT) || 3001
const host = process.env.API_HOST || '0.0.0.0'

await app.listen({ port, host })

app.log.info(`API a correr em http://localhost:${port}`)
app.log.info(`Swagger docs em http://localhost:${port}/docs`)

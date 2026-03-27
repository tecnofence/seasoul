import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

// Plugins
import prismaPlugin from './plugins/prisma.js'
import authPlugin from './plugins/auth.js'

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

await app.register(rateLimit, {
  max:        Number(process.env.RATE_LIMIT_MAX) || 100,
  timeWindow: Number(process.env.RATE_LIMIT_WINDOW) || 60_000,
})

await app.register(swagger, {
  openapi: {
    info: {
      title:       'Sea and Soul API',
      description: 'ERP API — ENGERIS',
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

// ── Webhooks (TODO) ──────────────────────────
// await app.register(seamWebhookRoutes, { prefix: '/webhooks/seam' })
// await app.register(agtWebhookRoutes,  { prefix: '/webhooks/agt' })

// ── START ─────────────────────────────────────
const port = Number(process.env.API_PORT) || 3001
const host = process.env.API_HOST || '0.0.0.0'

await app.listen({ port, host })

app.log.info(`API a correr em http://localhost:${port}`)
app.log.info(`Swagger docs em http://localhost:${port}/docs`)

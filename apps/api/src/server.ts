import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const app = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss' },
    },
  },
})

// ── PRISMA ────────────────────────────────────
// Disponibiliza prisma client como decorator em todos os handlers
app.decorate('prisma', prisma)

app.addHook('onClose', async () => {
  await prisma.$disconnect()
})

// ── PLUGINS ───────────────────────────────────
await app.register(cors, {
  origin: process.env.CORS_ORIGINS?.split(',') ?? [],
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET!,
})

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

// ── HOOK DE AUTENTICAÇÃO ──────────────────────
app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ error: 'Token inválido ou expirado' })
  }
})

// ── SAÚDE ─────────────────────────────────────
app.get('/health', async () => ({
  status:    'ok',
  timestamp: new Date().toISOString(),
  version:   process.env.npm_package_version ?? '1.0.0',
}))

// ── ROTAS ─────────────────────────────────────
// TODO Sprint 1 — Semana 2
// await app.register(authRoutes,        { prefix: '/v1/auth' })
// await app.register(usersRoutes,       { prefix: '/v1/users' })

// TODO Sprint 1 — Semana 3-4
// await app.register(reservationsRoutes,{ prefix: '/v1/reservations' })
// await app.register(roomsRoutes,       { prefix: '/v1/rooms' })
// await app.register(tariffsRoutes,     { prefix: '/v1/tariffs' })

// TODO Sprint 2 — Semana 5-6
// await app.register(posRoutes,         { prefix: '/v1/pos' })
// await app.register(invoicesRoutes,    { prefix: '/v1/invoices' })
// await app.register(agtRoutes,         { prefix: '/v1/agt' })

// TODO Sprint 2 — Semana 7-8
// await app.register(stockRoutes,       { prefix: '/v1/stock' })
// await app.register(suppliersRoutes,   { prefix: '/v1/suppliers' })
// await app.register(hrRoutes,          { prefix: '/v1/hr' })
// await app.register(attendanceRoutes,  { prefix: '/v1/attendance' })
// await app.register(payrollRoutes,     { prefix: '/v1/payroll' })

// TODO Sprint 3 — Semana 9-10
// await app.register(locksRoutes,       { prefix: '/v1/locks' })
// await app.register(guestRoutes,       { prefix: '/v1/guest' })
// await app.register(serviceOrderRoutes,{ prefix: '/v1/service-orders' })
// await app.register(chatRoutes,        { prefix: '/v1/chat' })
// await app.register(reviewsRoutes,     { prefix: '/v1/reviews' })
// await app.register(dashboardRoutes,   { prefix: '/v1/dashboard' })
// await app.register(notificationsRoutes,{prefix: '/v1/notifications' })

// TODO Webhooks
// await app.register(seamWebhookRoutes, { prefix: '/webhooks/seam' })
// await app.register(agtWebhookRoutes,  { prefix: '/webhooks/agt' })

// ── START ─────────────────────────────────────
const port = Number(process.env.API_PORT) || 3001
const host = process.env.API_HOST || '0.0.0.0'

await app.listen({ port, host })

app.log.info(`🚀 API a correr em http://localhost:${port}`)
app.log.info(`📖 Swagger docs em http://localhost:${port}/docs`)

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import webhooksRoutes from '../index.js'

// Mock the webhook utility so deliverWebhook doesn't make real HTTP calls
vi.mock('../../../utils/webhook.js', () => ({
  WEBHOOK_EVENTS: [
    'invoice.created', 'invoice.paid', 'invoice.cancelled',
    'reservation.created', 'reservation.checkin', 'reservation.checkout',
    'maintenance.created', 'maintenance.resolved',
    'guest.created', 'stock.low', 'test.ping',
  ] as const,
  deliverWebhook: vi.fn().mockResolvedValue(true),
}))

const mockPrisma = {
  webhookEndpoint: {
    findMany:    vi.fn(),
    create:      vi.fn(),
    updateMany:  vi.fn(),
    deleteMany:  vi.fn(),
    findFirst:   vi.fn(),
  },
  webhookDelivery: {
    findMany: vi.fn(),
  },
}

const adminUser = {
  id:       'user-admin',
  email:    'admin@engeris.ao',
  role:     'SUPER_ADMIN',
  tenantId: 'tenant-1',
}

const staffUser = {
  id:       'user-staff',
  email:    'staff@engeris.ao',
  role:     'STAFF',
  tenantId: 'tenant-1',
}

function buildApp(user: any = adminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Webhooks — /v1/webhooks', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(webhooksRoutes, { prefix: '/v1/webhooks' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET /events ──

  it('GET /events — deve listar eventos suportados (200)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/webhooks/events' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toContain('invoice.created')
    expect(body.data).toContain('test.ping')
  })

  // ── GET / — listar endpoints ──

  it('GET / — deve listar endpoints do tenant (200)', async () => {
    const mockEndpoints = [
      {
        id: 'ep-1', url: 'https://erp.example.com/hooks',
        events: ['invoice.created'], active: true,
        failureCount: 0, createdAt: new Date(),
      },
    ]
    mockPrisma.webhookEndpoint.findMany.mockResolvedValue(mockEndpoints)

    const res = await app.inject({ method: 'GET', url: '/v1/webhooks' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
    expect(mockPrisma.webhookEndpoint.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-1' } })
    )
  })

  it('GET / — deve retornar 403 para STAFF', async () => {
    const staffApp = buildApp(staffUser)
    await staffApp.register(webhooksRoutes, { prefix: '/v1/webhooks' })
    await staffApp.ready()

    const res = await staffApp.inject({ method: 'GET', url: '/v1/webhooks' })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  // ── POST / — criar endpoint ──

  it('POST / — deve criar endpoint com secret (201)', async () => {
    mockPrisma.webhookEndpoint.create.mockResolvedValue({
      id: 'ep-new', url: 'https://erp.example.com/hooks',
      events: ['invoice.created', 'reservation.checkin'],
      secret: 'whsec_abc123', description: 'ERP Hook',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks',
      payload: {
        url:    'https://erp.example.com/hooks',
        events: ['invoice.created', 'reservation.checkin'],
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data.secret).toMatch(/^whsec_/)
    expect(body.data._warning).toBeDefined()
    expect(body.data.url).toBe('https://erp.example.com/hooks')
  })

  it('POST / — deve rejeitar URLs sem HTTPS (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks',
      payload: {
        url:    'http://insecure.example.com/hooks',
        events: ['invoice.created'],
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('url deve usar HTTPS')
  })

  it('POST / — deve retornar 400 quando url está em falta', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks',
      payload: { events: ['invoice.created'] },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('url é obrigatório')
  })

  it('POST / — deve retornar 400 quando events está vazio', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks',
      payload: { url: 'https://erp.example.com/hooks', events: [] },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('events são obrigatórios')
  })

  it('POST / — deve retornar 400 para eventos inválidos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/webhooks',
      payload: {
        url:    'https://erp.example.com/hooks',
        events: ['invoice.created', 'fake.event', 'another.invalid'],
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('Eventos inválidos')
  })

  it('POST / — deve retornar 403 para STAFF', async () => {
    const staffApp = buildApp(staffUser)
    await staffApp.register(webhooksRoutes, { prefix: '/v1/webhooks' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/webhooks',
      payload: { url: 'https://erp.example.com/hooks', events: ['invoice.created'] },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  // ── PATCH /:id ──

  it('PATCH /:id — deve actualizar eventos do endpoint (200)', async () => {
    mockPrisma.webhookEndpoint.updateMany.mockResolvedValue({ count: 1 })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/webhooks/ep-1',
      payload: { events: ['invoice.created', 'invoice.paid'] },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Endpoint actualizado')
  })

  it('PATCH /:id — deve retornar 404 quando endpoint não existe', async () => {
    mockPrisma.webhookEndpoint.updateMany.mockResolvedValue({ count: 0 })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/webhooks/nonexistent',
      payload: { active: false },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Endpoint não encontrado')
  })

  // ── DELETE /:id ──

  it('DELETE /:id — deve remover endpoint (200)', async () => {
    mockPrisma.webhookEndpoint.deleteMany.mockResolvedValue({ count: 1 })

    const res = await app.inject({ method: 'DELETE', url: '/v1/webhooks/ep-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Endpoint removido')
    expect(mockPrisma.webhookEndpoint.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ep-1', tenantId: 'tenant-1' } })
    )
  })

  // ── GET /:id/deliveries ──

  it('GET /:id/deliveries — deve listar histórico de entregas (200)', async () => {
    const mockDeliveries = [
      { id: 'd-1', endpointId: 'ep-1', event: 'invoice.created', success: true, statusCode: 200, createdAt: new Date() },
    ]
    mockPrisma.webhookDelivery.findMany.mockResolvedValue(mockDeliveries)

    const res = await app.inject({ method: 'GET', url: '/v1/webhooks/ep-1/deliveries' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
    expect(mockPrisma.webhookDelivery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { endpointId: 'ep-1' }, take: 50 })
    )
  })

  it('GET /:id/deliveries — deve retornar 403 para STAFF', async () => {
    const staffApp = buildApp(staffUser)
    await staffApp.register(webhooksRoutes, { prefix: '/v1/webhooks' })
    await staffApp.ready()

    const res = await staffApp.inject({ method: 'GET', url: '/v1/webhooks/ep-1/deliveries' })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  // ── POST /:id/test ──

  it('POST /:id/test — deve disparar webhook de teste com sucesso (200)', async () => {
    mockPrisma.webhookEndpoint.findFirst.mockResolvedValue({
      id:       'ep-1',
      url:      'https://erp.example.com/hooks',
      secret:   'whsec_abc123',
      tenantId: 'tenant-1',
    })

    const res = await app.inject({ method: 'POST', url: '/v1/webhooks/ep-1/test' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.success).toBe(true)
    expect(body.message).toBe('Webhook entregue com sucesso')
  })

  it('POST /:id/test — deve retornar 404 quando endpoint não encontrado', async () => {
    mockPrisma.webhookEndpoint.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'POST', url: '/v1/webhooks/nonexistent/test' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Endpoint não encontrado')
  })
})

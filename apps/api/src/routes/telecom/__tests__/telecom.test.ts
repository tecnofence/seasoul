import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import telecomRoutes from '../index.js'

const mockPrisma = {
  telecomSubscription: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

const superAdminUser = {
  id: 'user-1', email: 'admin@engeris.ao', role: 'SUPER_ADMIN',
  tenantId: 'tenant-1', type: 'staff' as const,
}

const regularUser = {
  id: 'user-2', email: 'staff@engeris.ao', role: 'STAFF',
  tenantId: 'tenant-1', type: 'staff' as const,
}

const noTenantUser = {
  id: 'user-3', email: 'noTenant@engeris.ao', role: 'SUPER_ADMIN',
  tenantId: undefined, type: 'staff' as const,
}

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Telecom API — /v1/telecom', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(telecomRoutes, { prefix: '/v1/telecom' })
    await app.ready()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('GET / — should list subscriptions with pagination (200)', async () => {
    const subs = [{ id: 'sub-1', clientName: 'João', planType: 'MOBILE' }]
    mockPrisma.telecomSubscription.findMany.mockResolvedValue(subs)
    mockPrisma.telecomSubscription.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/telecom?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET / — should filter by status and planType', async () => {
    mockPrisma.telecomSubscription.findMany.mockResolvedValue([])
    mockPrisma.telecomSubscription.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/telecom?status=ACTIVE&planType=INTERNET' })

    expect(mockPrisma.telecomSubscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE', planType: 'INTERNET' }),
      })
    )
  })

  it('GET /:id — should return a subscription by ID (200)', async () => {
    const sub = { id: 'sub-1', clientName: 'João', tenantId: 'tenant-1' }
    mockPrisma.telecomSubscription.findFirst.mockResolvedValue(sub)

    const res = await app.inject({ method: 'GET', url: '/v1/telecom/sub-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('sub-1')
  })

  it('GET /:id — should return 404 for non-existent subscription', async () => {
    mockPrisma.telecomSubscription.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/telecom/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Subscrição não encontrada')
  })

  it('POST / — should create a subscription (201)', async () => {
    const created = { id: 'sub-2', clientName: 'Maria', planName: 'Net 50Mbps', tenantId: 'tenant-1' }
    mockPrisma.telecomSubscription.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/telecom',
      payload: {
        clientName: 'Maria',
        planName: 'Net 50Mbps',
        planType: 'INTERNET',
        monthlyValue: 15000,
        startDate: '2026-04-01T00:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Subscrição criada com sucesso')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/telecom',
      payload: { clientName: 'Maria' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('POST / — should return 400 when tenantId is missing', async () => {
    const appNoTenant = buildApp(noTenantUser)
    await appNoTenant.register(telecomRoutes, { prefix: '/v1/telecom' })
    await appNoTenant.ready()

    const res = await appNoTenant.inject({
      method: 'POST',
      url: '/v1/telecom',
      payload: {
        clientName: 'X', planName: 'P', planType: 'MOBILE',
        monthlyValue: 5000, startDate: '2026-04-01T00:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Tenant não definido')
    await appNoTenant.close()
  })

  it('PATCH /:id — should update subscription fields (200)', async () => {
    const existing = { id: 'sub-1', tenantId: 'tenant-1', clientName: 'João' }
    const updated = { ...existing, clientName: 'João Updated' }
    mockPrisma.telecomSubscription.findFirst.mockResolvedValue(existing)
    mockPrisma.telecomSubscription.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/telecom/sub-1',
      payload: { clientName: 'João Updated' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.clientName).toBe('João Updated')
    expect(res.json().message).toBe('Subscrição atualizada com sucesso')
  })

  it('PATCH /:id — should return 404 for non-existent subscription', async () => {
    mockPrisma.telecomSubscription.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/telecom/nonexistent',
      payload: { clientName: 'Test' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Subscrição não encontrada')
  })

  it('PATCH /:id/status — should update subscription status (200)', async () => {
    const existing = { id: 'sub-1', tenantId: 'tenant-1', status: 'ACTIVE' }
    const updated = { ...existing, status: 'SUSPENDED' }
    mockPrisma.telecomSubscription.findFirst.mockResolvedValue(existing)
    mockPrisma.telecomSubscription.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/telecom/sub-1/status',
      payload: { status: 'SUSPENDED' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('SUSPENDED')
  })

  it('PATCH /:id/status — should return 404 for non-existent subscription', async () => {
    mockPrisma.telecomSubscription.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/telecom/nonexistent/status',
      payload: { status: 'CANCELLED' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Subscrição não encontrada')
  })

  it('GET /expiring — should return expiring subscriptions (200)', async () => {
    const expiring = [{ id: 'sub-3', status: 'ACTIVE', endDate: new Date() }]
    mockPrisma.telecomSubscription.findMany.mockResolvedValue(expiring)

    const res = await app.inject({ method: 'GET', url: '/v1/telecom/expiring' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('GET / — tenant isolation: uses tenantId in query', async () => {
    mockPrisma.telecomSubscription.findMany.mockResolvedValue([])
    mockPrisma.telecomSubscription.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/telecom' })

    expect(mockPrisma.telecomSubscription.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      })
    )
  })
})

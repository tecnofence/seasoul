import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import manufacturingRoutes from '../index.js'

const mockPrisma = {
  productionOrder: {
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

describe('Manufacturing API — /v1/manufacturing', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(manufacturingRoutes, { prefix: '/v1/manufacturing' })
    await app.ready()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('GET / — should list production orders with pagination (200)', async () => {
    const orders = [{ id: 'order-1', productName: 'Widget', status: 'PLANNED' }]
    mockPrisma.productionOrder.findMany.mockResolvedValue(orders)
    mockPrisma.productionOrder.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/manufacturing?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET / — should filter by status', async () => {
    mockPrisma.productionOrder.findMany.mockResolvedValue([])
    mockPrisma.productionOrder.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/manufacturing?status=IN_PROGRESS' })

    expect(mockPrisma.productionOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'IN_PROGRESS', tenantId: 'tenant-1' }),
      })
    )
  })

  it('GET /:id — should return a production order by ID (200)', async () => {
    const order = { id: 'order-1', productName: 'Widget', tenantId: 'tenant-1' }
    mockPrisma.productionOrder.findFirst.mockResolvedValue(order)

    const res = await app.inject({ method: 'GET', url: '/v1/manufacturing/order-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('order-1')
  })

  it('GET /:id — should return 404 for non-existent order', async () => {
    mockPrisma.productionOrder.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/manufacturing/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Ordem de produção não encontrada')
  })

  it('POST / — should create a production order (201)', async () => {
    const created = { id: 'order-2', productName: 'Gadget', tenantId: 'tenant-1' }
    mockPrisma.productionOrder.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/manufacturing',
      payload: { productName: 'Gadget', quantity: 100, unit: 'pcs' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.productName).toBe('Gadget')
    expect(res.json().message).toBe('Ordem de produção criada com sucesso')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/manufacturing',
      payload: { quantity: 100 },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('POST / — should return 400 when tenantId is missing', async () => {
    const appNoTenant = buildApp(noTenantUser)
    await appNoTenant.register(manufacturingRoutes, { prefix: '/v1/manufacturing' })
    await appNoTenant.ready()

    const res = await appNoTenant.inject({
      method: 'POST',
      url: '/v1/manufacturing',
      payload: { productName: 'X', quantity: 10, unit: 'pcs' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Tenant não definido')
    await appNoTenant.close()
  })

  it('PATCH /:id/status — should update production order status (200)', async () => {
    const existing = { id: 'order-1', tenantId: 'tenant-1', status: 'PLANNED' }
    const updated = { ...existing, status: 'IN_PROGRESS' }
    mockPrisma.productionOrder.findFirst.mockResolvedValue(existing)
    mockPrisma.productionOrder.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/manufacturing/order-1/status',
      payload: { status: 'IN_PROGRESS' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('IN_PROGRESS')
  })

  it('PATCH /:id/status — should return 404 for non-existent order', async () => {
    mockPrisma.productionOrder.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/manufacturing/nonexistent/status',
      payload: { status: 'COMPLETED' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Ordem de produção não encontrada')
  })

  it('PATCH /:id/status — should return 400 for invalid status', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/manufacturing/order-1/status',
      payload: { status: 'INVALID_STATUS' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Estado inválido')
  })

  it('GET / — tenant isolation: uses tenantId in query', async () => {
    mockPrisma.productionOrder.findMany.mockResolvedValue([])
    mockPrisma.productionOrder.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/manufacturing' })

    expect(mockPrisma.productionOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      })
    )
  })

  it('PATCH /:id/status — should set completedAt when COMPLETED', async () => {
    const existing = { id: 'order-1', tenantId: 'tenant-1', status: 'IN_PROGRESS' }
    const updated = { ...existing, status: 'COMPLETED', completedAt: new Date() }
    mockPrisma.productionOrder.findFirst.mockResolvedValue(existing)
    mockPrisma.productionOrder.update.mockResolvedValue(updated)

    await app.inject({
      method: 'PATCH',
      url: '/v1/manufacturing/order-1/status',
      payload: { status: 'COMPLETED', actualQuantity: 95 },
    })

    expect(mockPrisma.productionOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'COMPLETED', completedAt: expect.any(Date) }),
      })
    )
  })
})

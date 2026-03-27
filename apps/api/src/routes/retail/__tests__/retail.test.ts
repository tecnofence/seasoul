import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import retailRoutes from '../index.js'

const mockPrisma = {
  retailStore: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  retailSale: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Retail API — /v1/retail', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(retailRoutes, { prefix: '/v1/retail' })
    await app.ready()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  // ── STORES ──

  it('GET /stores — should list stores with pagination (200)', async () => {
    const stores = [{ id: 'store-1', name: 'Loja Cabo Ledo', status: 'ACTIVE' }]
    mockPrisma.retailStore.findMany.mockResolvedValue(stores)
    mockPrisma.retailStore.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/retail/stores?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET /stores/:id — should return a store by ID (200)', async () => {
    const store = { id: 'store-1', name: 'Loja Cabo Ledo', tenantId: 'tenant-1', _count: { sales: 10 } }
    mockPrisma.retailStore.findFirst.mockResolvedValue(store)

    const res = await app.inject({ method: 'GET', url: '/v1/retail/stores/store-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('store-1')
  })

  it('GET /stores/:id — should return 404 for non-existent store', async () => {
    mockPrisma.retailStore.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/retail/stores/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Loja não encontrada')
  })

  it('POST /stores — should create a store (201)', async () => {
    const created = { id: 'store-2', name: 'Loja Sangano', tenantId: 'tenant-1' }
    mockPrisma.retailStore.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/retail/stores',
      payload: { name: 'Loja Sangano' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Loja criada com sucesso')
  })

  it('POST /stores — should return 400 for missing name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/retail/stores',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('POST /stores — should return 400 when tenantId is missing', async () => {
    const appNoTenant = buildApp(noTenantUser)
    await appNoTenant.register(retailRoutes, { prefix: '/v1/retail' })
    await appNoTenant.ready()

    const res = await appNoTenant.inject({
      method: 'POST',
      url: '/v1/retail/stores',
      payload: { name: 'Test Store' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Utilizador sem tenant associado')
    await appNoTenant.close()
  })

  it('PATCH /stores/:id — should update a store (200)', async () => {
    const existing = { id: 'store-1', tenantId: 'tenant-1', name: 'Old Name' }
    const updated = { ...existing, name: 'New Name' }
    mockPrisma.retailStore.findFirst.mockResolvedValue(existing)
    mockPrisma.retailStore.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/retail/stores/store-1',
      payload: { name: 'New Name' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.name).toBe('New Name')
  })

  it('PATCH /stores/:id — should return 404 for non-existent store', async () => {
    mockPrisma.retailStore.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/retail/stores/nonexistent',
      payload: { name: 'Test' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Loja não encontrada')
  })

  // ── SALES ──

  it('GET /sales — should list sales with pagination (200)', async () => {
    const sales = [{ id: 'sale-1', storeId: 'store-1', totalAmount: 50000 }]
    mockPrisma.retailSale.findMany.mockResolvedValue(sales)
    mockPrisma.retailSale.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/retail/sales?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('GET /sales/:id — should return a sale by ID (200)', async () => {
    const sale = { id: 'sale-1', tenantId: 'tenant-1', store: { id: 'store-1', name: 'Loja' } }
    mockPrisma.retailSale.findFirst.mockResolvedValue(sale)

    const res = await app.inject({ method: 'GET', url: '/v1/retail/sales/sale-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('sale-1')
  })

  it('GET /sales/:id — should return 404 for non-existent sale', async () => {
    mockPrisma.retailSale.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/retail/sales/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Venda não encontrada')
  })

  it('POST /sales — should create a sale with calculated totals (201)', async () => {
    const store = { id: 'store-1', tenantId: 'tenant-1' }
    const sale = { id: 'sale-1', storeId: 'store-1', totalAmount: 11400, store: { id: 'store-1', name: 'Loja' } }
    mockPrisma.retailStore.findFirst.mockResolvedValue(store)
    mockPrisma.retailSale.create.mockResolvedValue(sale)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/retail/sales',
      payload: {
        storeId: 'store-1',
        items: [{ name: 'Produto A', quantity: 2, unitPrice: 5000 }],
        paymentMethod: 'CASH',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Venda registada com sucesso')
  })

  it('POST /sales — should return 404 when store does not belong to tenant', async () => {
    mockPrisma.retailStore.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/retail/sales',
      payload: {
        storeId: 'store-other',
        items: [{ name: 'P', quantity: 1, unitPrice: 1000 }],
        paymentMethod: 'CARD',
      },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Loja não encontrada neste tenant')
  })

  // ── SUMMARY ──

  it('GET /summary — should return sales summary (200)', async () => {
    mockPrisma.retailSale.aggregate.mockResolvedValue({
      _sum: { totalAmount: 500000 },
      _avg: { totalAmount: 25000 },
    })
    mockPrisma.retailSale.count.mockResolvedValue(20)

    const res = await app.inject({ method: 'GET', url: '/v1/retail/summary' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.totalSales).toBe(20)
  })

  it('GET /stores — tenant isolation: uses tenantId in query', async () => {
    mockPrisma.retailStore.findMany.mockResolvedValue([])
    mockPrisma.retailStore.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/retail/stores' })

    expect(mockPrisma.retailStore.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      })
    )
  })
})

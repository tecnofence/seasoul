import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import productsRoutes from '../index.js'

const mockPrisma = {
  product: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

const superAdminUser = {
  id: 'user-1',
  email: 'admin@engeris.ao',
  role: 'SUPER_ADMIN',
  tenantId: 'tenant-1',
  type: 'staff' as const,
}

const regularUser = {
  id: 'user-2',
  email: 'staff@engeris.ao',
  role: 'STAFF',
  tenantId: 'tenant-1',
  type: 'staff' as const,
}

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Products API — /v1/products', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(productsRoutes, { prefix: '/v1/products' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List products ──

  it('GET / — should list products with pagination (200)', async () => {
    const products = [
      { id: 'p1', name: 'Cerveja Cuca', category: 'BEBIDAS', department: 'BAR', unitPrice: 500, active: true },
      { id: 'p2', name: 'Água Mineral', category: 'BEBIDAS', department: 'BAR', unitPrice: 200, active: true },
    ]
    mockPrisma.product.findMany.mockResolvedValue(products)
    mockPrisma.product.count.mockResolvedValue(2)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/products',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body.total).toBe(2)
    expect(body.totalPages).toBeDefined()
  })

  it('GET / — should support search parameter', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/products?search=cerveja',
    })

    expect(res.statusCode).toBe(200)
  })

  it('GET / — should filter by category and department', async () => {
    mockPrisma.product.findMany.mockResolvedValue([])
    mockPrisma.product.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/products?category=BEBIDAS&department=BAR',
    })

    expect(res.statusCode).toBe(200)
  })

  // ── GET /categories ──

  it('GET /categories — should return distinct categories (200)', async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      { category: 'BEBIDAS' },
      { category: 'COMIDA' },
    ])

    const res = await app.inject({
      method: 'GET',
      url: '/v1/products/categories',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toEqual(['BEBIDAS', 'COMIDA'])
  })

  // ── GET /:id — Get product by ID ──

  it('GET /:id — should return product (200)', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Cerveja Cuca',
      category: 'BEBIDAS',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/v1/products/p1',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('p1')
  })

  it('GET /:id — should return 404 when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/products/nonexistent',
    })

    expect(res.statusCode).toBe(404)
  })

  // ── POST / — Create product ──

  it('POST / — should create a product (201)', async () => {
    mockPrisma.product.create.mockResolvedValue({
      id: 'p-new',
      name: 'Sumo de Laranja',
      category: 'BEBIDAS',
      department: 'BAR',
      unitPrice: 350,
      taxRate: 14,
      active: true,
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/products',
      payload: {
        name: 'Sumo de Laranja',
        category: 'BEBIDAS',
        department: 'BAR',
        unitPrice: 350,
        taxRate: 14,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.name).toBe('Sumo de Laranja')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/products',
      payload: { name: 'Incomplete' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 403 for non-authorized role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(productsRoutes, { prefix: '/v1/products' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/products',
      payload: {
        name: 'Sumo de Laranja',
        category: 'BEBIDAS',
        department: 'BAR',
        unitPrice: 350,
        taxRate: 14,
      },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  // ── PUT /:id — Update product ──

  it('PUT /:id — should update a product (200)', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'p1',
      name: 'Cerveja Cuca',
      category: 'BEBIDAS',
    })
    mockPrisma.product.update.mockResolvedValue({
      id: 'p1',
      name: 'Cerveja Cuca Grande',
      category: 'BEBIDAS',
    })

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/products/p1',
      payload: { name: 'Cerveja Cuca Grande' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.name).toBe('Cerveja Cuca Grande')
  })

  it('PUT /:id — should return 404 when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/products/nonexistent',
      payload: { name: 'Updated' },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── DELETE /:id — Deactivate product ──

  it('DELETE /:id — should deactivate a product (200)', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ id: 'p1', active: true })
    mockPrisma.product.update.mockResolvedValue({ id: 'p1', active: false })

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/products/p1',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Produto desativado')
  })

  it('DELETE /:id — should return 404 when product not found', async () => {
    mockPrisma.product.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/products/nonexistent',
    })

    expect(res.statusCode).toBe(404)
  })

  it('DELETE /:id — should return 403 for non-admin role', async () => {
    const stockApp = buildApp({
      id: 'user-3',
      email: 'stock@engeris.ao',
      role: 'STOCK_MANAGER',
      tenantId: 'tenant-1',
      type: 'staff' as const,
    })
    await stockApp.register(productsRoutes, { prefix: '/v1/products' })
    await stockApp.ready()

    const res = await stockApp.inject({
      method: 'DELETE',
      url: '/v1/products/p1',
    })

    // STOCK_MANAGER can create/update but NOT delete (only SUPER_ADMIN, RESORT_MANAGER)
    expect(res.statusCode).toBe(403)
    await stockApp.close()
  })
})

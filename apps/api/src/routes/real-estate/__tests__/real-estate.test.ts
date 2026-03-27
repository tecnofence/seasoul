import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import realEstateRoutes from '../index.js'

const mockPrisma = {
  property: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
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

const noTenantUser = {
  id: 'user-3',
  email: 'orphan@engeris.ao',
  role: 'STAFF',
  tenantId: undefined,
  type: 'staff' as const,
}

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Real Estate API — /v1/real-estate', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(realEstateRoutes, { prefix: '/v1/real-estate' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /v1/real-estate — should list properties with pagination', async () => {
    const mockProps = [{ id: 'prop-1', title: 'Apartamento T3 Luanda', status: 'AVAILABLE' }]
    mockPrisma.property.findMany.mockResolvedValue(mockProps)
    mockPrisma.property.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/real-estate?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET /v1/real-estate — should filter by propertyType and status', async () => {
    mockPrisma.property.findMany.mockResolvedValue([])
    mockPrisma.property.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/real-estate?propertyType=APARTMENT&status=AVAILABLE',
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          propertyType: 'APARTMENT',
          status: 'AVAILABLE',
        }),
      }),
    )
  })

  it('GET /v1/real-estate — should enforce tenant isolation', async () => {
    mockPrisma.property.findMany.mockResolvedValue([])
    mockPrisma.property.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/real-estate' })

    expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
    )
  })

  it('GET /v1/real-estate/:id — should return property by ID (200)', async () => {
    const mockProp = { id: 'prop-1', title: 'Villa Sangano', tenantId: 'tenant-1' }
    mockPrisma.property.findFirst.mockResolvedValue(mockProp)

    const res = await app.inject({ method: 'GET', url: '/v1/real-estate/prop-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('prop-1')
  })

  it('GET /v1/real-estate/:id — should return 404 for non-existent property', async () => {
    mockPrisma.property.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/real-estate/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  it('POST /v1/real-estate — should create a property (201)', async () => {
    const mockProp = { id: 'prop-1', title: 'Terreno Cabo Ledo', propertyType: 'LAND' }
    mockPrisma.property.create.mockResolvedValue(mockProp)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/real-estate',
      payload: {
        title: 'Terreno Cabo Ledo',
        propertyType: 'LAND',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toEqual(mockProp)
  })

  it('POST /v1/real-estate — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/real-estate',
      payload: { description: 'No title or type' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBeDefined()
  })

  it('POST /v1/real-estate — should return 400 when user has no tenant', async () => {
    const noTenantApp = buildApp(noTenantUser)
    await noTenantApp.register(realEstateRoutes, { prefix: '/v1/real-estate' })
    await noTenantApp.ready()

    const res = await noTenantApp.inject({
      method: 'POST',
      url: '/v1/real-estate',
      payload: {
        title: 'Teste',
        propertyType: 'HOUSE',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('tenant')
    await noTenantApp.close()
  })

  it('PATCH /v1/real-estate/:id — should update a property', async () => {
    const existing = { id: 'prop-1', title: 'Old Title', tenantId: 'tenant-1' }
    const updated = { ...existing, title: 'New Title' }
    mockPrisma.property.findFirst.mockResolvedValue(existing)
    mockPrisma.property.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/real-estate/prop-1',
      payload: { title: 'New Title' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.title).toBe('New Title')
  })

  it('PATCH /v1/real-estate/:id — should return 404 for non-existent property', async () => {
    mockPrisma.property.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/real-estate/non-existent',
      payload: { title: 'Nope' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /v1/real-estate/:id/status — should update property status', async () => {
    const existing = { id: 'prop-1', status: 'AVAILABLE', tenantId: 'tenant-1' }
    const updated = { ...existing, status: 'SOLD' }
    mockPrisma.property.findFirst.mockResolvedValue(existing)
    mockPrisma.property.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/real-estate/prop-1/status',
      payload: { status: 'SOLD' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('SOLD')
  })

  it('PATCH /v1/real-estate/:id/status — should return 404 for non-existent property', async () => {
    mockPrisma.property.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/real-estate/non-existent/status',
      payload: { status: 'RENTED' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /v1/real-estate/:id/status — should return 400 for invalid status', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/real-estate/prop-1/status',
      payload: { status: 'BOGUS' },
    })

    expect(res.statusCode).toBe(400)
  })
})

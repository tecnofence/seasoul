import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import logisticsRoutes from '../index.js'

const mockPrisma = {
  shipment: {
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

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Logistics API — /v1/logistics', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(logisticsRoutes, { prefix: '/v1/logistics' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /v1/logistics — should list shipments with pagination', async () => {
    const mockShipments = [{ id: 'shp-1', origin: 'Luanda', destination: 'Benguela' }]
    mockPrisma.shipment.findMany.mockResolvedValue(mockShipments)
    mockPrisma.shipment.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/logistics?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET /v1/logistics — should filter by status and shipmentType', async () => {
    mockPrisma.shipment.findMany.mockResolvedValue([])
    mockPrisma.shipment.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/logistics?status=IN_TRANSIT&shipmentType=CONTAINER',
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'IN_TRANSIT',
          shipmentType: 'CONTAINER',
        }),
      }),
    )
  })

  it('GET /v1/logistics — should enforce tenant isolation', async () => {
    mockPrisma.shipment.findMany.mockResolvedValue([])
    mockPrisma.shipment.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/logistics' })

    expect(mockPrisma.shipment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
    )
  })

  it('GET /v1/logistics/:id — should return shipment by ID (200)', async () => {
    const mockShipment = { id: 'shp-1', origin: 'Luanda', tenantId: 'tenant-1' }
    mockPrisma.shipment.findFirst.mockResolvedValue(mockShipment)

    const res = await app.inject({ method: 'GET', url: '/v1/logistics/shp-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('shp-1')
  })

  it('GET /v1/logistics/:id — should return 404 for non-existent shipment', async () => {
    mockPrisma.shipment.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/logistics/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  it('POST /v1/logistics — should create a shipment (201)', async () => {
    const mockShipment = { id: 'shp-1', origin: 'Luanda', destination: 'Huambo', shipmentType: 'PACKAGE' }
    mockPrisma.shipment.create.mockResolvedValue(mockShipment)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/logistics',
      payload: {
        origin: 'Luanda',
        destination: 'Huambo',
        shipmentType: 'PACKAGE',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toEqual(mockShipment)
  })

  it('POST /v1/logistics — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/logistics',
      payload: { notes: 'Incomplete' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBeDefined()
  })

  it('POST /v1/logistics — should return 400 when user has no tenant', async () => {
    const noTenantApp = buildApp(noTenantUser)
    await noTenantApp.register(logisticsRoutes, { prefix: '/v1/logistics' })
    await noTenantApp.ready()

    const res = await noTenantApp.inject({
      method: 'POST',
      url: '/v1/logistics',
      payload: {
        origin: 'Luanda',
        destination: 'Namibe',
        shipmentType: 'PALLET',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('tenant')
    await noTenantApp.close()
  })

  it('PATCH /v1/logistics/:id/status — should update shipment status', async () => {
    const existing = { id: 'shp-1', status: 'PENDING', tenantId: 'tenant-1' }
    const updated = { ...existing, status: 'IN_TRANSIT' }
    mockPrisma.shipment.findFirst.mockResolvedValue(existing)
    mockPrisma.shipment.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/logistics/shp-1/status',
      payload: { status: 'IN_TRANSIT' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('IN_TRANSIT')
  })

  it('PATCH /v1/logistics/:id/status — should set deliveredAt when status is DELIVERED', async () => {
    const existing = { id: 'shp-1', status: 'IN_TRANSIT', tenantId: 'tenant-1' }
    const updated = { ...existing, status: 'DELIVERED', deliveredAt: new Date() }
    mockPrisma.shipment.findFirst.mockResolvedValue(existing)
    mockPrisma.shipment.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/logistics/shp-1/status',
      payload: { status: 'DELIVERED' },
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.shipment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'DELIVERED',
          deliveredAt: expect.any(Date),
        }),
      }),
    )
  })

  it('PATCH /v1/logistics/:id/status — should return 404 for non-existent shipment', async () => {
    mockPrisma.shipment.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/logistics/non-existent/status',
      payload: { status: 'CANCELLED' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('GET /v1/logistics/tracking/:code — should find shipment by tracking code', async () => {
    const mockShipment = { id: 'shp-1', trackingCode: 'TR-001', tenantId: 'tenant-1' }
    mockPrisma.shipment.findFirst.mockResolvedValue(mockShipment)

    const res = await app.inject({ method: 'GET', url: '/v1/logistics/tracking/TR-001' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.trackingCode).toBe('TR-001')
  })

  it('GET /v1/logistics/tracking/:code — should return 404 for unknown tracking code', async () => {
    mockPrisma.shipment.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/logistics/tracking/UNKNOWN' })

    expect(res.statusCode).toBe(404)
  })
})

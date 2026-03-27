import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import spaRoutes from '../index.js'

const mockPrisma = {
  spaService: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  spaBooking: {
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

describe('Spa API — /v1/spa', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(spaRoutes, { prefix: '/v1/spa' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Services ──

  it('GET /v1/spa/services — should list services with pagination', async () => {
    const mockServices = [{ id: 'svc-1', name: 'Massagem Relaxante', category: 'MASSAGE' }]
    mockPrisma.spaService.findMany.mockResolvedValue(mockServices)
    mockPrisma.spaService.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/spa/services?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET /v1/spa/services — should filter by category', async () => {
    mockPrisma.spaService.findMany.mockResolvedValue([])
    mockPrisma.spaService.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/spa/services?category=FACIAL' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.spaService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ category: 'FACIAL' }),
      }),
    )
  })

  it('POST /v1/spa/services — should create a service (201)', async () => {
    const mockService = { id: 'svc-1', name: 'Facial Premium', category: 'FACIAL', duration: 60 }
    mockPrisma.spaService.create.mockResolvedValue(mockService)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/spa/services',
      payload: {
        name: 'Facial Premium',
        category: 'FACIAL',
        duration: 60,
        price: 15000,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toEqual(mockService)
  })

  it('POST /v1/spa/services — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/spa/services',
      payload: { name: 'Incompleto' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBeDefined()
  })

  it('POST /v1/spa/services — should return 400 when user has no tenant', async () => {
    const noTenantApp = buildApp(noTenantUser)
    await noTenantApp.register(spaRoutes, { prefix: '/v1/spa' })
    await noTenantApp.ready()

    const res = await noTenantApp.inject({
      method: 'POST',
      url: '/v1/spa/services',
      payload: {
        name: 'Teste',
        category: 'MASSAGE',
        duration: 30,
        price: 5000,
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('tenant')
    await noTenantApp.close()
  })

  it('PATCH /v1/spa/services/:id — should update a service', async () => {
    const existing = { id: 'svc-1', name: 'Old Name', tenantId: 'tenant-1' }
    const updated = { ...existing, name: 'New Name' }
    mockPrisma.spaService.findFirst.mockResolvedValue(existing)
    mockPrisma.spaService.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/spa/services/svc-1',
      payload: { name: 'New Name' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.name).toBe('New Name')
  })

  it('PATCH /v1/spa/services/:id — should return 404 for non-existent service', async () => {
    mockPrisma.spaService.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/spa/services/non-existent',
      payload: { name: 'Nope' },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── Bookings ──

  it('GET /v1/spa/bookings — should list bookings with pagination', async () => {
    const mockBookings = [{ id: 'bk-1', clientName: 'João', status: 'SCHEDULED' }]
    mockPrisma.spaBooking.findMany.mockResolvedValue(mockBookings)
    mockPrisma.spaBooking.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/spa/bookings' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('POST /v1/spa/bookings — should create a booking (201)', async () => {
    const mockService = { id: 'svc-1', name: 'Massage', tenantId: 'tenant-1' }
    const mockBooking = { id: 'bk-1', clientName: 'Maria', serviceId: 'svc-1' }
    mockPrisma.spaService.findFirst.mockResolvedValue(mockService)
    mockPrisma.spaBooking.create.mockResolvedValue(mockBooking)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/spa/bookings',
      payload: {
        serviceId: 'svc-1',
        clientName: 'Maria',
        date: '2026-04-01T10:00:00.000Z',
        totalPrice: 15000,
      },
    })

    expect(res.statusCode).toBe(201)
  })

  it('POST /v1/spa/bookings — should return 404 when service not found in tenant', async () => {
    mockPrisma.spaService.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/spa/bookings',
      payload: {
        serviceId: 'svc-unknown',
        clientName: 'Pedro',
        date: '2026-04-01T10:00:00.000Z',
        totalPrice: 10000,
      },
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /v1/spa/bookings/:id/status — should update booking status', async () => {
    const existing = { id: 'bk-1', status: 'SCHEDULED', tenantId: 'tenant-1' }
    const updated = { ...existing, status: 'COMPLETED' }
    mockPrisma.spaBooking.findFirst.mockResolvedValue(existing)
    mockPrisma.spaBooking.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/spa/bookings/bk-1/status',
      payload: { status: 'COMPLETED' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('COMPLETED')
  })

  it('PATCH /v1/spa/bookings/:id/status — should return 404 for non-existent booking', async () => {
    mockPrisma.spaBooking.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/spa/bookings/non-existent/status',
      payload: { status: 'CANCELLED' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('GET /v1/spa/services — should enforce tenant isolation via where clause', async () => {
    mockPrisma.spaService.findMany.mockResolvedValue([])
    mockPrisma.spaService.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/spa/services' })

    expect(mockPrisma.spaService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
    )
  })
})

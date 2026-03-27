import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import activitiesRoutes from '../index.js'

const mockPrisma = {
  activity: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  activityBooking: {
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

describe('Activities API — /v1/activities', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(activitiesRoutes, { prefix: '/v1/activities' })
    await app.ready()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  // ── ACTIVITIES ──

  it('GET / — should list activities with pagination (200)', async () => {
    const activities = [{ id: 'act-1', name: 'Surf', category: 'WATER_SPORTS' }]
    mockPrisma.activity.findMany.mockResolvedValue(activities)
    mockPrisma.activity.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/activities?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET / — should filter by status and category', async () => {
    mockPrisma.activity.findMany.mockResolvedValue([])
    mockPrisma.activity.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/activities?status=ACTIVE&category=WELLNESS' })

    expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE', category: 'WELLNESS' }),
      })
    )
  })

  it('GET /:id — should return an activity by ID (200)', async () => {
    const activity = { id: 'act-1', name: 'Surf', tenantId: 'tenant-1', _count: { bookings: 5 } }
    mockPrisma.activity.findFirst.mockResolvedValue(activity)

    const res = await app.inject({ method: 'GET', url: '/v1/activities/act-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('act-1')
  })

  it('GET /:id — should return 404 for non-existent activity', async () => {
    mockPrisma.activity.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/activities/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Atividade não encontrada')
  })

  it('POST / — should create an activity (201)', async () => {
    const created = { id: 'act-2', name: 'Yoga', tenantId: 'tenant-1' }
    mockPrisma.activity.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/activities',
      payload: { name: 'Yoga', category: 'WELLNESS', price: 5000 },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Atividade criada com sucesso')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/activities',
      payload: { name: 'Yoga' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('POST / — should return 400 when tenantId is missing', async () => {
    const appNoTenant = buildApp(noTenantUser)
    await appNoTenant.register(activitiesRoutes, { prefix: '/v1/activities' })
    await appNoTenant.ready()

    const res = await appNoTenant.inject({
      method: 'POST',
      url: '/v1/activities',
      payload: { name: 'Test', category: 'OTHER', price: 1000 },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Utilizador sem tenant associado')
    await appNoTenant.close()
  })

  it('PATCH /:id — should update an activity (200)', async () => {
    const existing = { id: 'act-1', tenantId: 'tenant-1', name: 'Surf' }
    const updated = { ...existing, name: 'Surf Avançado' }
    mockPrisma.activity.findFirst.mockResolvedValue(existing)
    mockPrisma.activity.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/activities/act-1',
      payload: { name: 'Surf Avançado' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.name).toBe('Surf Avançado')
  })

  it('PATCH /:id — should return 404 for non-existent activity', async () => {
    mockPrisma.activity.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/activities/nonexistent',
      payload: { name: 'Test' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Atividade não encontrada')
  })

  // ── BOOKINGS ──

  it('GET /bookings — should list activity bookings with pagination (200)', async () => {
    const bookings = [{ id: 'book-1', guestName: 'João', activityId: 'act-1' }]
    mockPrisma.activityBooking.findMany.mockResolvedValue(bookings)
    mockPrisma.activityBooking.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/activities/bookings?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('POST /bookings — should create a booking (201)', async () => {
    const activity = { id: 'act-1', tenantId: 'tenant-1', price: { times: vi.fn().mockReturnValue({ toDecimalPlaces: vi.fn().mockReturnValue(5000) }) } }
    const booking = { id: 'book-1', activityId: 'act-1', guestName: 'João', activity: { id: 'act-1', name: 'Surf' } }
    mockPrisma.activity.findFirst.mockResolvedValue(activity)
    mockPrisma.activityBooking.create.mockResolvedValue(booking)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/activities/bookings',
      payload: {
        activityId: 'act-1',
        guestName: 'João',
        date: '2026-04-01T10:00:00.000Z',
        participants: 1,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Reserva de atividade criada com sucesso')
  })

  it('POST /bookings — should return 404 when activity does not belong to tenant', async () => {
    mockPrisma.activity.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/activities/bookings',
      payload: {
        activityId: 'act-other',
        guestName: 'João',
        date: '2026-04-01T10:00:00.000Z',
        participants: 1,
      },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Atividade não encontrada neste tenant')
  })

  it('PATCH /bookings/:id/status — should update booking status (200)', async () => {
    const existing = { id: 'book-1', tenantId: 'tenant-1', status: 'PENDING' }
    const updated = { ...existing, status: 'CONFIRMED', activity: { id: 'act-1', name: 'Surf' } }
    mockPrisma.activityBooking.findFirst.mockResolvedValue(existing)
    mockPrisma.activityBooking.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/activities/bookings/book-1/status',
      payload: { status: 'CONFIRMED' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('CONFIRMED')
  })

  it('PATCH /bookings/:id/status — should return 404 for non-existent booking', async () => {
    mockPrisma.activityBooking.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/activities/bookings/nonexistent/status',
      payload: { status: 'CANCELLED' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Reserva não encontrada')
  })

  it('GET / — tenant isolation: uses tenantId in query', async () => {
    mockPrisma.activity.findMany.mockResolvedValue([])
    mockPrisma.activity.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/activities' })

    expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      })
    )
  })
})

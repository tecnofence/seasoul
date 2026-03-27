import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import eventRoutes from '../index.js'

const mockPrisma = {
  event: {
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

describe('Events API — /v1/events', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(eventRoutes, { prefix: '/v1/events' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /v1/events — should list events with pagination', async () => {
    const mockEvents = [{ id: 'evt-1', title: 'Conferência Angular', status: 'PLANNED' }]
    mockPrisma.event.findMany.mockResolvedValue(mockEvents)
    mockPrisma.event.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/events?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET /v1/events — should filter by status', async () => {
    mockPrisma.event.findMany.mockResolvedValue([])
    mockPrisma.event.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/events?status=CONFIRMED' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'CONFIRMED' }),
      }),
    )
  })

  it('GET /v1/events — should enforce tenant isolation', async () => {
    mockPrisma.event.findMany.mockResolvedValue([])
    mockPrisma.event.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/events' })

    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
    )
  })

  it('GET /v1/events/:id — should return event by ID (200)', async () => {
    const mockEvent = { id: 'evt-1', title: 'Casamento', tenantId: 'tenant-1' }
    mockPrisma.event.findFirst.mockResolvedValue(mockEvent)

    const res = await app.inject({ method: 'GET', url: '/v1/events/evt-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('evt-1')
  })

  it('GET /v1/events/:id — should return 404 for non-existent event', async () => {
    mockPrisma.event.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/events/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  it('POST /v1/events — should create an event (201)', async () => {
    const mockEvent = { id: 'evt-1', title: 'Workshop React', eventType: 'WORKSHOP' }
    mockPrisma.event.create.mockResolvedValue(mockEvent)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/events',
      payload: {
        title: 'Workshop React',
        eventType: 'WORKSHOP',
        startDate: '2026-05-01T09:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toEqual(mockEvent)
  })

  it('POST /v1/events — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/events',
      payload: { description: 'Missing title and type' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBeDefined()
  })

  it('POST /v1/events — should return 400 when user has no tenant', async () => {
    const noTenantApp = buildApp(noTenantUser)
    await noTenantApp.register(eventRoutes, { prefix: '/v1/events' })
    await noTenantApp.ready()

    const res = await noTenantApp.inject({
      method: 'POST',
      url: '/v1/events',
      payload: {
        title: 'Teste',
        eventType: 'MEETING',
        startDate: '2026-05-01T09:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('tenant')
    await noTenantApp.close()
  })

  it('PATCH /v1/events/:id — should update an event', async () => {
    const existing = { id: 'evt-1', title: 'Old Title', tenantId: 'tenant-1' }
    const updated = { ...existing, title: 'New Title' }
    mockPrisma.event.findFirst.mockResolvedValue(existing)
    mockPrisma.event.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/events/evt-1',
      payload: { title: 'New Title' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.title).toBe('New Title')
  })

  it('PATCH /v1/events/:id — should return 404 for non-existent event', async () => {
    mockPrisma.event.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/events/non-existent',
      payload: { title: 'Nope' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /v1/events/:id/status — should update event status', async () => {
    const existing = { id: 'evt-1', status: 'PLANNED', tenantId: 'tenant-1' }
    const updated = { ...existing, status: 'CONFIRMED' }
    mockPrisma.event.findFirst.mockResolvedValue(existing)
    mockPrisma.event.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/events/evt-1/status',
      payload: { status: 'CONFIRMED' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('CONFIRMED')
  })

  it('PATCH /v1/events/:id/status — should return 404 for non-existent event', async () => {
    mockPrisma.event.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/events/non-existent/status',
      payload: { status: 'CANCELLED' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /v1/events/:id/status — should return 400 for invalid status', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/events/evt-1/status',
      payload: { status: 'INVALID_STATUS' },
    })

    expect(res.statusCode).toBe(400)
  })
})

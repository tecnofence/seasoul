import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import roomsRoutes from '../index.js'

const mockPrisma = {
  room: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  resort: {
    findUnique: vi.fn(),
  },
}

// Valid CUID for test payloads
const RESORT_CUID = 'cly1234567890abcdefghijklm'

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

describe('Rooms API — /v1/rooms', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(roomsRoutes, { prefix: '/v1/rooms' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List rooms ──

  it('GET / — should list rooms with pagination (200)', async () => {
    const rooms = [
      { id: 'r1', number: '101', type: 'STANDARD', status: 'AVAILABLE', resortId: 'resort-1', resort: { id: 'resort-1', name: 'Cabo Ledo', slug: 'cabo-ledo' } },
      { id: 'r2', number: '102', type: 'SUITE', status: 'AVAILABLE', resortId: 'resort-1', resort: { id: 'resort-1', name: 'Cabo Ledo', slug: 'cabo-ledo' } },
    ]
    mockPrisma.room.findMany.mockResolvedValue(rooms)
    mockPrisma.room.count.mockResolvedValue(2)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/rooms',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body.total).toBe(2)
    expect(body.totalPages).toBeDefined()
  })

  it('GET / — should filter by resortId', async () => {
    mockPrisma.room.findMany.mockResolvedValue([])
    mockPrisma.room.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/rooms?resortId=resort-1',
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.room.findMany).toHaveBeenCalled()
  })

  // ── GET /:id — Get room by ID ──

  it('GET /:id — should return room (200)', async () => {
    mockPrisma.room.findUnique.mockResolvedValue({
      id: 'r1',
      number: '101',
      type: 'STANDARD',
      status: 'AVAILABLE',
      resort: { id: 'resort-1', name: 'Cabo Ledo', slug: 'cabo-ledo' },
    })

    const res = await app.inject({
      method: 'GET',
      url: '/v1/rooms/r1',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('r1')
  })

  it('GET /:id — should return 404 when room not found', async () => {
    mockPrisma.room.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/rooms/nonexistent',
    })

    expect(res.statusCode).toBe(404)
  })

  // ── POST / — Create room ──

  it('POST / — should create a room (201)', async () => {
    mockPrisma.resort.findUnique.mockResolvedValue({ id: RESORT_CUID, name: 'Cabo Ledo' })
    mockPrisma.room.findUnique.mockResolvedValue(null) // no duplicate
    mockPrisma.room.create.mockResolvedValue({
      id: 'r-new',
      number: '201',
      type: 'STANDARD',
      status: 'AVAILABLE',
      resortId: RESORT_CUID,
      floor: 2,
      resort: { id: RESORT_CUID, name: 'Cabo Ledo', slug: 'cabo-ledo' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/rooms',
      payload: {
        number: '201',
        type: 'STANDARD',
        resortId: RESORT_CUID,
        floor: 2,
        capacity: 2,
        pricePerNight: 25000,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.number).toBe('201')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/rooms',
      payload: { number: '201' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 403 for non-admin role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(roomsRoutes, { prefix: '/v1/rooms' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/rooms',
      payload: {
        number: '201',
        type: 'STANDARD',
        resortId: RESORT_CUID,
        floor: 2,
        capacity: 2,
        pricePerNight: 25000,
      },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  it('POST / — should return 409 for duplicate room number in same resort', async () => {
    mockPrisma.resort.findUnique.mockResolvedValue({ id: RESORT_CUID, name: 'Cabo Ledo' })
    mockPrisma.room.findUnique.mockResolvedValue({ id: 'existing', number: '201' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/rooms',
      payload: {
        number: '201',
        type: 'STANDARD',
        resortId: RESORT_CUID,
        floor: 2,
        capacity: 2,
        pricePerNight: 25000,
      },
    })

    expect(res.statusCode).toBe(409)
  })

  // ── PUT /:id — Update room ──

  it('PUT /:id — should update a room (200)', async () => {
    mockPrisma.room.findUnique.mockResolvedValue({
      id: 'r1',
      number: '101',
      resortId: 'resort-1',
    })
    mockPrisma.room.update.mockResolvedValue({
      id: 'r1',
      number: '101',
      type: 'SUITE',
      resort: { id: 'resort-1', name: 'Cabo Ledo', slug: 'cabo-ledo' },
    })

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/rooms/r1',
      payload: { type: 'SUITE' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.type).toBe('SUITE')
  })

  it('PUT /:id — should return 404 when room not found', async () => {
    mockPrisma.room.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/rooms/nonexistent',
      payload: { type: 'SUITE' },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── PATCH /:id/status — Update room status ──

  it('PATCH /:id/status — should update room status (200)', async () => {
    mockPrisma.room.findUnique.mockResolvedValue({ id: 'r1', status: 'AVAILABLE' })
    mockPrisma.room.update.mockResolvedValue({ id: 'r1', status: 'CLEANING' })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/rooms/r1/status',
      payload: { status: 'CLEANING' },
    })

    expect(res.statusCode).toBe(200)
  })

  it('PATCH /:id/status — should return 404 when room not found', async () => {
    mockPrisma.room.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/rooms/nonexistent/status',
      payload: { status: 'CLEANING' },
    })

    expect(res.statusCode).toBe(404)
  })
})

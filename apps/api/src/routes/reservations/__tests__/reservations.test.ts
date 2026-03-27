import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import reservationsRoutes from '../index.js'

const mockPrisma = {
  reservation: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  room: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(async (fn: any) => fn(mockPrisma)),
}

// Valid CUIDs for test payloads
const RESORT_CUID = 'cly1234567890abcdefghijklm'
const ROOM_CUID = 'clz1234567890abcdefghijklm'

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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Reservations API — /v1/reservations', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(reservationsRoutes, { prefix: '/v1/reservations' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    // Re-set default $transaction mock after clearAllMocks
    mockPrisma.$transaction = vi.fn(async (fn: any) => fn(mockPrisma))
  })

  // ── GET / — List reservations ──

  it('GET / — should list reservations with pagination (200)', async () => {
    const reservations = [
      { id: 'res1', guestName: 'João', status: 'CONFIRMED', room: { id: 'r1', number: '101', type: 'STANDARD' }, resort: { id: 'resort-1', name: 'Cabo Ledo' } },
    ]
    mockPrisma.reservation.findMany.mockResolvedValue(reservations)
    mockPrisma.reservation.count.mockResolvedValue(1)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/reservations',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.totalPages).toBeDefined()
  })

  it('GET / — should filter by resortId and status', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([])
    mockPrisma.reservation.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/reservations?resortId=resort-1&status=CONFIRMED',
    })

    expect(res.statusCode).toBe(200)
  })

  // ── GET /today ──

  it('GET /today — should return today check-ins and check-outs (200)', async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([])

    const res = await app.inject({
      method: 'GET',
      url: '/v1/reservations/today',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.checkIns).toBeDefined()
    expect(body.data.checkOuts).toBeDefined()
  })

  // ── GET /:id — Get reservation by ID ──

  it('GET /:id — should return reservation (200)', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'res1',
      guestName: 'João Silva',
      status: 'CONFIRMED',
      room: { id: 'r1', number: '101', type: 'STANDARD', floor: 1 },
      resort: { id: 'resort-1', name: 'Cabo Ledo' },
      guest: null,
      sales: [],
      serviceOrders: [],
    })

    const res = await app.inject({
      method: 'GET',
      url: '/v1/reservations/res1',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('res1')
  })

  it('GET /:id — should return 404 when reservation not found', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/reservations/nonexistent',
    })

    expect(res.statusCode).toBe(404)
  })

  // ── POST / — Create reservation ──

  it('POST / — should create a reservation (201)', async () => {
    mockPrisma.room.findUnique.mockResolvedValue({ id: ROOM_CUID, resortId: RESORT_CUID, status: 'AVAILABLE' })
    mockPrisma.reservation.findFirst.mockResolvedValue(null) // no conflict
    mockPrisma.reservation.create.mockResolvedValue({
      id: 'res-new',
      guestName: 'Maria Santos',
      checkIn: '2026-04-01T14:00:00.000Z',
      checkOut: '2026-04-05T11:00:00.000Z',
      nights: 4,
      status: 'CONFIRMED',
      room: { id: ROOM_CUID, number: '101', type: 'STANDARD' },
      resort: { id: RESORT_CUID, name: 'Cabo Ledo' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/reservations',
      payload: {
        guestName: 'Maria Santos',
        guestEmail: 'maria@test.ao',
        guestPhone: '+244912345678',
        roomId: ROOM_CUID,
        resortId: RESORT_CUID,
        checkIn: '2026-04-01T14:00:00.000Z',
        checkOut: '2026-04-05T11:00:00.000Z',
        adults: 2,
        children: 0,
        totalAmount: 100000,
      },
    })

    expect(res.statusCode).toBe(201)
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/reservations',
      payload: { guestName: 'Incomplete' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 403 for non-authorized role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(reservationsRoutes, { prefix: '/v1/reservations' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/reservations',
      payload: {
        guestName: 'Maria Santos',
        guestEmail: 'maria@test.ao',
        guestPhone: '+244912345678',
        roomId: ROOM_CUID,
        resortId: RESORT_CUID,
        checkIn: '2026-04-01T14:00:00.000Z',
        checkOut: '2026-04-05T11:00:00.000Z',
        adults: 2,
        children: 0,
        totalAmount: 100000,
      },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  it('POST / — should return 409 for conflicting dates', async () => {
    mockPrisma.room.findUnique.mockResolvedValue({ id: ROOM_CUID, resortId: RESORT_CUID })
    mockPrisma.reservation.findFirst.mockResolvedValue({ id: 'conflict', status: 'CONFIRMED' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/reservations',
      payload: {
        guestName: 'Maria Santos',
        guestEmail: 'maria@test.ao',
        guestPhone: '+244912345678',
        roomId: ROOM_CUID,
        resortId: RESORT_CUID,
        checkIn: '2026-04-01T14:00:00.000Z',
        checkOut: '2026-04-05T11:00:00.000Z',
        adults: 2,
        children: 0,
        totalAmount: 100000,
      },
    })

    expect(res.statusCode).toBe(409)
  })

  // ── PUT /:id — Update reservation ──

  it('PUT /:id — should update a reservation (200)', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'res1',
      status: 'CONFIRMED',
      checkIn: new Date('2026-04-01'),
      checkOut: new Date('2026-04-05'),
      roomId: 'r1',
    })
    mockPrisma.reservation.update.mockResolvedValue({
      id: 'res1',
      guestName: 'Updated Name',
      room: { id: 'r1', number: '101', type: 'STANDARD' },
      resort: { id: 'resort-1', name: 'Cabo Ledo' },
    })

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/reservations/res1',
      payload: { guestName: 'Updated Name' },
    })

    expect(res.statusCode).toBe(200)
  })

  it('PUT /:id — should return 404 when reservation not found', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/reservations/nonexistent',
      payload: { guestName: 'Updated' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('PUT /:id — should return 400 for finalized reservation', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'res1',
      status: 'CHECKED_OUT',
      checkIn: new Date('2026-04-01'),
      checkOut: new Date('2026-04-05'),
      roomId: 'r1',
    })

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/reservations/res1',
      payload: { guestName: 'Updated' },
    })

    expect(res.statusCode).toBe(400)
  })

  // ── PATCH /:id/check-in ──

  it('PATCH /:id/check-in — should perform check-in (200)', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'res1',
      status: 'CONFIRMED',
      roomId: 'r1',
      room: { id: 'r1', number: '101' },
    })
    mockPrisma.reservation.update.mockResolvedValue({
      id: 'res1',
      status: 'CHECKED_IN',
      room: { id: 'r1', number: '101', type: 'STANDARD' },
      resort: { id: 'resort-1', name: 'Cabo Ledo' },
    })
    mockPrisma.room.update.mockResolvedValue({ id: 'r1', status: 'OCCUPIED' })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/reservations/res1/check-in',
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it('PATCH /:id/check-in — should return 404 when reservation not found', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/reservations/nonexistent/check-in',
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /:id/check-in — should return 400 for non-CONFIRMED reservation', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'res1',
      status: 'CHECKED_IN',
      roomId: 'r1',
      room: { id: 'r1' },
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/reservations/res1/check-in',
    })

    expect(res.statusCode).toBe(400)
  })

  // ── PATCH /:id/cancel ──

  it('PATCH /:id/cancel — should cancel a reservation (200)', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'res1',
      status: 'CONFIRMED',
      roomId: 'r1',
    })
    mockPrisma.reservation.update.mockResolvedValue({
      id: 'res1',
      status: 'CANCELLED',
      room: { id: 'r1', number: '101', type: 'STANDARD' },
      resort: { id: 'resort-1', name: 'Cabo Ledo' },
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/reservations/res1/cancel',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('CANCELLED')
  })

  it('PATCH /:id/cancel — should return 400 for already cancelled reservation', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'res1',
      status: 'CANCELLED',
      roomId: 'r1',
    })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/reservations/res1/cancel',
    })

    expect(res.statusCode).toBe(400)
  })
})

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import serviceOrderRoutes from '../index.js'

const mockPrisma = {
  roomServiceOrder: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  reservation: {
    findUnique: vi.fn(),
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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Service Orders API — /v1/service-orders', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(serviceOrderRoutes, { prefix: '/v1/service-orders' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List service orders ──

  it('GET / — should list service orders with pagination (200)', async () => {
    const orders = [
      { id: 'so-1', type: 'ROOM_SERVICE', status: 'PENDING', resort: { id: 'res-1', name: 'Cabo Ledo' }, reservation: { id: 'rsv-1', guestName: 'John', room: { number: '101' } } },
    ]
    mockPrisma.roomServiceOrder.findMany.mockResolvedValue(orders)
    mockPrisma.roomServiceOrder.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/service-orders' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body).toHaveProperty('total', 1)
    expect(body).toHaveProperty('page', 1)
  })

  it('GET / — should filter by status and resortId', async () => {
    mockPrisma.roomServiceOrder.findMany.mockResolvedValue([])
    mockPrisma.roomServiceOrder.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/service-orders?status=PENDING&resortId=res-1' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.roomServiceOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'PENDING', resortId: 'res-1' }),
      }),
    )
  })

  // ── GET /:id — Get service order ──

  it('GET /:id — should return service order detail (200)', async () => {
    const order = { id: 'so-1', type: 'ROOM_SERVICE', resort: { id: 'res-1', name: 'Cabo Ledo' }, reservation: null, guest: null }
    mockPrisma.roomServiceOrder.findUnique.mockResolvedValue(order)

    const res = await app.inject({ method: 'GET', url: '/v1/service-orders/so-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('id', 'so-1')
  })

  it('GET /:id — should return 404 for non-existent order', async () => {
    mockPrisma.roomServiceOrder.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/service-orders/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  // ── POST / — Create service order ──

  it('POST / — should create service order (201)', async () => {
    const reservation = { id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', status: 'CHECKED_IN', guestId: 'g1' }
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation)
    const created = { id: 'so-new', type: 'ROOM_SERVICE', status: 'PENDING', reservation: { id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', guestName: 'John', room: { number: '101' } } }
    mockPrisma.roomServiceOrder.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/service-orders',
      payload: {
        resortId: 'clrrrrrrrrrrrrrrrrrrrrrrrr1',
        reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'ROOM_SERVICE',
        items: [{ name: 'Cola', qty: 2, price: 500 }],
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toHaveProperty('id', 'so-new')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/service-orders',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 400 when reservation is not checked in', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'clyyyyyyyyyyyyyyyyyyyyyyyyy', status: 'CONFIRMED', guestId: 'g1' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/service-orders',
      payload: {
        resortId: 'clrrrrrrrrrrrrrrrrrrrrrrrr1',
        reservationId: 'clyyyyyyyyyyyyyyyyyyyyyyyyy',
        type: 'ROOM_SERVICE',
        items: [{ name: 'Cola', qty: 1 }],
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 400 when reservation does not exist', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/service-orders',
      payload: {
        resortId: 'clrrrrrrrrrrrrrrrrrrrrrrrr1',
        reservationId: 'clzzzzzzzzzzzzzzzzzzzzzzzzz',
        type: 'ROOM_SERVICE',
        items: [{ name: 'Cola', qty: 1 }],
      },
    })

    expect(res.statusCode).toBe(400)
  })

  // ── PATCH /:id/status — Update order status ──

  it('PATCH /:id/status — should update order status (200)', async () => {
    mockPrisma.roomServiceOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'PENDING' })
    mockPrisma.roomServiceOrder.update.mockResolvedValue({ id: 'so-1', status: 'CONFIRMED' })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/service-orders/so-1/status',
      payload: { status: 'CONFIRMED' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('status', 'CONFIRMED')
  })

  it('PATCH /:id/status — should return 404 for non-existent order', async () => {
    mockPrisma.roomServiceOrder.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/service-orders/non-existent/status',
      payload: { status: 'CONFIRMED' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /:id/status — should return 400 for invalid status', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/service-orders/so-1/status',
      payload: { status: 'INVALID' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('PATCH /:id/status — should set completedAt when status is COMPLETED', async () => {
    mockPrisma.roomServiceOrder.findUnique.mockResolvedValue({ id: 'so-1', status: 'IN_PROGRESS' })
    mockPrisma.roomServiceOrder.update.mockResolvedValue({ id: 'so-1', status: 'COMPLETED' })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/service-orders/so-1/status',
      payload: { status: 'COMPLETED' },
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.roomServiceOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ completedAt: expect.any(Date) }),
      }),
    )
  })
})

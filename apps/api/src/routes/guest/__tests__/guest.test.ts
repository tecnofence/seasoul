import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import guestRoutes from '../index.js'

const mockPrisma = {
  guest: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  reservation: {
    findMany: vi.fn(),
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

const guestUser = {
  id: 'guest-1',
  phone: '+244912345678',
  type: 'guest' as const,
}

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  app.decorate('jwt', {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
  } as any)
  return app
}

describe('Guest API — /v1/guest', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(guestRoutes, { prefix: '/v1/guest' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET /list — List guests (admin) ──

  it('GET /list — should list guests with pagination (200)', async () => {
    const guests = [
      { id: 'g1', name: 'John Doe', email: 'john@test.com', phone: '+244911111111', createdAt: new Date() },
      { id: 'g2', name: 'Jane Doe', email: 'jane@test.com', phone: '+244922222222', createdAt: new Date() },
    ]
    mockPrisma.guest.findMany.mockResolvedValue(guests)
    mockPrisma.guest.count.mockResolvedValue(2)

    const res = await app.inject({ method: 'GET', url: '/v1/guest/list' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body).toHaveProperty('total', 2)
    expect(body).toHaveProperty('page', 1)
    expect(body).toHaveProperty('totalPages', 1)
  })

  it('GET /list — should support search parameter', async () => {
    mockPrisma.guest.findMany.mockResolvedValue([])
    mockPrisma.guest.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/guest/list?search=John' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.guest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    )
  })

  // ── GET /admin/:id — Guest detail (admin) ──

  it('GET /admin/:id — should return guest detail (200)', async () => {
    const guest = { id: 'g1', name: 'John Doe', email: 'john@test.com', reservations: [], reviews: [] }
    mockPrisma.guest.findUnique.mockResolvedValue(guest)

    const res = await app.inject({ method: 'GET', url: '/v1/guest/admin/g1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('id', 'g1')
  })

  it('GET /admin/:id — should return 404 for non-existent guest', async () => {
    mockPrisma.guest.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/guest/admin/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  // ── POST /register — Register guest ──

  it('POST /register — should register new guest (201)', async () => {
    const newGuest = { id: 'g3', name: 'New Guest', phone: '+244933333333', email: 'new@test.com' }
    mockPrisma.guest.findUnique.mockResolvedValue(null) // no duplicate
    mockPrisma.guest.create.mockResolvedValue(newGuest)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/guest/register',
      payload: { name: 'New Guest', phone: '+244933333333', email: 'new@test.com' },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data).toHaveProperty('guest')
    expect(body.data).toHaveProperty('token')
  })

  it('POST /register — should return 409 for duplicate phone', async () => {
    mockPrisma.guest.findUnique.mockResolvedValue({ id: 'g1', phone: '+244933333333' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/guest/register',
      payload: { name: 'Dup Guest', phone: '+244933333333' },
    })

    expect(res.statusCode).toBe(409)
  })

  it('POST /register — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/guest/register',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  // ── POST /login — Guest login ──

  it('POST /login — should login guest by phone (200)', async () => {
    const guest = { id: 'g1', name: 'John Doe', phone: '+244911111111' }
    mockPrisma.guest.findUnique.mockResolvedValue(guest)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/guest/login',
      payload: { phone: '+244911111111' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('token')
  })

  it('POST /login — should return 404 for unregistered phone', async () => {
    mockPrisma.guest.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/guest/login',
      payload: { phone: '+244999999999' },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── GET /me — Guest profile ──

  it('GET /me — should return guest profile (200)', async () => {
    const guestApp = buildApp(guestUser)
    await guestApp.register(guestRoutes, { prefix: '/v1/guest' })
    await guestApp.ready()

    const guest = { id: 'guest-1', name: 'Guest User', phone: '+244912345678' }
    mockPrisma.guest.findUnique.mockResolvedValue(guest)

    const res = await guestApp.inject({ method: 'GET', url: '/v1/guest/me' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('id', 'guest-1')
    await guestApp.close()
  })

  it('GET /me — should return 403 for non-guest user', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/guest/me' })

    expect(res.statusCode).toBe(403)
  })

  // ── PUT /me — Update guest profile ──

  it('PUT /me — should update guest profile (200)', async () => {
    const guestApp = buildApp(guestUser)
    await guestApp.register(guestRoutes, { prefix: '/v1/guest' })
    await guestApp.ready()

    const updated = { id: 'guest-1', name: 'Updated Name' }
    mockPrisma.guest.update.mockResolvedValue(updated)

    const res = await guestApp.inject({
      method: 'PUT',
      url: '/v1/guest/me',
      payload: { name: 'Updated Name' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('name', 'Updated Name')
    await guestApp.close()
  })

  // ── GET /reservations — Guest reservations ──

  it('GET /reservations — should return guest reservations (200)', async () => {
    const guestApp = buildApp(guestUser)
    await guestApp.register(guestRoutes, { prefix: '/v1/guest' })
    await guestApp.ready()

    const reservations = [
      { id: 'rsv-1', guestId: 'guest-1', room: { id: 'r1', number: '101', type: 'STANDARD' }, resort: { id: 'res-1', name: 'Cabo Ledo' } },
    ]
    mockPrisma.reservation.findMany.mockResolvedValue(reservations)

    const res = await guestApp.inject({ method: 'GET', url: '/v1/guest/reservations' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
    await guestApp.close()
  })
})

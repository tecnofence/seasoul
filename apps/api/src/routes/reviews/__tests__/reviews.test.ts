import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import reviewsRoutes from '../index.js'

const mockPrisma = {
  guestReview: {
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
  return app
}

describe('Reviews API — /v1/reviews', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(reviewsRoutes, { prefix: '/v1/reviews' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List reviews (public) ──

  it('GET / — should list reviews with pagination (200)', async () => {
    const reviews = [
      { id: 'rev-1', overallRating: 5, comment: 'Great!', resort: { id: 'res-1', name: 'Cabo Ledo' } },
    ]
    mockPrisma.guestReview.findMany.mockResolvedValue(reviews)
    mockPrisma.guestReview.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/reviews' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body).toHaveProperty('total', 1)
    expect(body).toHaveProperty('page', 1)
  })

  it('GET / — should filter by resortId and minRating', async () => {
    mockPrisma.guestReview.findMany.mockResolvedValue([])
    mockPrisma.guestReview.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/reviews?resortId=res-1&minRating=4' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.guestReview.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ resortId: 'res-1', overallRating: { gte: 4 } }),
      }),
    )
  })

  // ── GET /stats — Review statistics ──

  it('GET /stats — should return review averages (200)', async () => {
    mockPrisma.guestReview.findMany.mockResolvedValue([
      { overallRating: 4, cleanliness: 5, service: 4, location: 5, valueForMoney: 3 },
      { overallRating: 5, cleanliness: 4, service: 5, location: 5, valueForMoney: 4 },
    ])

    const res = await app.inject({ method: 'GET', url: '/v1/reviews/stats' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveProperty('total', 2)
    expect(body.data.averages).toHaveProperty('overall')
  })

  it('GET /stats — should return null averages when no reviews', async () => {
    mockPrisma.guestReview.findMany.mockResolvedValue([])

    const res = await app.inject({ method: 'GET', url: '/v1/reviews/stats' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('total', 0)
    expect(res.json().data.averages).toBeNull()
  })

  // ── POST / — Create review ──

  it('POST / — should create review for checked-out reservation (201)', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', status: 'CHECKED_OUT', resortId: 'res-1', guestId: 'g1', guestName: 'John',
    })
    mockPrisma.guestReview.findUnique.mockResolvedValue(null) // no existing review
    mockPrisma.guestReview.create.mockResolvedValue({ id: 'rev-new', overallRating: 5 })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/reviews',
      payload: { reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', overallRating: 5, comment: 'Excellent!' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toHaveProperty('id', 'rev-new')
  })

  it('POST / — should return 404 for non-existent reservation', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/reviews',
      payload: { reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', overallRating: 5 },
    })

    expect(res.statusCode).toBe(404)
  })

  it('POST / — should return 400 when reservation is not checked out', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'clyyyyyyyyyyyyyyyyyyyyyyyyy', status: 'CHECKED_IN' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/reviews',
      payload: { reservationId: 'clyyyyyyyyyyyyyyyyyyyyyyyyy', overallRating: 4 },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 409 when review already exists', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', status: 'CHECKED_OUT', resortId: 'res-1', guestId: 'g1', guestName: 'John',
    })
    mockPrisma.guestReview.findUnique.mockResolvedValue({ id: 'rev-existing' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/reviews',
      payload: { reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', overallRating: 5 },
    })

    expect(res.statusCode).toBe(409)
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/reviews',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  // ── PATCH /:id/publish — Toggle publish ──

  it('PATCH /:id/publish — should toggle published status (200)', async () => {
    mockPrisma.guestReview.findUnique.mockResolvedValue({ id: 'rev-1', published: false })
    mockPrisma.guestReview.update.mockResolvedValue({ id: 'rev-1', published: true })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/reviews/rev-1/publish',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('published', true)
  })

  it('PATCH /:id/publish — should return 404 for non-existent review', async () => {
    mockPrisma.guestReview.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/reviews/non-existent/publish',
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /:id/publish — should return 403 for STAFF role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(reviewsRoutes, { prefix: '/v1/reviews' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'PATCH',
      url: '/v1/reviews/rev-1/publish',
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  // ── POST /:id/reply — Reply to review ──

  it('POST /:id/reply — should add reply to review (200)', async () => {
    mockPrisma.guestReview.findUnique.mockResolvedValue({ id: 'rev-1' })
    mockPrisma.guestReview.update.mockResolvedValue({ id: 'rev-1', reply: 'Thank you!' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/reviews/rev-1/reply',
      payload: { reply: 'Thank you!' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('reply', 'Thank you!')
  })

  it('POST /:id/reply — should return 403 for STAFF role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(reviewsRoutes, { prefix: '/v1/reviews' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/reviews/rev-1/reply',
      payload: { reply: 'Thanks' },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })
})

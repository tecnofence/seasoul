import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import tariffsRoutes from '../index.js'

const mockPrisma = {
  tariff: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Tariffs API — /v1/tariffs', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(tariffsRoutes, { prefix: '/v1/tariffs' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List tariffs ──

  it('GET / — should list tariffs with pagination (200)', async () => {
    const tariffs = [
      { id: 't1', roomType: 'STANDARD', active: true, resort: { id: 'r1', name: 'Cabo Ledo' } },
    ]
    mockPrisma.tariff.findMany.mockResolvedValue(tariffs)
    mockPrisma.tariff.count.mockResolvedValue(1)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/tariffs',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.totalPages).toBeDefined()
  })

  it('GET / — should filter by resortId', async () => {
    mockPrisma.tariff.findMany.mockResolvedValue([])
    mockPrisma.tariff.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/tariffs?resortId=resort-1',
    })

    expect(res.statusCode).toBe(200)
  })

  // ── GET /active — Get active tariff ──

  it('GET /active — should return active tariff (200)', async () => {
    mockPrisma.tariff.findFirst.mockResolvedValue({
      id: 't1',
      roomType: 'STANDARD',
      active: true,
      resortId: 'resort-1',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/v1/tariffs/active?resortId=resort-1&roomType=STANDARD',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('t1')
  })

  it('GET /active — should return 400 for missing parameters', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/tariffs/active',
    })

    expect(res.statusCode).toBe(400)
  })

  it('GET /active — should return 404 when no active tariff found', async () => {
    mockPrisma.tariff.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/tariffs/active?resortId=resort-1&roomType=STANDARD',
    })

    expect(res.statusCode).toBe(404)
  })

  // ── GET /:id — Get tariff by ID ──

  it('GET /:id — should return tariff (200)', async () => {
    mockPrisma.tariff.findUnique.mockResolvedValue({
      id: 't1',
      roomType: 'STANDARD',
      resort: { id: 'r1', name: 'Cabo Ledo' },
    })

    const res = await app.inject({
      method: 'GET',
      url: '/v1/tariffs/t1',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('t1')
  })

  it('GET /:id — should return 404 when tariff not found', async () => {
    mockPrisma.tariff.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/tariffs/nonexistent',
    })

    expect(res.statusCode).toBe(404)
  })

  // ── POST / — Create tariff ──

  it('POST / — should create a tariff (201)', async () => {
    mockPrisma.resort.findUnique.mockResolvedValue({ id: RESORT_CUID, name: 'Cabo Ledo' })
    mockPrisma.tariff.create.mockResolvedValue({
      id: 't-new',
      roomType: 'STANDARD',
      resortId: RESORT_CUID,
      pricePerNight: 25000,
      active: true,
      resort: { id: RESORT_CUID, name: 'Cabo Ledo' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/tariffs',
      payload: {
        resortId: RESORT_CUID,
        name: 'Tarifa Standard 2026',
        roomType: 'STANDARD',
        pricePerNight: 25000,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
      },
    })

    expect(res.statusCode).toBe(201)
  })

  it('POST / — should return 400 for invalid date range', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tariffs',
      payload: {
        resortId: RESORT_CUID,
        name: 'Tarifa Invertida',
        roomType: 'STANDARD',
        pricePerNight: 25000,
        validFrom: '2026-12-31T00:00:00.000Z',
        validUntil: '2026-01-01T00:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 403 for non-admin role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(tariffsRoutes, { prefix: '/v1/tariffs' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/tariffs',
      payload: {
        resortId: RESORT_CUID,
        name: 'Tarifa Standard 2026',
        roomType: 'STANDARD',
        pricePerNight: 25000,
        validFrom: '2026-01-01T00:00:00.000Z',
        validUntil: '2026-12-31T23:59:59.000Z',
      },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  // ── PUT /:id — Update tariff ──

  it('PUT /:id — should update a tariff (200)', async () => {
    mockPrisma.tariff.findUnique.mockResolvedValue({ id: 't1', roomType: 'STANDARD' })
    mockPrisma.tariff.update.mockResolvedValue({
      id: 't1',
      roomType: 'STANDARD',
      pricePerNight: 30000,
      resort: { id: 'resort-1', name: 'Cabo Ledo' },
    })

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/tariffs/t1',
      payload: { pricePerNight: 30000 },
    })

    expect(res.statusCode).toBe(200)
  })

  it('PUT /:id — should return 404 when tariff not found', async () => {
    mockPrisma.tariff.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/tariffs/nonexistent',
      payload: { pricePerNight: 30000 },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── DELETE /:id — Deactivate tariff ──

  it('DELETE /:id — should deactivate a tariff (200)', async () => {
    mockPrisma.tariff.findUnique.mockResolvedValue({ id: 't1', active: true })
    mockPrisma.tariff.update.mockResolvedValue({ id: 't1', active: false })

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/tariffs/t1',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Tarifa desativada')
  })

  it('DELETE /:id — should return 404 when tariff not found', async () => {
    mockPrisma.tariff.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/tariffs/nonexistent',
    })

    expect(res.statusCode).toBe(404)
  })
})

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import locksRoutes from '../index.js'

const mockPrisma = {
  room: {
    findMany: vi.fn(),
  },
  reservation: {
    findUnique: vi.fn(),
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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Locks API — /v1/locks', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(locksRoutes, { prefix: '/v1/locks' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List rooms with smart locks ──

  it('GET / — should list rooms with smart locks (200)', async () => {
    const rooms = [
      { id: 'r1', number: '101', type: 'STANDARD', status: 'AVAILABLE', seamDeviceId: 'dev-1', resortId: 'res-1', resort: { id: 'res-1', name: 'Cabo Ledo' } },
      { id: 'r2', number: '102', type: 'SUITE', status: 'OCCUPIED', seamDeviceId: 'dev-2', resortId: 'res-1', resort: { id: 'res-1', name: 'Cabo Ledo' } },
    ]
    mockPrisma.room.findMany.mockResolvedValue(rooms)

    const res = await app.inject({ method: 'GET', url: '/v1/locks' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toHaveProperty('seamDeviceId')
  })

  it('GET / — should filter by resortId', async () => {
    mockPrisma.room.findMany.mockResolvedValue([])

    const res = await app.inject({ method: 'GET', url: '/v1/locks?resortId=res-1' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.room.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ resortId: 'res-1' }),
      }),
    )
  })

  // ── POST /pin — Generate access PIN ──

  it('POST /pin — should generate PIN for valid reservation (200)', async () => {
    const reservation = {
      id: 'cm1234567890abcdefghijklm',
      status: 'CONFIRMED',
      checkIn: new Date('2026-04-01'),
      checkOut: new Date('2026-04-05'),
      room: { number: '101', seamDeviceId: 'dev-1' },
    }
    mockPrisma.reservation.findUnique.mockResolvedValue(reservation)
    mockPrisma.reservation.update.mockResolvedValue({ ...reservation, accessPinEncrypted: 'enc' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/locks/pin',
      payload: { reservationId: 'cm1234567890abcdefghijklm' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveProperty('pin')
    expect(body.data.pin).toHaveLength(6)
    expect(body.data).toHaveProperty('roomNumber', '101')
  })

  it('POST /pin — should return 404 for non-existent reservation', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/locks/pin',
      payload: { reservationId: 'cm0000000000000000000000n' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('POST /pin — should return 400 when reservation is not confirmed', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'cm2222222222222222222222n',
      status: 'CANCELLED',
      room: { seamDeviceId: 'dev-1' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/locks/pin',
      payload: { reservationId: 'cm2222222222222222222222n' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST /pin — should return 400 when room has no smart lock', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      id: 'cm3333333333333333333333n',
      status: 'CONFIRMED',
      room: { seamDeviceId: null },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/locks/pin',
      payload: { reservationId: 'cm3333333333333333333333n' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST /pin — should return 400 for missing reservationId', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/locks/pin',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST /pin — should return 403 for STAFF role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(locksRoutes, { prefix: '/v1/locks' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/locks/pin',
      payload: { reservationId: 'cm1234567890abcdefghijklm' },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  // ── DELETE /pin/:reservationId — Revoke PIN ──

  it('DELETE /pin/:reservationId — should revoke PIN (200)', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'cm1234567890abcdefghijklm' })
    mockPrisma.reservation.update.mockResolvedValue({ id: 'cm1234567890abcdefghijklm', accessPinEncrypted: null })

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/locks/pin/cm1234567890abcdefghijklm',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveProperty('message')
    expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { accessPinEncrypted: null, pinValidFrom: null, pinValidUntil: null },
      }),
    )
  })

  it('DELETE /pin/:reservationId — should return 404 for non-existent reservation', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/locks/pin/cm0000000000000000000000n',
    })

    expect(res.statusCode).toBe(404)
  })

  it('DELETE /pin/:reservationId — should return 403 for STAFF role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(locksRoutes, { prefix: '/v1/locks' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'DELETE',
      url: '/v1/locks/pin/cm1234567890abcdefghijklm',
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })
})

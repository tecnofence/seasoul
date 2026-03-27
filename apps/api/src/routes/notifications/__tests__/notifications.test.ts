import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import notificationsRoutes from '../index.js'

const mockPrisma = {
  notification: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
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

describe('Notifications API — /v1/notifications', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(notificationsRoutes, { prefix: '/v1/notifications' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List notifications ──

  it('GET / — should list notifications with pagination (200)', async () => {
    const notifications = [
      { id: 'n1', title: 'Check-in reminder', status: 'SENT', readAt: null, createdAt: new Date() },
      { id: 'n2', title: 'Welcome', status: 'READ', readAt: new Date(), createdAt: new Date() },
    ]
    mockPrisma.notification.findMany.mockResolvedValue(notifications)
    mockPrisma.notification.count.mockResolvedValue(2)

    const res = await app.inject({ method: 'GET', url: '/v1/notifications' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body).toHaveProperty('total', 2)
    expect(body).toHaveProperty('page', 1)
  })

  it('GET / — should filter by status and channel', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([])
    mockPrisma.notification.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/notifications?status=SENT&channel=PUSH' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'SENT', channel: 'PUSH' }),
      }),
    )
  })

  // ── GET /me — My notifications ──

  it('GET /me — should return staff user notifications (200)', async () => {
    const notifications = [
      { id: 'n1', title: 'Task assigned', readAt: null },
      { id: 'n2', title: 'Shift update', readAt: new Date() },
    ]
    mockPrisma.notification.findMany.mockResolvedValue(notifications)

    const res = await app.inject({ method: 'GET', url: '/v1/notifications/me' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body).toHaveProperty('unread', 1)
  })

  it('GET /me — should return guest notifications using guestId', async () => {
    const guestApp = buildApp(guestUser)
    await guestApp.register(notificationsRoutes, { prefix: '/v1/notifications' })
    await guestApp.ready()

    mockPrisma.notification.findMany.mockResolvedValue([])

    const res = await guestApp.inject({ method: 'GET', url: '/v1/notifications/me' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { guestId: 'guest-1' },
      }),
    )
    await guestApp.close()
  })

  // ── POST / — Create notification ──

  it('POST / — should create notification (201)', async () => {
    const created = { id: 'n-new', title: 'New notification', userId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', channel: 'PUSH' }
    mockPrisma.notification.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/notifications',
      payload: { title: 'New notification', body: 'Test body', channel: 'PUSH', type: 'CHECKIN_READY', userId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toHaveProperty('id', 'n-new')
  })

  it('POST / — should return 400 when neither userId nor guestId provided', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/notifications',
      payload: { title: 'Test', body: 'Test body', channel: 'PUSH' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/notifications',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 403 for STAFF role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(notificationsRoutes, { prefix: '/v1/notifications' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/notifications',
      payload: { title: 'Test', body: 'Body', channel: 'PUSH', type: 'CHECKIN_READY', userId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  // ── PATCH /:id/read — Mark as read ──

  it('PATCH /:id/read — should mark notification as read (200)', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue({ id: 'n1', readAt: null })
    mockPrisma.notification.update.mockResolvedValue({ id: 'n1', readAt: new Date(), status: 'READ' })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/notifications/n1/read',
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'READ', readAt: expect.any(Date) }),
      }),
    )
  })

  it('PATCH /:id/read — should return 404 for non-existent notification', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/notifications/non-existent/read',
    })

    expect(res.statusCode).toBe(404)
  })

  // ── PATCH /read-all — Mark all as read ──

  it('PATCH /read-all — should mark all notifications as read (200)', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/notifications/read-all',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveProperty('message')
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1', readAt: null }),
      }),
    )
  })

  it('PATCH /read-all — should use guestId for guest users', async () => {
    const guestApp = buildApp(guestUser)
    await guestApp.register(notificationsRoutes, { prefix: '/v1/notifications' })
    await guestApp.ready()

    mockPrisma.notification.updateMany.mockResolvedValue({ count: 2 })

    const res = await guestApp.inject({
      method: 'PATCH',
      url: '/v1/notifications/read-all',
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ guestId: 'guest-1' }),
      }),
    )
    await guestApp.close()
  })
})

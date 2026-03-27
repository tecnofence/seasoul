import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import chatRoutes from '../index.js'

const mockPrisma = {
  chatMessage: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
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

describe('Chat API — /v1/chat', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(chatRoutes, { prefix: '/v1/chat' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET /unread — Unread message count ──

  it('GET /unread — should return unread count for staff (200)', async () => {
    mockPrisma.chatMessage.count.mockResolvedValue(5)

    const res = await app.inject({ method: 'GET', url: '/v1/chat/unread' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('unread', 5)
  })

  it('GET /unread — should filter by reservationId', async () => {
    mockPrisma.chatMessage.count.mockResolvedValue(2)

    const res = await app.inject({ method: 'GET', url: '/v1/chat/unread?reservationId=cm1234567890abcdefghijklm' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.chatMessage.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ reservationId: 'cm1234567890abcdefghijklm' }),
      }),
    )
  })

  it('GET /unread — should count STAFF messages for guest user', async () => {
    const guestApp = buildApp(guestUser)
    await guestApp.register(chatRoutes, { prefix: '/v1/chat' })
    await guestApp.ready()

    mockPrisma.chatMessage.count.mockResolvedValue(3)

    const res = await guestApp.inject({ method: 'GET', url: '/v1/chat/unread' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.chatMessage.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ senderType: 'STAFF' }),
      }),
    )
    await guestApp.close()
  })

  // ── GET / — List messages ──

  it('GET / — should list messages with pagination (200)', async () => {
    const messages = [
      { id: 'msg-1', content: 'Hello', senderType: 'GUEST', guest: { id: 'g1', name: 'John' } },
    ]
    mockPrisma.chatMessage.findMany.mockResolvedValue(messages)
    mockPrisma.chatMessage.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/chat?reservationId=cm1234567890abcdefghijklm' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body).toHaveProperty('total', 1)
  })

  it('GET / — should return 400 when reservationId is missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/chat' })

    expect(res.statusCode).toBe(400)
  })

  // ── POST / — Send message ──

  it('POST / — should create a staff message (201)', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'cm1234567890abcdefghijklm' })
    const message = { id: 'msg-new', content: 'Room is ready', senderType: 'STAFF', guest: null }
    mockPrisma.chatMessage.create.mockResolvedValue(message)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/chat',
      payload: { reservationId: 'cm1234567890abcdefghijklm', content: 'Room is ready' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toHaveProperty('id', 'msg-new')
  })

  it('POST / — should create a guest message (201)', async () => {
    const guestApp = buildApp(guestUser)
    await guestApp.register(chatRoutes, { prefix: '/v1/chat' })
    await guestApp.ready()

    mockPrisma.reservation.findUnique.mockResolvedValue({ id: 'cm1234567890abcdefghijklm' })
    const message = { id: 'msg-g', content: 'Need towels', senderType: 'GUEST', guest: { id: 'guest-1', name: 'Guest' } }
    mockPrisma.chatMessage.create.mockResolvedValue(message)

    const res = await guestApp.inject({
      method: 'POST',
      url: '/v1/chat',
      payload: { reservationId: 'cm1234567890abcdefghijklm', content: 'Need towels' },
    })

    expect(res.statusCode).toBe(201)
    expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ senderType: 'GUEST', guestId: 'guest-1' }),
      }),
    )
    await guestApp.close()
  })

  it('POST / — should return 404 when reservation does not exist', async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/chat',
      payload: { reservationId: 'cm0000000000000000000000n', content: 'Hello' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('POST / — should return 400 for missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/chat',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  // ── PATCH /read — Mark messages as read ──

  it('PATCH /read — should mark messages as read (200)', async () => {
    mockPrisma.chatMessage.updateMany.mockResolvedValue({ count: 3 })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/chat/read',
      payload: { reservationId: 'cm1234567890abcdefghijklm' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveProperty('message')
  })

  it('PATCH /read — should return 400 when reservationId is missing', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/chat/read',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })
})

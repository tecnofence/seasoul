import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import authRoutes from '../index.js'

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  refreshToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
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
  // Mock jwt.sign for login/refresh token generation
  app.decorate('jwt', {
    sign: vi.fn().mockReturnValue('mock-access-token'),
    verify: vi.fn(),
  })
  return app
}

describe('Auth API — /v1/auth', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(authRoutes, { prefix: '/v1/auth' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── POST /register ──

  it('POST /register — should register a new user (201)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-new',
      name: 'João Silva',
      email: 'joao@engeris.ao',
      role: 'STAFF',
      resortId: 'resort-1',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        name: 'João Silva',
        email: 'joao@engeris.ao',
        password: 'Secure123!',
        role: 'STAFF',
        resortId: RESORT_CUID,
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data).toBeDefined()
    expect(body.data.email).toBe('joao@engeris.ao')
  })

  it('POST /register — should return 400 for invalid data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: { email: 'bad' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST /register — should return 403 for non-admin role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(authRoutes, { prefix: '/v1/auth' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        name: 'João Silva',
        email: 'joao@engeris.ao',
        password: 'Secure123!',
        role: 'STAFF',
        resortId: RESORT_CUID,
      },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  it('POST /register — should return 409 when email already exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'joao@engeris.ao' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      payload: {
        name: 'João Silva',
        email: 'joao@engeris.ao',
        password: 'Secure123!',
        role: 'STAFF',
        resortId: RESORT_CUID,
      },
    })

    expect(res.statusCode).toBe(409)
  })

  // ── POST /login ──

  it('POST /login — should return 400 for missing fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST /login — should return 401 for invalid credentials', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'nobody@engeris.ao', password: 'wrong' },
    })

    expect(res.statusCode).toBe(401)
  })

  // ── POST /refresh ──

  it('POST /refresh — should return 400 for missing refreshToken', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST /refresh — should return 401 for invalid/expired refresh token', async () => {
    mockPrisma.refreshToken.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: 'invalid-token-hash' },
    })

    expect(res.statusCode).toBe(401)
  })

  // ── POST /logout ──

  it('POST /logout — should revoke refresh token (200)', async () => {
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/logout',
      payload: { refreshToken: 'some-refresh-token' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Sessão terminada com sucesso')
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled()
  })

  it('POST /logout — should return 400 for missing refreshToken', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/logout',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  // ── GET /me ──

  it('GET /me — should return authenticated user profile (200)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Admin',
      email: 'admin@engeris.ao',
      role: 'SUPER_ADMIN',
      resortId: null,
      twoFaEnabled: false,
      createdAt: new Date(),
    })

    const res = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('user-1')
  })

  it('GET /me — should return 404 when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/auth/me',
    })

    expect(res.statusCode).toBe(404)
  })

  // ── POST /2fa/setup ──

  it('POST /2fa/setup — should return 404 when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/2fa/setup',
    })

    expect(res.statusCode).toBe(404)
  })

  it('POST /2fa/setup — should return 400 when 2FA already enabled', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@engeris.ao',
      twoFaEnabled: true,
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/2fa/setup',
    })

    expect(res.statusCode).toBe(400)
  })
})

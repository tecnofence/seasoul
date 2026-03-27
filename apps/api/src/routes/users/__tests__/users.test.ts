import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import usersRoutes from '../index.js'

const mockPrisma = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
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

describe('Users API — /v1/users', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(usersRoutes, { prefix: '/v1/users' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List users ──

  it('GET / — should list users with pagination (200)', async () => {
    const users = [
      { id: 'u1', name: 'User 1', email: 'u1@test.ao', role: 'STAFF', resortId: 'r1', active: true },
      { id: 'u2', name: 'User 2', email: 'u2@test.ao', role: 'STAFF', resortId: 'r1', active: true },
    ]
    mockPrisma.user.findMany.mockResolvedValue(users)
    mockPrisma.user.count.mockResolvedValue(2)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/users',
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body.total).toBe(2)
    expect(body.page).toBeDefined()
    expect(body.totalPages).toBeDefined()
  })

  it('GET / — should support search parameter', async () => {
    mockPrisma.user.findMany.mockResolvedValue([])
    mockPrisma.user.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/users?search=joao',
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.user.findMany).toHaveBeenCalled()
  })

  // ── GET /:id — Get user by ID ──

  it('GET /:id — should return user (200)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'User 1',
      email: 'u1@test.ao',
      role: 'STAFF',
    })

    const res = await app.inject({
      method: 'GET',
      url: '/v1/users/u1',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('u1')
  })

  it('GET /:id — should return 404 when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/users/nonexistent',
    })

    expect(res.statusCode).toBe(404)
  })

  // ── POST / — Create user ──

  it('POST / — should create a user (201)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'u-new',
      name: 'Novo Utilizador',
      email: 'novo@engeris.ao',
      role: 'STAFF',
      resortId: 'resort-1',
      active: true,
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      payload: {
        name: 'Novo Utilizador',
        email: 'novo@engeris.ao',
        password: 'Secure123!',
        role: 'STAFF',
        resortId: RESORT_CUID,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.email).toBe('novo@engeris.ao')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      payload: { name: 'Incomplete' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 403 for non-admin role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(usersRoutes, { prefix: '/v1/users' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/users',
      payload: {
        name: 'Novo',
        email: 'novo@engeris.ao',
        password: 'Secure123!',
        role: 'STAFF',
        resortId: RESORT_CUID,
      },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  it('POST / — should return 409 for duplicate email', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing', email: 'novo@engeris.ao' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      payload: {
        name: 'Novo Utilizador',
        email: 'novo@engeris.ao',
        password: 'Secure123!',
        role: 'STAFF',
        resortId: RESORT_CUID,
      },
    })

    expect(res.statusCode).toBe(409)
  })

  // ── PUT /:id — Update user ──

  it('PUT /:id — should update a user (200)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      name: 'Old Name',
      email: 'old@engeris.ao',
    })
    mockPrisma.user.update.mockResolvedValue({
      id: 'u1',
      name: 'New Name',
      email: 'old@engeris.ao',
    })

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/users/u1',
      payload: { name: 'New Name' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.name).toBe('New Name')
  })

  it('PUT /:id — should return 404 when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/users/nonexistent',
      payload: { name: 'Updated' },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── DELETE /:id — Deactivate user ──

  it('DELETE /:id — should deactivate a user (200)', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u2', active: true })
    mockPrisma.user.update.mockResolvedValue({ id: 'u2', active: false })

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/users/u2',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Utilizador desativado')
  })

  it('DELETE /:id — should return 404 when user not found', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/users/nonexistent',
    })

    expect(res.statusCode).toBe(404)
  })

  it('DELETE /:id — should return 400 when deactivating own account', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', active: true })

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/users/user-1',
    })

    expect(res.statusCode).toBe(400)
  })

  it('DELETE /:id — should return 403 for non-SUPER_ADMIN', async () => {
    const managerApp = buildApp({
      id: 'user-3',
      email: 'manager@engeris.ao',
      role: 'RESORT_MANAGER',
      tenantId: 'tenant-1',
      type: 'staff' as const,
    })
    await managerApp.register(usersRoutes, { prefix: '/v1/users' })
    await managerApp.ready()

    const res = await managerApp.inject({
      method: 'DELETE',
      url: '/v1/users/u2',
    })

    expect(res.statusCode).toBe(403)
    await managerApp.close()
  })
})

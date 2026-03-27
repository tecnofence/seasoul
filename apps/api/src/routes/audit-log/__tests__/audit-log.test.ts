import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import auditLogRoutes from '../index.js'

const mockPrisma = {
  auditLog: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
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

const managerUser = {
  id: 'user-3',
  email: 'manager@engeris.ao',
  role: 'RESORT_MANAGER',
  tenantId: 'tenant-1',
  type: 'staff' as const,
}

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Audit Log API — /v1/audit-log', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(auditLogRoutes, { prefix: '/v1/audit-log' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List audit logs ──

  it('GET / — should list audit logs with pagination (200)', async () => {
    const logs = [
      { id: 'log-1', entity: 'Reservation', action: 'CREATE', userId: 'user-1', createdAt: new Date() },
      { id: 'log-2', entity: 'Room', action: 'UPDATE', userId: 'user-1', createdAt: new Date() },
    ]
    mockPrisma.auditLog.findMany.mockResolvedValue(logs)
    mockPrisma.auditLog.count.mockResolvedValue(2)

    const res = await app.inject({ method: 'GET', url: '/v1/audit-log' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body).toHaveProperty('total', 2)
    expect(body).toHaveProperty('page', 1)
    expect(body).toHaveProperty('totalPages', 1)
  })

  it('GET / — should filter by entity and action', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([])
    mockPrisma.auditLog.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/audit-log?entity=Reservation&action=CREATE' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entity: 'Reservation',
          action: { contains: 'CREATE', mode: 'insensitive' },
        }),
      }),
    )
  })

  it('GET / — should filter by date range (from/to)', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([])
    mockPrisma.auditLog.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/audit-log?from=2026-01-01&to=2026-03-31' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    )
  })

  it('GET / — should filter by userId', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([])
    mockPrisma.auditLog.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/audit-log?userId=user-1' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1' }),
      }),
    )
  })

  it('GET / — should return 403 for STAFF role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(auditLogRoutes, { prefix: '/v1/audit-log' })
    await staffApp.ready()

    const res = await staffApp.inject({ method: 'GET', url: '/v1/audit-log' })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  it('GET / — should be accessible by RESORT_MANAGER', async () => {
    const managerApp = buildApp(managerUser)
    await managerApp.register(auditLogRoutes, { prefix: '/v1/audit-log' })
    await managerApp.ready()

    mockPrisma.auditLog.findMany.mockResolvedValue([])
    mockPrisma.auditLog.count.mockResolvedValue(0)

    const res = await managerApp.inject({ method: 'GET', url: '/v1/audit-log' })

    expect(res.statusCode).toBe(200)
    await managerApp.close()
  })

  // ── GET /entities — List distinct entities ──

  it('GET /entities — should return distinct entity names (200)', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([
      { entity: 'Reservation' },
      { entity: 'Room' },
      { entity: 'Guest' },
    ])

    const res = await app.inject({ method: 'GET', url: '/v1/audit-log/entities' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toEqual(['Reservation', 'Room', 'Guest'])
  })

  it('GET /entities — should return 403 for STAFF role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(auditLogRoutes, { prefix: '/v1/audit-log' })
    await staffApp.ready()

    const res = await staffApp.inject({ method: 'GET', url: '/v1/audit-log/entities' })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  // ── GET /:id — Get audit log detail ──

  it('GET /:id — should return audit log detail (200)', async () => {
    const log = { id: 'log-1', entity: 'Reservation', action: 'CREATE', userId: 'user-1', data: { id: 'rsv-1' } }
    mockPrisma.auditLog.findUnique.mockResolvedValue(log)

    const res = await app.inject({ method: 'GET', url: '/v1/audit-log/log-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('id', 'log-1')
    expect(res.json().data).toHaveProperty('entity', 'Reservation')
  })

  it('GET /:id — should return 404 for non-existent log', async () => {
    mockPrisma.auditLog.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/audit-log/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  it('GET /:id — should return 403 for STAFF role', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(auditLogRoutes, { prefix: '/v1/audit-log' })
    await staffApp.ready()

    const res = await staffApp.inject({ method: 'GET', url: '/v1/audit-log/log-1' })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })
})

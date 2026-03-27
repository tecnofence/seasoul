import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import maintenanceRoutes from '../index.js'

const mockPrisma = {
  maintenanceTicket: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  room: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  resort: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  employee: {
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

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Maintenance API — /v1/maintenance', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(maintenanceRoutes, { prefix: '/v1/maintenance' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List tickets ──

  it('GET / — should list tickets with pagination (200)', async () => {
    const tickets = [
      { id: 'mt-1', location: 'Pool area', status: 'OPEN', priority: 'HIGH', resortId: 'res-1', roomId: null },
      { id: 'mt-2', location: 'Room 101', status: 'IN_PROGRESS', priority: 'MEDIUM', resortId: 'res-1', roomId: 'r1' },
    ]
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue(tickets)
    mockPrisma.maintenanceTicket.count.mockResolvedValue(2)
    mockPrisma.room.findMany.mockResolvedValue([{ id: 'r1', number: '101', type: 'STANDARD' }])
    mockPrisma.resort.findMany.mockResolvedValue([{ id: 'res-1', name: 'Cabo Ledo' }])

    const res = await app.inject({ method: 'GET', url: '/v1/maintenance' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body).toHaveProperty('total', 2)
    expect(body).toHaveProperty('page', 1)
  })

  it('GET / — should filter by status and priority', async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([])
    mockPrisma.maintenanceTicket.count.mockResolvedValue(0)
    mockPrisma.room.findMany.mockResolvedValue([])
    mockPrisma.resort.findMany.mockResolvedValue([])

    const res = await app.inject({ method: 'GET', url: '/v1/maintenance?status=OPEN&priority=URGENT' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.maintenanceTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'OPEN', priority: 'URGENT' }),
      }),
    )
  })

  it('GET / — should filter by resortId for tenant isolation', async () => {
    mockPrisma.maintenanceTicket.findMany.mockResolvedValue([])
    mockPrisma.maintenanceTicket.count.mockResolvedValue(0)
    mockPrisma.room.findMany.mockResolvedValue([])
    mockPrisma.resort.findMany.mockResolvedValue([])

    const res = await app.inject({ method: 'GET', url: '/v1/maintenance?resortId=res-1' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.maintenanceTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ resortId: 'res-1' }),
      }),
    )
  })

  // ── GET /:id — Get ticket by ID ──

  it('GET /:id — should return ticket detail with enriched data (200)', async () => {
    const ticket = { id: 'mt-1', location: 'Room 101', resortId: 'res-1', roomId: 'r1', assignedTo: 'emp-1' }
    mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(ticket)
    mockPrisma.room.findUnique.mockResolvedValue({ id: 'r1', number: '101', type: 'STANDARD', floor: 1 })
    mockPrisma.resort.findUnique.mockResolvedValue({ id: 'res-1', name: 'Cabo Ledo' })
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', name: 'Carlos', department: 'MAINTENANCE' })

    const res = await app.inject({ method: 'GET', url: '/v1/maintenance/mt-1' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveProperty('id', 'mt-1')
    expect(body.data).toHaveProperty('room')
    expect(body.data).toHaveProperty('resort')
    expect(body.data).toHaveProperty('assignedEmployee')
  })

  it('GET /:id — should return 404 for non-existent ticket', async () => {
    mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/maintenance/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  // ── POST / — Create ticket ──

  it('POST / — should create maintenance ticket (201)', async () => {
    const created = { id: 'mt-new', location: 'Restaurant', description: 'Broken window', priority: 'HIGH', resortId: 'res-1' }
    mockPrisma.maintenanceTicket.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/maintenance',
      payload: { resortId: 'res-1', location: 'Restaurant', description: 'Broken window', priority: 'HIGH' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toHaveProperty('id', 'mt-new')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/maintenance',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should default priority to MEDIUM', async () => {
    const created = { id: 'mt-new2', location: 'Lobby', description: 'Light out', priority: 'MEDIUM', resortId: 'res-1' }
    mockPrisma.maintenanceTicket.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/maintenance',
      payload: { resortId: 'res-1', location: 'Lobby', description: 'Light out' },
    })

    expect(res.statusCode).toBe(201)
    expect(mockPrisma.maintenanceTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ priority: 'MEDIUM' }),
      }),
    )
  })

  // ── PATCH /:id/status — Update status ──

  it('PATCH /:id/status — should update ticket status (200)', async () => {
    mockPrisma.maintenanceTicket.findUnique.mockResolvedValue({ id: 'mt-1', status: 'OPEN' })
    mockPrisma.maintenanceTicket.update.mockResolvedValue({ id: 'mt-1', status: 'IN_PROGRESS' })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/maintenance/mt-1/status',
      payload: { status: 'IN_PROGRESS' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('status', 'IN_PROGRESS')
  })

  it('PATCH /:id/status — should set resolvedAt when status is RESOLVED', async () => {
    mockPrisma.maintenanceTicket.findUnique.mockResolvedValue({ id: 'mt-1', status: 'IN_PROGRESS' })
    mockPrisma.maintenanceTicket.update.mockResolvedValue({ id: 'mt-1', status: 'RESOLVED' })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/maintenance/mt-1/status',
      payload: { status: 'RESOLVED' },
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.maintenanceTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resolvedAt: expect.any(Date) }),
      }),
    )
  })

  it('PATCH /:id/status — should return 404 for non-existent ticket', async () => {
    mockPrisma.maintenanceTicket.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/maintenance/non-existent/status',
      payload: { status: 'CLOSED' },
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /:id/status — should return 400 for invalid status', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/maintenance/mt-1/status',
      payload: { status: 'INVALID' },
    })

    expect(res.statusCode).toBe(400)
  })

  // ── PATCH /:id/assign — Assign to employee ──

  it('PATCH /:id/assign — should assign ticket to employee (200)', async () => {
    mockPrisma.maintenanceTicket.update.mockResolvedValue({ id: 'mt-1', assignedTo: 'emp-1' })

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/maintenance/mt-1/assign',
      payload: { assignedTo: 'emp-1' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('assignedTo', 'emp-1')
  })

  it('PATCH /:id/assign — should return 400 when assignedTo is missing', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/maintenance/mt-1/assign',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })
})

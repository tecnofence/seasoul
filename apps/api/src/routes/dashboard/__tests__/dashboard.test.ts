import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import dashboardRoutes from '../index.js'

const mockPrisma = {
  resort: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  room: {
    count: vi.fn(),
  },
  reservation: {
    count: vi.fn(),
  },
  maintenanceTicket: {
    count: vi.fn(),
  },
  roomServiceOrder: {
    count: vi.fn(),
  },
  sale: {
    aggregate: vi.fn(),
  },
  guestReview: {
    aggregate: vi.fn(),
  },
  $queryRawUnsafe: vi.fn(),
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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

function setupDashboardMocks() {
  mockPrisma.room.count.mockResolvedValue(50)
  mockPrisma.reservation.count.mockResolvedValue(3)
  mockPrisma.maintenanceTicket.count.mockResolvedValue(2)
  mockPrisma.roomServiceOrder.count.mockResolvedValue(5)
  mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { totalAmount: { toNumber: () => 150000 } } })
  mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: BigInt(4) }])
  mockPrisma.guestReview.aggregate.mockResolvedValue({ _avg: { overallRating: 4.5 } })
}

describe('Dashboard API — /v1/dashboard', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(dashboardRoutes, { prefix: '/v1/dashboard' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET /resort/:resortId — Resort dashboard ──

  it('GET /resort/:resortId — should return resort dashboard (200)', async () => {
    mockPrisma.resort.findUnique.mockResolvedValue({ id: 'res-1', name: 'Cabo Ledo' })
    // room.count is called twice (total and occupied)
    mockPrisma.room.count.mockResolvedValueOnce(50).mockResolvedValueOnce(30)
    mockPrisma.reservation.count.mockResolvedValue(5)
    mockPrisma.maintenanceTicket.count.mockResolvedValue(2)
    mockPrisma.roomServiceOrder.count.mockResolvedValue(3)
    mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { totalAmount: { toNumber: () => 100000 } } })
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: BigInt(1) }])
    mockPrisma.guestReview.aggregate.mockResolvedValue({ _avg: { overallRating: 4.2 } })

    const res = await app.inject({ method: 'GET', url: '/v1/dashboard/resort/res-1' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveProperty('resortId', 'res-1')
    expect(body.data).toHaveProperty('resortName', 'Cabo Ledo')
    expect(body.data).toHaveProperty('totalRooms')
    expect(body.data).toHaveProperty('occupancy')
    expect(body.data).toHaveProperty('revenueToday')
    expect(body.data).toHaveProperty('revenueMtd')
    expect(body.data).toHaveProperty('pendingMaintenance')
    expect(body.data).toHaveProperty('averageRating')
  })

  it('GET /resort/:resortId — should return 404 for non-existent resort', async () => {
    mockPrisma.resort.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/dashboard/resort/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  it('GET /resort/:resortId — should handle zero rooms (0% occupancy)', async () => {
    mockPrisma.resort.findUnique.mockResolvedValue({ id: 'res-2', name: 'Empty Resort' })
    mockPrisma.room.count.mockResolvedValue(0)
    mockPrisma.reservation.count.mockResolvedValue(0)
    mockPrisma.maintenanceTicket.count.mockResolvedValue(0)
    mockPrisma.roomServiceOrder.count.mockResolvedValue(0)
    mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { totalAmount: null } })
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: BigInt(0) }])
    mockPrisma.guestReview.aggregate.mockResolvedValue({ _avg: { overallRating: null } })

    const res = await app.inject({ method: 'GET', url: '/v1/dashboard/resort/res-2' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.occupancy).toBe(0)
    expect(body.data.revenueToday).toBe(0)
    expect(body.data.averageRating).toBe(0)
  })

  it('GET /resort/:resortId — should be accessible by RESORT_MANAGER', async () => {
    const managerApp = buildApp(managerUser)
    await managerApp.register(dashboardRoutes, { prefix: '/v1/dashboard' })
    await managerApp.ready()

    mockPrisma.resort.findUnique.mockResolvedValue({ id: 'res-1', name: 'Cabo Ledo' })
    mockPrisma.room.count.mockResolvedValue(10)
    mockPrisma.reservation.count.mockResolvedValue(0)
    mockPrisma.maintenanceTicket.count.mockResolvedValue(0)
    mockPrisma.roomServiceOrder.count.mockResolvedValue(0)
    mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { totalAmount: null } })
    mockPrisma.$queryRawUnsafe.mockResolvedValue([{ count: BigInt(0) }])
    mockPrisma.guestReview.aggregate.mockResolvedValue({ _avg: { overallRating: null } })

    const res = await managerApp.inject({ method: 'GET', url: '/v1/dashboard/resort/res-1' })

    expect(res.statusCode).toBe(200)
    await managerApp.close()
  })

  // ── GET /central — Central dashboard ──

  it('GET /central — should return central dashboard for SUPER_ADMIN (200)', async () => {
    mockPrisma.resort.findMany.mockResolvedValue([
      { id: 'res-1', name: 'Cabo Ledo', active: true },
      { id: 'res-2', name: 'Sangano', active: true },
    ])
    mockPrisma.room.count.mockResolvedValue(25)
    mockPrisma.reservation.count.mockResolvedValue(2)
    mockPrisma.sale.aggregate.mockResolvedValue({ _sum: { totalAmount: { toNumber: () => 50000 } } })

    const res = await app.inject({ method: 'GET', url: '/v1/dashboard/central' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveProperty('resorts')
    expect(body.data.resorts).toHaveLength(2)
    expect(body.data).toHaveProperty('totalRevenueMtd')
    expect(body.data).toHaveProperty('totalOccupancy')
    expect(body.data).toHaveProperty('combinedCheckInsToday')
  })

  it('GET /central — should return 403 for non-SUPER_ADMIN', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(dashboardRoutes, { prefix: '/v1/dashboard' })
    await staffApp.ready()

    const res = await staffApp.inject({ method: 'GET', url: '/v1/dashboard/central' })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  it('GET /central — should return 403 for RESORT_MANAGER', async () => {
    const managerApp = buildApp(managerUser)
    await managerApp.register(dashboardRoutes, { prefix: '/v1/dashboard' })
    await managerApp.ready()

    const res = await managerApp.inject({ method: 'GET', url: '/v1/dashboard/central' })

    expect(res.statusCode).toBe(403)
    await managerApp.close()
  })

  it('GET /central — should handle no active resorts', async () => {
    mockPrisma.resort.findMany.mockResolvedValue([])

    const res = await app.inject({ method: 'GET', url: '/v1/dashboard/central' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.resorts).toHaveLength(0)
    expect(body.data.totalRevenueMtd).toBe(0)
    expect(body.data.totalOccupancy).toBe(0)
  })
})

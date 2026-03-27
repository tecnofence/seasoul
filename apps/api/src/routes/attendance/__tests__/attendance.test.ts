import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import attendanceRoutes from '../index.js'

const mockPrisma = {
  attendanceRecord: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Attendance API — /v1/attendance', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(attendanceRoutes, { prefix: '/v1/attendance' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — Listar registos de assiduidade ──

  it('should list attendance records with pagination (200)', async () => {
    const records = [
      { id: 'att-1', employeeId: 'emp-1', type: 'ENTRY', validGps: true, employee: { id: 'emp-1', name: 'Joao', department: 'KITCHEN', resortId: 'r1' } },
    ]
    mockPrisma.attendanceRecord.findMany.mockResolvedValue(records)
    mockPrisma.attendanceRecord.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/attendance?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
  })

  it('should filter attendance by employeeId and resortId', async () => {
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([])
    mockPrisma.attendanceRecord.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/attendance?page=1&limit=10&employeeId=emp-1&resortId=r1',
    })

    expect(res.statusCode).toBe(200)
  })

  it('should filter attendance by date range', async () => {
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([])
    mockPrisma.attendanceRecord.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/attendance?page=1&limit=10&from=2026-03-01&to=2026-03-31',
    })

    expect(res.statusCode).toBe(200)
  })

  it('should filter attendance by validGps flag', async () => {
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([])
    mockPrisma.attendanceRecord.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/attendance?page=1&limit=10&validGps=true',
    })

    expect(res.statusCode).toBe(200)
  })

  // ── POST / — Registar ponto ──

  it('should record attendance with valid GPS (201)', async () => {
    const employee = {
      id: 'emp-1',
      name: 'Joao',
      active: true,
      resort: { id: 'r1', name: 'Cabo Ledo', lat: -9.0333, lng: 13.2500, geofenceRadius: 300 },
    }
    mockPrisma.employee.findUnique.mockResolvedValue(employee)
    mockPrisma.attendanceRecord.create.mockResolvedValue({
      id: 'att-new',
      employeeId: 'emp-1',
      type: 'ENTRY',
      validGps: true,
      employee: { id: 'emp-1', name: 'Joao', department: 'KITCHEN' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance',
      payload: {
        employeeId: 'cm1234567890abcdefghijklm',
        type: 'ENTRY',
        lat: -9.0333,
        lng: 13.2500,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toContain('ENTRY')
  })

  it('should record attendance outside geofence with warning', async () => {
    const employee = {
      id: 'emp-1',
      name: 'Joao',
      active: true,
      resort: { id: 'r1', name: 'Cabo Ledo', lat: -9.0333, lng: 13.2500, geofenceRadius: 300 },
    }
    mockPrisma.employee.findUnique.mockResolvedValue(employee)
    mockPrisma.attendanceRecord.create.mockResolvedValue({
      id: 'att-new',
      employeeId: 'emp-1',
      type: 'ENTRY',
      validGps: false,
      employee: { id: 'emp-1', name: 'Joao', department: 'KITCHEN' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance',
      payload: {
        employeeId: 'cm1234567890abcdefghijklm',
        type: 'ENTRY',
        lat: -10.0000, // far from resort
        lng: 14.0000,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toContain('FORA do geofence')
  })

  it('should return 404 when employee not found or inactive', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance',
      payload: {
        employeeId: 'cm0000000000000000000000n',
        type: 'ENTRY',
        lat: -9.0333,
        lng: 13.2500,
      },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Colaborador não encontrado ou inativo')
  })

  it('should return 404 for inactive employee', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', active: false, resort: {} })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance',
      payload: {
        employeeId: 'cm1234567890abcdefghijklm',
        type: 'ENTRY',
        lat: -9.0333,
        lng: 13.2500,
      },
    })

    expect(res.statusCode).toBe(404)
  })

  it('should return 400 when body is invalid on record', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/attendance',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  // ── GET /summary — Resumo de assiduidade ──

  it('should return attendance summary (200)', async () => {
    const entry = { type: 'ENTRY', validGps: true, createdAt: new Date('2026-03-15T08:00:00Z') }
    const exit = { type: 'EXIT', validGps: true, createdAt: new Date('2026-03-15T17:00:00Z') }
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([entry, exit])

    const res = await app.inject({
      method: 'GET',
      url: '/v1/attendance/summary?employeeId=emp-1&month=3&year=2026',
    })

    expect(res.statusCode).toBe(200)
    const data = res.json().data
    expect(data.employeeId).toBe('emp-1')
    expect(data.month).toBe(3)
    expect(data.year).toBe(2026)
    expect(data.totalRecords).toBe(2)
    expect(data.daysPresent).toBeGreaterThanOrEqual(1)
    expect(data.totalHours).toBeGreaterThan(0)
  })

  it('should return 400 when summary params are missing', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/attendance/summary' })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('obrigatórios')
  })

  it('should return 400 for invalid month in summary', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/attendance/summary?employeeId=emp-1&month=13&year=2026',
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('Mês inválido')
  })

  it('should return 400 for invalid year in summary', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/attendance/summary?employeeId=emp-1&month=3&year=1900',
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('Ano inválido')
  })
})

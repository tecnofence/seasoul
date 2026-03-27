import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

const mockDecimal = (value: number): any => ({
  dividedBy: vi.fn((d: any) => mockDecimal(value / (d?.value ?? d))),
  times: vi.fn((d: any) => mockDecimal(value * (d?.value ?? d))),
  plus: vi.fn((d: any) => mockDecimal(value + (d?.value ?? d))),
  minus: vi.fn((d: any) => mockDecimal(value - (d?.value ?? d))),
  toDecimalPlaces: vi.fn(() => mockDecimal(value)),
  isNegative: vi.fn(() => value < 0),
  value,
  toString: () => String(value),
})

function MockDecimalConstructor(val: any): any {
  return mockDecimal(Number(val))
}
MockDecimalConstructor.max = vi.fn((...args: any[]) => {
  const values = args.map((a: any) => a?.value ?? Number(a))
  return mockDecimal(Math.max(...values))
})

vi.mock('@prisma/client/runtime/library', () => ({
  Decimal: MockDecimalConstructor,
}))

import payrollRoutes from '../index.js'

const mockPrisma = {
  payroll: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  employee: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  attendanceRecord: {
    findMany: vi.fn(),
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

describe('Payroll API — /v1/payroll', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(payrollRoutes, { prefix: '/v1/payroll' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — Listar folhas de salario ──

  it('should list payroll entries with pagination (200)', async () => {
    const payrolls = [
      { id: 'pay-1', employeeId: 'emp-1', month: 3, year: 2026, processed: false, employee: { id: 'emp-1', name: 'Joao' } },
    ]
    mockPrisma.payroll.findMany.mockResolvedValue(payrolls)
    mockPrisma.payroll.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/payroll?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
  })

  it('should filter payroll by month, year, and resortId', async () => {
    mockPrisma.payroll.findMany.mockResolvedValue([])
    mockPrisma.payroll.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/payroll?page=1&limit=10&month=3&year=2026&resortId=r1',
    })

    expect(res.statusCode).toBe(200)
  })

  it('should filter payroll by processed status', async () => {
    mockPrisma.payroll.findMany.mockResolvedValue([])
    mockPrisma.payroll.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/payroll?page=1&limit=10&processed=false',
    })

    expect(res.statusCode).toBe(200)
  })

  // ── POST /process — Calcular salario de um colaborador ──

  it('should process payroll for an employee (201)', async () => {
    const employee = { id: 'emp-1', name: 'Joao', baseSalary: mockDecimal(200000) }
    mockPrisma.employee.findUnique
      .mockResolvedValueOnce(employee) // findUnique in calculatePayroll
    mockPrisma.payroll.findUnique.mockResolvedValue(null) // no existing payroll
    mockPrisma.attendanceRecord.findMany.mockResolvedValue([
      { type: 'ENTRY', validGps: true, createdAt: new Date('2026-03-15T08:00:00Z') },
      { type: 'EXIT', validGps: true, createdAt: new Date('2026-03-15T17:00:00Z') },
    ])
    mockPrisma.payroll.create.mockResolvedValue({
      id: 'pay-new',
      employeeId: 'emp-1',
      month: 3,
      year: 2026,
      baseSalary: 200000,
      netSalary: 180000,
      employee: { id: 'emp-1', name: 'Joao', nif: '123', department: 'KITCHEN' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/payroll/process',
      payload: { employeeId: 'cm1234567890abcdefghijklm', month: 3, year: 2026 },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Salário calculado')
  })

  it('should return 400 when process body is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/payroll/process',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('should return 403 for unauthorized user on process', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(payrollRoutes, { prefix: '/v1/payroll' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/payroll/process',
      payload: { employeeId: 'cm1234567890abcdefghijklm', month: 3, year: 2026 },
    })

    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('Sem permissão')
    await staffApp.close()
  })

  // ── POST /batch — Processar salarios em lote ──

  it('should batch process payroll for a resort', async () => {
    mockPrisma.employee.findMany.mockResolvedValue([{ id: 'emp-1' }, { id: 'emp-2' }])

    // For emp-1
    mockPrisma.employee.findUnique
      .mockResolvedValueOnce({ id: 'emp-1', baseSalary: mockDecimal(200000) })
    mockPrisma.payroll.findUnique.mockResolvedValueOnce(null)
    mockPrisma.attendanceRecord.findMany.mockResolvedValueOnce([])
    mockPrisma.payroll.create.mockResolvedValueOnce({
      id: 'pay-1', employeeId: 'emp-1', employee: { id: 'emp-1', name: 'Joao' },
    })

    // For emp-2
    mockPrisma.employee.findUnique
      .mockResolvedValueOnce({ id: 'emp-2', baseSalary: mockDecimal(180000) })
    mockPrisma.payroll.findUnique.mockResolvedValueOnce(null)
    mockPrisma.attendanceRecord.findMany.mockResolvedValueOnce([])
    mockPrisma.payroll.create.mockResolvedValueOnce({
      id: 'pay-2', employeeId: 'emp-2', employee: { id: 'emp-2', name: 'Maria' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/payroll/batch',
      payload: { resortId: 'cm1234567890abcdefghijklm', month: 3, year: 2026 },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data.processed).toBe(2)
    expect(body.data.errors).toHaveLength(0)
  })

  it('should return 400 when batch body is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/payroll/batch',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('should return 403 for unauthorized user on batch', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(payrollRoutes, { prefix: '/v1/payroll' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/payroll/batch',
      payload: { resortId: 'cm1234567890abcdefghijklm', month: 3, year: 2026 },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  // ── PATCH /:id/approve — Aprovar folha de salario ──

  it('should approve a payroll entry (200)', async () => {
    mockPrisma.payroll.findUnique.mockResolvedValue({ id: 'pay-1', processed: false })
    mockPrisma.payroll.update.mockResolvedValue({
      id: 'pay-1',
      processed: true,
      processedAt: new Date(),
      employee: { id: 'emp-1', name: 'Joao', department: 'KITCHEN' },
    })

    const res = await app.inject({ method: 'PATCH', url: '/v1/payroll/pay-1/approve' })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Salário aprovado e processado')
  })

  it('should return 404 when approving non-existent payroll', async () => {
    mockPrisma.payroll.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'PATCH', url: '/v1/payroll/nonexistent/approve' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Folha de salário não encontrada')
  })

  it('should return 400 when payroll is already processed', async () => {
    mockPrisma.payroll.findUnique.mockResolvedValue({ id: 'pay-1', processed: true })

    const res = await app.inject({ method: 'PATCH', url: '/v1/payroll/pay-1/approve' })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Salário já processado')
  })

  it('should return 403 for HR_MANAGER on approve (only SUPER_ADMIN and RESORT_MANAGER)', async () => {
    const hrApp = buildApp({ ...superAdminUser, id: 'user-3', role: 'HR_MANAGER' })
    await hrApp.register(payrollRoutes, { prefix: '/v1/payroll' })
    await hrApp.ready()

    const res = await hrApp.inject({ method: 'PATCH', url: '/v1/payroll/pay-1/approve' })

    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('Sem permissão para aprovar salários')
    await hrApp.close()
  })
})

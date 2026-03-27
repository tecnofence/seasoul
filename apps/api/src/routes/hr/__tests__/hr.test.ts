import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import hrRoutes from '../index.js'

const mockPrisma = {
  employee: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  shift: {
    create: vi.fn(),
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

describe('HR API — /v1/hr', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(hrRoutes, { prefix: '/v1/hr' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — Listar colaboradores ──

  it('should list employees with pagination (200)', async () => {
    const employees = [
      { id: 'emp-1', name: 'Joao Silva', department: 'KITCHEN', resort: { id: 'r1', name: 'Cabo Ledo' } },
    ]
    mockPrisma.employee.findMany.mockResolvedValue(employees)
    mockPrisma.employee.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/hr?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
  })

  it('should filter employees by resortId, department, active, and search', async () => {
    mockPrisma.employee.findMany.mockResolvedValue([])
    mockPrisma.employee.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/hr?page=1&limit=10&resortId=r1&department=KITCHEN&active=true&search=Joao',
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.employee.findMany).toHaveBeenCalled()
  })

  // ── GET /:id — Obter colaborador ──

  it('should return an employee by ID (200)', async () => {
    const employee = {
      id: 'emp-1',
      name: 'Joao Silva',
      resort: { id: 'r1', name: 'Cabo Ledo' },
      shifts: [],
    }
    mockPrisma.employee.findUnique.mockResolvedValue(employee)

    const res = await app.inject({ method: 'GET', url: '/v1/hr/emp-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('emp-1')
  })

  it('should return 404 when employee not found', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/hr/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Colaborador não encontrado')
  })

  // ── POST / — Criar colaborador ──

  it('should create an employee (201)', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue(null) // no duplicate NIF
    mockPrisma.employee.create.mockResolvedValue({
      id: 'emp-new',
      name: 'Maria Santos',
      resort: { id: 'r1', name: 'Cabo Ledo' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/hr',
      payload: {
        name: 'Maria Santos',
        nif: '111222333',
        role: 'RECEPTIONIST',
        department: 'RECEPTION',
        resortId: 'cm1234567890abcdefghijklm',
        baseSalary: 150000,
        startDate: '2026-01-15T00:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Colaborador criado com sucesso')
  })

  it('should return 400 when create body is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/hr',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('should return 409 when NIF is duplicate', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-existing', nif: '111222333' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/hr',
      payload: {
        name: 'Duplicate NIF',
        nif: '111222333',
        role: 'RECEPTIONIST',
        department: 'RECEPTION',
        resortId: 'cm1234567890abcdefghijklm',
        baseSalary: 150000,
        startDate: '2026-01-15T00:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe('NIF já registado')
  })

  it('should return 403 for unauthorized user on create', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(hrRoutes, { prefix: '/v1/hr' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/hr',
      payload: {
        name: 'Test',
        nif: '999888777',
        role: 'RECEPTIONIST',
        department: 'RECEPTION',
        resortId: 'cm1234567890abcdefghijklm',
        baseSalary: 150000,
        startDate: '2026-01-15T00:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('Sem permissão')
    await staffApp.close()
  })

  // ── PUT /:id — Atualizar colaborador ──

  it('should update an employee (200)', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', name: 'Joao Silva' })
    mockPrisma.employee.update.mockResolvedValue({
      id: 'emp-1',
      name: 'Joao Silva Updated',
      resort: { id: 'r1', name: 'Cabo Ledo' },
    })

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/hr/emp-1',
      payload: { name: 'Joao Silva Updated' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Colaborador atualizado')
  })

  it('should return 404 when updating non-existent employee', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/hr/nonexistent',
      payload: { name: 'Updated' },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── POST /shifts — Criar turno ──

  it('should create a shift (201)', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue({ id: 'emp-1', name: 'Joao' })
    mockPrisma.shift.create.mockResolvedValue({
      id: 'shift-1',
      employeeId: 'emp-1',
      date: '2026-03-27',
      department: 'KITCHEN',
    })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/hr/shifts',
      payload: {
        employeeId: 'cm1234567890abcdefghijklm',
        date: '2026-03-27T00:00:00.000Z',
        startTime: '2026-03-27T08:00:00.000Z',
        endTime: '2026-03-27T16:00:00.000Z',
        department: 'KITCHEN',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Turno criado')
  })

  it('should return 404 when creating shift for non-existent employee', async () => {
    mockPrisma.employee.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/hr/shifts',
      payload: {
        employeeId: 'cm0000000000000000000000n',
        date: '2026-03-27T00:00:00.000Z',
        startTime: '2026-03-27T08:00:00.000Z',
        endTime: '2026-03-27T16:00:00.000Z',
        department: 'KITCHEN',
      },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Colaborador não encontrado')
  })

  it('should return 403 for STAFF role on shift creation', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(hrRoutes, { prefix: '/v1/hr' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/hr/shifts',
      payload: {
        employeeId: 'cm1234567890abcdefghijklm',
        date: '2026-03-27T00:00:00.000Z',
        startTime: '2026-03-27T08:00:00.000Z',
        endTime: '2026-03-27T16:00:00.000Z',
        department: 'KITCHEN',
      },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })
})

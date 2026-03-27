import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import legalRoutes from '../index.js'

const mockPrisma = {
  legalCase: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

const superAdminUser = {
  id: 'user-1', email: 'admin@engeris.ao', role: 'SUPER_ADMIN',
  tenantId: 'tenant-1', type: 'staff' as const,
}

const regularUser = {
  id: 'user-2', email: 'staff@engeris.ao', role: 'STAFF',
  tenantId: 'tenant-1', type: 'staff' as const,
}

const noTenantUser = {
  id: 'user-3', email: 'noTenant@engeris.ao', role: 'SUPER_ADMIN',
  tenantId: undefined, type: 'staff' as const,
}

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Legal API — /v1/legal', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(legalRoutes, { prefix: '/v1/legal' })
    await app.ready()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('GET / — should list legal cases with pagination (200)', async () => {
    const cases = [{ id: 'case-1', title: 'Processo Civil', caseType: 'CIVIL' }]
    mockPrisma.legalCase.findMany.mockResolvedValue(cases)
    mockPrisma.legalCase.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/legal?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET / — should filter by status, caseType, and priority', async () => {
    mockPrisma.legalCase.findMany.mockResolvedValue([])
    mockPrisma.legalCase.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/legal?status=OPEN&caseType=LABOR&priority=HIGH' })

    expect(mockPrisma.legalCase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'OPEN', caseType: 'LABOR', priority: 'HIGH' }),
      })
    )
  })

  it('GET /:id — should return a legal case by ID (200)', async () => {
    const legalCase = { id: 'case-1', title: 'Processo Civil', tenantId: 'tenant-1' }
    mockPrisma.legalCase.findFirst.mockResolvedValue(legalCase)

    const res = await app.inject({ method: 'GET', url: '/v1/legal/case-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('case-1')
  })

  it('GET /:id — should return 404 for non-existent case', async () => {
    mockPrisma.legalCase.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/legal/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Processo não encontrado')
  })

  it('POST / — should create a legal case (201)', async () => {
    const created = { id: 'case-2', title: 'Contrato Comercial', tenantId: 'tenant-1' }
    mockPrisma.legalCase.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/legal',
      payload: {
        title: 'Contrato Comercial',
        caseType: 'COMMERCIAL',
        clientName: 'Empresa ABC',
        lawyer: 'Dr. Silva',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Processo criado com sucesso')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/legal',
      payload: { title: 'Incomplete Case' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('POST / — should return 400 when tenantId is missing', async () => {
    const appNoTenant = buildApp(noTenantUser)
    await appNoTenant.register(legalRoutes, { prefix: '/v1/legal' })
    await appNoTenant.ready()

    const res = await appNoTenant.inject({
      method: 'POST',
      url: '/v1/legal',
      payload: {
        title: 'Test', caseType: 'CIVIL', clientName: 'C', lawyer: 'L',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Tenant não definido')
    await appNoTenant.close()
  })

  it('PATCH /:id — should update a legal case (200)', async () => {
    const existing = { id: 'case-1', tenantId: 'tenant-1', title: 'Old Title' }
    const updated = { ...existing, title: 'New Title' }
    mockPrisma.legalCase.findFirst.mockResolvedValue(existing)
    mockPrisma.legalCase.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/legal/case-1',
      payload: { title: 'New Title' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.title).toBe('New Title')
    expect(res.json().message).toBe('Processo atualizado com sucesso')
  })

  it('PATCH /:id — should return 404 for non-existent case', async () => {
    mockPrisma.legalCase.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/legal/nonexistent',
      payload: { title: 'Test' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Processo não encontrado')
  })

  it('PATCH /:id/status — should update case status (200)', async () => {
    const existing = { id: 'case-1', tenantId: 'tenant-1', status: 'OPEN' }
    const updated = { ...existing, status: 'IN_PROGRESS' }
    mockPrisma.legalCase.findFirst.mockResolvedValue(existing)
    mockPrisma.legalCase.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/legal/case-1/status',
      payload: { status: 'IN_PROGRESS' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('IN_PROGRESS')
  })

  it('PATCH /:id/status — should return 404 for non-existent case', async () => {
    mockPrisma.legalCase.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/legal/nonexistent/status',
      payload: { status: 'CLOSED' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Processo não encontrado')
  })

  it('GET /upcoming-hearings — should return upcoming hearings (200)', async () => {
    const upcoming = [{ id: 'case-1', nextHearing: new Date(), status: 'OPEN' }]
    mockPrisma.legalCase.findMany.mockResolvedValue(upcoming)

    const res = await app.inject({ method: 'GET', url: '/v1/legal/upcoming-hearings' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('GET / — tenant isolation: uses tenantId in query', async () => {
    mockPrisma.legalCase.findMany.mockResolvedValue([])
    mockPrisma.legalCase.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/legal' })

    expect(mockPrisma.legalCase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      })
    )
  })

  it('PATCH /:id/status — should include outcome when provided', async () => {
    const existing = { id: 'case-1', tenantId: 'tenant-1', status: 'HEARING' }
    const updated = { ...existing, status: 'CLOSED', outcome: 'Favorável' }
    mockPrisma.legalCase.findFirst.mockResolvedValue(existing)
    mockPrisma.legalCase.update.mockResolvedValue(updated)

    await app.inject({
      method: 'PATCH',
      url: '/v1/legal/case-1/status',
      payload: { status: 'CLOSED', outcome: 'Favorável' },
    })

    expect(mockPrisma.legalCase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CLOSED', outcome: 'Favorável' }),
      })
    )
  })
})

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import consultingRoutes from '../index.js'

const mockPrisma = {
  consultingProject: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  timeLog: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Consulting API — /v1/consulting', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(consultingRoutes, { prefix: '/v1/consulting' })
    await app.ready()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('GET / — should list consulting projects with pagination (200)', async () => {
    const projects = [{ id: 'proj-1', title: 'ERP Audit', clientName: 'Client A' }]
    mockPrisma.consultingProject.findMany.mockResolvedValue(projects)
    mockPrisma.consultingProject.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/consulting?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET / — should filter by status and projectType', async () => {
    mockPrisma.consultingProject.findMany.mockResolvedValue([])
    mockPrisma.consultingProject.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/consulting?status=ACTIVE&projectType=TECHNOLOGY' })

    expect(mockPrisma.consultingProject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE', projectType: 'TECHNOLOGY' }),
      })
    )
  })

  it('GET /:id — should return a project with hour summaries (200)', async () => {
    const project = { id: 'proj-1', title: 'ERP Audit', tenantId: 'tenant-1', timeLogs: [] }
    mockPrisma.consultingProject.findFirst.mockResolvedValue(project)
    mockPrisma.timeLog.aggregate.mockResolvedValue({ _sum: { hours: 40 } })

    const res = await app.inject({ method: 'GET', url: '/v1/consulting/proj-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('proj-1')
    expect(res.json().data.totalHours).toBeDefined()
  })

  it('GET /:id — should return 404 for non-existent project', async () => {
    mockPrisma.consultingProject.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/consulting/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Projecto não encontrado')
  })

  it('POST / — should create a consulting project (201)', async () => {
    const created = { id: 'proj-2', title: 'IT Strategy', tenantId: 'tenant-1' }
    mockPrisma.consultingProject.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/consulting',
      payload: {
        title: 'IT Strategy',
        clientName: 'Client B',
        projectType: 'STRATEGY',
        startDate: '2026-04-01T00:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Projecto criado com sucesso')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/consulting',
      payload: { title: 'Missing Fields' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('POST / — should return 400 when tenantId is missing', async () => {
    const appNoTenant = buildApp(noTenantUser)
    await appNoTenant.register(consultingRoutes, { prefix: '/v1/consulting' })
    await appNoTenant.ready()

    const res = await appNoTenant.inject({
      method: 'POST',
      url: '/v1/consulting',
      payload: {
        title: 'Test', clientName: 'C', projectType: 'OTHER',
        startDate: '2026-04-01T00:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Tenant não definido')
    await appNoTenant.close()
  })

  it('PATCH /:id/status — should update project status (200)', async () => {
    const existing = { id: 'proj-1', tenantId: 'tenant-1', status: 'ACTIVE' }
    const updated = { ...existing, status: 'ON_HOLD' }
    mockPrisma.consultingProject.findFirst.mockResolvedValue(existing)
    mockPrisma.consultingProject.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/consulting/proj-1/status',
      payload: { status: 'ON_HOLD' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('ON_HOLD')
  })

  it('PATCH /:id/status — should return 404 for non-existent project', async () => {
    mockPrisma.consultingProject.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/consulting/nonexistent/status',
      payload: { status: 'COMPLETED' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Projecto não encontrado')
  })

  // ── TIME LOGS ──

  it('GET /time-logs — should list time logs with pagination (200)', async () => {
    const logs = [{ id: 'log-1', hours: 8, projectId: 'proj-1' }]
    mockPrisma.timeLog.findMany.mockResolvedValue(logs)
    mockPrisma.timeLog.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/consulting/time-logs?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('POST /time-logs — should create a time log (201)', async () => {
    const project = { id: 'proj-1', tenantId: 'tenant-1' }
    const timeLog = { id: 'log-1', projectId: 'proj-1', hours: 4, project: { id: 'proj-1', title: 'ERP' } }
    mockPrisma.consultingProject.findFirst.mockResolvedValue(project)
    mockPrisma.timeLog.create.mockResolvedValue(timeLog)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/consulting/time-logs',
      payload: {
        projectId: 'proj-1',
        userName: 'João Silva',
        date: '2026-03-20T00:00:00.000Z',
        hours: 4,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Registo de tempo criado com sucesso')
  })

  it('POST /time-logs — should return 404 when project does not belong to tenant', async () => {
    mockPrisma.consultingProject.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/consulting/time-logs',
      payload: {
        projectId: 'proj-other',
        userName: 'João',
        date: '2026-03-20T00:00:00.000Z',
        hours: 4,
      },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Projecto não encontrado neste tenant')
  })

  it('GET /summary — should return dashboard summary (200)', async () => {
    mockPrisma.consultingProject.count.mockResolvedValue(5)
    mockPrisma.timeLog.aggregate.mockResolvedValue({ _sum: { hours: 120 } })
    mockPrisma.timeLog.groupBy.mockResolvedValue([])

    const res = await app.inject({ method: 'GET', url: '/v1/consulting/summary' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.totalProjects).toBe(5)
  })

  it('GET / — tenant isolation: uses tenantId in query', async () => {
    mockPrisma.consultingProject.findMany.mockResolvedValue([])
    mockPrisma.consultingProject.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/consulting' })

    expect(mockPrisma.consultingProject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      })
    )
  })
})

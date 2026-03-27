import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import engineeringRoutes from '../index.js'

// ── Mock Prisma ──────────────────────────────────
const mockPrisma = {
  engineeringProject: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  constructionWork: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  budgetItem: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  workMeasurement: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

// ── Mock Users ───────────────────────────────────
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

// ── Helpers ──────────────────────────────────────
function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

// ── TESTES ───────────────────────────────────────
describe('Engineering API — /v1/engineering', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(engineeringRoutes, { prefix: '/v1/engineering' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ═══════════════════════════════════════════
  // PROJETOS
  // ═══════════════════════════════════════════

  describe('GET /v1/engineering', () => {
    it('deve listar projetos com paginacao', async () => {
      const projects = [
        { id: 'p1', name: 'Projeto A', _count: { works: 2, budgetItems: 3, measurements: 1 } },
      ]
      mockPrisma.engineeringProject.findMany.mockResolvedValue(projects)
      mockPrisma.engineeringProject.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/engineering?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.totalPages).toBe(1)
    })

    it('deve filtrar projetos por status', async () => {
      mockPrisma.engineeringProject.findMany.mockResolvedValue([])
      mockPrisma.engineeringProject.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/engineering?status=IN_PROGRESS' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.engineeringProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'IN_PROGRESS' }) }),
      )
    })

    it('deve filtrar projetos por projectType', async () => {
      mockPrisma.engineeringProject.findMany.mockResolvedValue([])
      mockPrisma.engineeringProject.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/engineering?projectType=CONSTRUCTION' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.engineeringProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ projectType: 'CONSTRUCTION' }) }),
      )
    })
  })

  describe('GET /v1/engineering/:id', () => {
    it('deve retornar projeto por ID', async () => {
      const project = {
        id: 'p1', name: 'Projeto A', tenantId: 'tenant-1',
        _count: { works: 0, budgetItems: 0, measurements: 0 },
        works: [], budgetItems: [], measurements: [],
      }
      mockPrisma.engineeringProject.findFirst.mockResolvedValue(project)

      const res = await app.inject({ method: 'GET', url: '/v1/engineering/p1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('p1')
    })

    it('deve retornar 404 se projeto nao existe', async () => {
      mockPrisma.engineeringProject.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'GET', url: '/v1/engineering/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /v1/engineering', () => {
    it('deve criar projeto com sucesso', async () => {
      const created = {
        id: 'p1', name: 'Projeto A', clientName: 'Cliente A',
        _count: { works: 0, budgetItems: 0, measurements: 0 },
      }
      mockPrisma.engineeringProject.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/engineering',
        payload: {
          name: 'Projeto A',
          clientName: 'Cliente A',
          projectType: 'CONSTRUCTION',
        },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.id).toBe('p1')
    })

    it('deve retornar 400 para dados invalidos (nome em falta)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/engineering',
        payload: { projectType: 'CONSTRUCTION' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('deve retornar 400 para projectType invalido', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/engineering',
        payload: { name: 'P1', clientName: 'C1', projectType: 'INVALID_TYPE' },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /v1/engineering/:id/status', () => {
    it('deve atualizar estado do projeto', async () => {
      const existing = { id: 'p1', status: 'PLANNING', tenantId: 'tenant-1' }
      const updated = { ...existing, status: 'COMPLETED', actualEnd: new Date() }
      mockPrisma.engineeringProject.findFirst.mockResolvedValue(existing)
      mockPrisma.engineeringProject.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/engineering/p1/status',
        payload: { status: 'COMPLETED' },
      })

      expect(res.statusCode).toBe(200)
    })

    it('deve retornar 404 para projeto inexistente', async () => {
      mockPrisma.engineeringProject.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/engineering/inexistente/status',
        payload: { status: 'IN_PROGRESS' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // OBRAS (CONSTRUCTION WORKS)
  // ═══════════════════════════════════════════

  describe('GET /v1/engineering/works', () => {
    it('deve listar obras por projeto com paginacao', async () => {
      const works = [{ id: 'w1', name: 'Obra A', project: { id: 'p1', name: 'Proj', code: 'C1' } }]
      mockPrisma.constructionWork.findMany.mockResolvedValue(works)
      mockPrisma.constructionWork.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/engineering/works?projectId=p1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().total).toBe(1)
    })
  })

  describe('POST /v1/engineering/works', () => {
    it('deve criar obra com sucesso', async () => {
      const project = { id: 'p1', tenantId: 'tenant-1' }
      const created = { id: 'w1', name: 'Obra A', projectId: 'p1', project: { id: 'p1', name: 'Proj', code: 'C1' } }
      mockPrisma.engineeringProject.findFirst.mockResolvedValue(project)
      mockPrisma.constructionWork.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/engineering/works',
        payload: { projectId: 'p1', name: 'Obra A' },
      })

      expect(res.statusCode).toBe(201)
    })

    it('deve retornar 404 se projeto nao pertence ao tenant', async () => {
      mockPrisma.engineeringProject.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/engineering/works',
        payload: { projectId: 'p-wrong', name: 'Obra A' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('PATCH /v1/engineering/works/:id', () => {
    it('deve atualizar obra existente', async () => {
      const existing = { id: 'w1', tenantId: 'tenant-1', progress: 0 }
      const updated = { ...existing, progress: 50, project: { id: 'p1', name: 'Proj', code: 'C1' } }
      mockPrisma.constructionWork.findFirst.mockResolvedValue(existing)
      mockPrisma.constructionWork.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/engineering/works/w1',
        payload: { progress: 50 },
      })

      expect(res.statusCode).toBe(200)
    })

    it('deve retornar 404 para obra inexistente', async () => {
      mockPrisma.constructionWork.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/engineering/works/inexistente',
        payload: { progress: 50 },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // ORCAMENTOS (BUDGET ITEMS)
  // ═══════════════════════════════════════════

  describe('DELETE /v1/engineering/budgets/:id', () => {
    it('deve remover item de orcamento', async () => {
      const existing = { id: 'b1', tenantId: 'tenant-1' }
      mockPrisma.budgetItem.findFirst.mockResolvedValue(existing)
      mockPrisma.budgetItem.delete.mockResolvedValue(existing)

      const res = await app.inject({ method: 'DELETE', url: '/v1/engineering/budgets/b1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().message).toContain('removido')
    })

    it('deve retornar 404 para item inexistente', async () => {
      mockPrisma.budgetItem.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'DELETE', url: '/v1/engineering/budgets/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // AUTOS DE MEDICAO (MEASUREMENTS)
  // ═══════════════════════════════════════════

  describe('GET /v1/engineering/measurements/:id', () => {
    it('deve retornar auto de medicao por ID', async () => {
      const measurement = { id: 'm1', number: 1, tenantId: 'tenant-1', project: { id: 'p1', name: 'Proj', code: 'C1', clientName: 'Cliente A' } }
      mockPrisma.workMeasurement.findFirst.mockResolvedValue(measurement)

      const res = await app.inject({ method: 'GET', url: '/v1/engineering/measurements/m1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('m1')
    })

    it('deve retornar 404 para auto de medicao inexistente', async () => {
      mockPrisma.workMeasurement.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'GET', url: '/v1/engineering/measurements/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('PATCH /v1/engineering/measurements/:id/status', () => {
    it('deve aprovar auto de medicao', async () => {
      const existing = { id: 'm1', status: 'SUBMITTED', tenantId: 'tenant-1' }
      const updated = { ...existing, status: 'APPROVED', approvedBy: 'user-1', project: { id: 'p1', name: 'Proj', code: 'C1' } }
      mockPrisma.workMeasurement.findFirst.mockResolvedValue(existing)
      mockPrisma.workMeasurement.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/engineering/measurements/m1/status',
        payload: { status: 'APPROVED' },
      })

      expect(res.statusCode).toBe(200)
    })

    it('deve retornar 404 para auto de medicao inexistente ao atualizar status', async () => {
      mockPrisma.workMeasurement.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/engineering/measurements/inexistente/status',
        payload: { status: 'APPROVED' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // TENANT ISOLATION
  // ═══════════════════════════════════════════

  describe('Tenant isolation', () => {
    it('deve filtrar projetos pelo tenantId do utilizador', async () => {
      mockPrisma.engineeringProject.findMany.mockResolvedValue([])
      mockPrisma.engineeringProject.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/engineering' })

      expect(mockPrisma.engineeringProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })

    it('deve filtrar obras pelo tenantId do utilizador', async () => {
      mockPrisma.constructionWork.findMany.mockResolvedValue([])
      mockPrisma.constructionWork.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/engineering/works?projectId=p1' })

      expect(mockPrisma.constructionWork.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })
  })
})

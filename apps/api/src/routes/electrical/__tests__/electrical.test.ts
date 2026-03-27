import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import electricalRoutes from '../index.js'

// ── Mock Prisma ──────────────────────────────────
const mockPrisma = {
  electricalProject: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  electricalInspection: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  electricalCertification: {
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

const noTenantUser = {
  id: 'user-3',
  email: 'noorg@engeris.ao',
  role: 'STAFF',
  tenantId: undefined as string | undefined,
  type: 'staff' as const,
}

// ── Helpers ──────────────────────────────────────
function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

// ── TESTES ───────────────────────────────────────
describe('Electrical API — /v1/electrical', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(electricalRoutes, { prefix: '/v1/electrical' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ═══════════════════════════════════════════
  // PROJETOS ELETRICOS
  // ═══════════════════════════════════════════

  describe('GET /v1/electrical', () => {
    it('deve listar projetos eletricos com paginacao', async () => {
      const projects = [
        { id: 'p1', name: 'Projeto Eletrico A', _count: { inspections: 2, certifications: 1 } },
      ]
      mockPrisma.electricalProject.findMany.mockResolvedValue(projects)
      mockPrisma.electricalProject.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.totalPages).toBe(1)
    })

    it('deve filtrar projetos por status', async () => {
      mockPrisma.electricalProject.findMany.mockResolvedValue([])
      mockPrisma.electricalProject.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical?status=IN_PROGRESS' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.electricalProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'IN_PROGRESS' }) }),
      )
    })

    it('deve filtrar projetos por projectType', async () => {
      mockPrisma.electricalProject.findMany.mockResolvedValue([])
      mockPrisma.electricalProject.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical?projectType=MAINTENANCE' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.electricalProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ projectType: 'MAINTENANCE' }) }),
      )
    })
  })

  describe('GET /v1/electrical/:id', () => {
    it('deve retornar projeto por ID', async () => {
      const project = { id: 'p1', name: 'Proj A', tenantId: 'tenant-1', _count: { inspections: 0, certifications: 0 } }
      mockPrisma.electricalProject.findFirst.mockResolvedValue(project)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical/p1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('p1')
    })

    it('deve retornar 404 se projeto nao existe', async () => {
      mockPrisma.electricalProject.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /v1/electrical', () => {
    it('deve criar projeto eletrico com sucesso', async () => {
      const created = { id: 'p1', name: 'Projeto A', projectType: 'NEW_INSTALLATION' }
      mockPrisma.electricalProject.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/electrical',
        payload: {
          name: 'Projeto A',
          clientName: 'Cliente A',
          projectType: 'NEW_INSTALLATION',
        },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.id).toBe('p1')
    })

    it('deve retornar 400 para dados invalidos (nome em falta)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/electrical',
        payload: { projectType: 'NEW_INSTALLATION' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('deve retornar 400 se utilizador sem tenant', async () => {
      const noTenantApp = buildApp(noTenantUser)
      await noTenantApp.register(electricalRoutes, { prefix: '/v1/electrical' })
      await noTenantApp.ready()

      const res = await noTenantApp.inject({
        method: 'POST',
        url: '/v1/electrical',
        payload: {
          name: 'Projeto A',
          clientName: 'Cliente A',
          projectType: 'NEW_INSTALLATION',
        },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toContain('Tenant')
      await noTenantApp.close()
    })
  })

  describe('PATCH /v1/electrical/:id/status', () => {
    it('deve atualizar estado do projeto', async () => {
      const existing = { id: 'p1', status: 'PLANNING', tenantId: 'tenant-1' }
      const updated = { ...existing, status: 'COMPLETED' }
      mockPrisma.electricalProject.findFirst.mockResolvedValue(existing)
      mockPrisma.electricalProject.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/electrical/p1/status',
        payload: { status: 'COMPLETED' },
      })

      expect(res.statusCode).toBe(200)
    })

    it('deve retornar 404 para projeto inexistente', async () => {
      mockPrisma.electricalProject.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/electrical/inexistente/status',
        payload: { status: 'IN_PROGRESS' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // INSPECOES ELETRICAS
  // ═══════════════════════════════════════════

  describe('GET /v1/electrical/inspections', () => {
    it('deve listar inspecoes com paginacao', async () => {
      mockPrisma.electricalInspection.findMany.mockResolvedValue([{ id: 'ins1', inspectionType: 'INITIAL' }])
      mockPrisma.electricalInspection.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical/inspections?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
    })
  })

  describe('GET /v1/electrical/inspections/:id', () => {
    it('deve retornar inspecao por ID', async () => {
      const inspection = { id: 'ins1', inspectionType: 'INITIAL', tenantId: 'tenant-1', project: { id: 'p1', name: 'Proj', clientName: 'C1', status: 'ACTIVE' } }
      mockPrisma.electricalInspection.findFirst.mockResolvedValue(inspection)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical/inspections/ins1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('ins1')
    })

    it('deve retornar 404 para inspecao inexistente', async () => {
      mockPrisma.electricalInspection.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical/inspections/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /v1/electrical/inspections', () => {
    it('deve criar inspecao com sucesso', async () => {
      const created = { id: 'ins1', inspectionType: 'INITIAL', address: 'Rua A', clientName: 'Cliente A' }
      mockPrisma.electricalInspection.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/electrical/inspections',
        payload: {
          address: 'Rua A',
          clientName: 'Cliente A',
          inspectionType: 'INITIAL',
        },
      })

      expect(res.statusCode).toBe(201)
    })

    it('deve retornar 400 para dados de inspecao invalidos', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/electrical/inspections',
        payload: { inspectionType: 'INITIAL' },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /v1/electrical/inspections/:id/complete', () => {
    it('deve concluir inspecao com sucesso', async () => {
      const existing = { id: 'ins1', status: 'SCHEDULED', tenantId: 'tenant-1' }
      const updated = { ...existing, status: 'COMPLETED', result: 'APPROVED' }
      mockPrisma.electricalInspection.findFirst.mockResolvedValue(existing)
      mockPrisma.electricalInspection.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/electrical/inspections/ins1/complete',
        payload: { result: 'APPROVED' },
      })

      expect(res.statusCode).toBe(200)
    })

    it('deve retornar 400 se inspecao ja concluida', async () => {
      const existing = { id: 'ins1', status: 'COMPLETED', tenantId: 'tenant-1' }
      mockPrisma.electricalInspection.findFirst.mockResolvedValue(existing)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/electrical/inspections/ins1/complete',
        payload: { result: 'APPROVED' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('deve retornar 404 para inspecao inexistente', async () => {
      mockPrisma.electricalInspection.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/electrical/inspections/inexistente/complete',
        payload: { result: 'APPROVED' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // CERTIFICACOES
  // ═══════════════════════════════════════════

  describe('GET /v1/electrical/certifications', () => {
    it('deve listar certificacoes com paginacao', async () => {
      mockPrisma.electricalCertification.findMany.mockResolvedValue([{ id: 'cert1', certType: 'INSTALLATION_CERT' }])
      mockPrisma.electricalCertification.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical/certifications?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().total).toBe(1)
    })
  })

  describe('GET /v1/electrical/certifications/:id', () => {
    it('deve retornar certificacao por ID', async () => {
      const cert = { id: 'cert1', certType: 'INSTALLATION_CERT', tenantId: 'tenant-1', project: { id: 'p1', name: 'Proj', clientName: 'C1', status: 'ACTIVE' } }
      mockPrisma.electricalCertification.findFirst.mockResolvedValue(cert)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical/certifications/cert1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('cert1')
    })

    it('deve retornar 404 para certificacao inexistente', async () => {
      mockPrisma.electricalCertification.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'GET', url: '/v1/electrical/certifications/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /v1/electrical/certifications', () => {
    it('deve criar certificacao com sucesso', async () => {
      const created = { id: 'cert1', certType: 'INSTALLATION_CERT', clientName: 'Cliente A' }
      mockPrisma.electricalCertification.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/electrical/certifications',
        payload: {
          clientName: 'Cliente A',
          address: 'Rua A',
          certType: 'INSTALLATION_CERT',
        },
      })

      expect(res.statusCode).toBe(201)
    })

    it('deve retornar 400 para certificacao sem dados obrigatorios', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/electrical/certifications',
        payload: { certType: 'INSTALLATION_CERT' },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /v1/electrical/certifications/:id/status', () => {
    it('deve atualizar estado da certificacao', async () => {
      const existing = { id: 'cert1', status: 'PENDING', tenantId: 'tenant-1', issuedAt: null }
      const updated = { ...existing, status: 'ISSUED', issuedAt: new Date() }
      mockPrisma.electricalCertification.findFirst.mockResolvedValue(existing)
      mockPrisma.electricalCertification.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/electrical/certifications/cert1/status',
        payload: { status: 'ISSUED' },
      })

      expect(res.statusCode).toBe(200)
    })

    it('deve retornar 404 para certificacao inexistente', async () => {
      mockPrisma.electricalCertification.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/electrical/certifications/inexistente/status',
        payload: { status: 'ISSUED' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // TENANT ISOLATION
  // ═══════════════════════════════════════════

  describe('Tenant isolation', () => {
    it('deve filtrar projetos eletricos pelo tenantId do utilizador', async () => {
      mockPrisma.electricalProject.findMany.mockResolvedValue([])
      mockPrisma.electricalProject.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/electrical' })

      expect(mockPrisma.electricalProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })

    it('deve filtrar inspecoes pelo tenantId do utilizador', async () => {
      mockPrisma.electricalInspection.findMany.mockResolvedValue([])
      mockPrisma.electricalInspection.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/electrical/inspections' })

      expect(mockPrisma.electricalInspection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })
  })
})

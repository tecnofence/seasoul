import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import securityRoutes from '../index.js'

// ── Mock Prisma ──────────────────────────────────
const mockPrisma = {
  securityContract: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  securityInstallation: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  securityIncident: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  securityPatrol: {
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
function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

// ── TESTES ───────────────────────────────────────
describe('Security API — /v1/security', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(securityRoutes, { prefix: '/v1/security' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ═══════════════════════════════════════════
  // CONTRATOS DE SEGURANCA
  // ═══════════════════════════════════════════

  describe('GET /v1/security', () => {
    it('deve listar contratos com paginacao', async () => {
      const contracts = [
        { id: 'c1', clientName: 'Cliente A', contractType: 'MONITORING', status: 'ACTIVE', installations: [] },
      ]
      mockPrisma.securityContract.findMany.mockResolvedValue(contracts)
      mockPrisma.securityContract.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/security?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.page).toBe(1)
      expect(body.totalPages).toBe(1)
    })

    it('deve filtrar contratos por status', async () => {
      mockPrisma.securityContract.findMany.mockResolvedValue([])
      mockPrisma.securityContract.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/security?status=ACTIVE' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.securityContract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) }),
      )
    })

    it('deve filtrar contratos por contractType', async () => {
      mockPrisma.securityContract.findMany.mockResolvedValue([])
      mockPrisma.securityContract.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/security?contractType=CCTV' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.securityContract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ contractType: 'CCTV' }) }),
      )
    })
  })

  describe('GET /v1/security/:id', () => {
    it('deve retornar contrato por ID', async () => {
      const contract = { id: 'c1', clientName: 'Cliente A', tenantId: 'tenant-1', installations: [] }
      mockPrisma.securityContract.findFirst.mockResolvedValue(contract)

      const res = await app.inject({ method: 'GET', url: '/v1/security/c1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('c1')
    })

    it('deve retornar 404 se contrato nao existe', async () => {
      mockPrisma.securityContract.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'GET', url: '/v1/security/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /v1/security', () => {
    it('deve criar contrato com sucesso', async () => {
      const created = { id: 'c1', clientName: 'Cliente A', contractType: 'MONITORING', status: 'DRAFT' }
      mockPrisma.securityContract.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/security',
        payload: {
          clientName: 'Cliente A',
          contractType: 'MONITORING',
          startDate: '2026-01-01T00:00:00.000Z',
          monthlyValue: 50000,
        },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.id).toBe('c1')
    })

    it('deve retornar 400 para dados invalidos (clientName em falta)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/security',
        payload: { contractType: 'MONITORING' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('deve retornar 400 se utilizador sem tenant', async () => {
      const noTenantApp = buildApp(noTenantUser)
      await noTenantApp.register(securityRoutes, { prefix: '/v1/security' })
      await noTenantApp.ready()

      const res = await noTenantApp.inject({
        method: 'POST',
        url: '/v1/security',
        payload: {
          clientName: 'Cliente A',
          contractType: 'MONITORING',
          startDate: '2026-01-01T00:00:00.000Z',
          monthlyValue: 50000,
        },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toContain('tenant')
      await noTenantApp.close()
    })
  })

  describe('PATCH /v1/security/:id', () => {
    it('deve atualizar contrato existente', async () => {
      const existing = { id: 'c1', clientName: 'Cliente A', tenantId: 'tenant-1' }
      const updated = { ...existing, clientName: 'Cliente B' }
      mockPrisma.securityContract.findFirst.mockResolvedValue(existing)
      mockPrisma.securityContract.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/security/c1',
        payload: { clientName: 'Cliente B' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.clientName).toBe('Cliente B')
    })

    it('deve retornar 404 se contrato nao existe ao atualizar', async () => {
      mockPrisma.securityContract.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/security/inexistente',
        payload: { clientName: 'Cliente B' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // INSTALACOES
  // ═══════════════════════════════════════════

  describe('GET /v1/security/installations', () => {
    it('deve listar instalacoes com paginacao', async () => {
      mockPrisma.securityInstallation.findMany.mockResolvedValue([{ id: 'inst1', installationType: 'CCTV' }])
      mockPrisma.securityInstallation.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/security/installations?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().total).toBe(1)
    })
  })

  describe('POST /v1/security/installations', () => {
    it('deve criar instalacao com sucesso', async () => {
      const created = { id: 'inst1', clientName: 'Cliente A', installationType: 'CCTV' }
      mockPrisma.securityInstallation.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/security/installations',
        payload: {
          clientName: 'Cliente A',
          address: 'Rua 1',
          installationType: 'CCTV',
          equipmentList: [{ name: 'Camera HD', qty: 4 }],
        },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.id).toBe('inst1')
    })

    it('deve retornar 400 se dados da instalacao invalidos', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/security/installations',
        payload: { installationType: 'CCTV' },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /v1/security/installations/:id/status', () => {
    it('deve atualizar estado da instalacao', async () => {
      const existing = { id: 'inst1', status: 'PLANNED', tenantId: 'tenant-1' }
      const updated = { ...existing, status: 'COMPLETED', completedDate: new Date() }
      mockPrisma.securityInstallation.findFirst.mockResolvedValue(existing)
      mockPrisma.securityInstallation.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/security/installations/inst1/status',
        payload: { status: 'COMPLETED' },
      })

      expect(res.statusCode).toBe(200)
    })

    it('deve retornar 404 para instalacao inexistente', async () => {
      mockPrisma.securityInstallation.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/security/installations/inexistente/status',
        payload: { status: 'IN_PROGRESS' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // INCIDENTES
  // ═══════════════════════════════════════════

  describe('GET /v1/security/incidents', () => {
    it('deve listar incidentes com paginacao', async () => {
      mockPrisma.securityIncident.findMany.mockResolvedValue([{ id: 'i1', title: 'Intrusion detected' }])
      mockPrisma.securityIncident.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/security/incidents?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
    })
  })

  describe('POST /v1/security/incidents', () => {
    it('deve criar incidente com sucesso', async () => {
      const created = { id: 'i1', title: 'Intrusion', type: 'INTRUSION', severity: 'HIGH' }
      mockPrisma.securityIncident.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/security/incidents',
        payload: {
          type: 'INTRUSION',
          severity: 'HIGH',
          title: 'Intrusion',
          description: 'Intrusion detected at gate 3',
        },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.id).toBe('i1')
    })

    it('deve retornar 400 para incidente com dados invalidos', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/security/incidents',
        payload: { type: 'INTRUSION' },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /v1/security/incidents/:id/status', () => {
    it('deve atualizar estado do incidente', async () => {
      const existing = { id: 'i1', status: 'OPEN', tenantId: 'tenant-1' }
      const updated = { ...existing, status: 'RESOLVED', resolvedAt: new Date() }
      mockPrisma.securityIncident.findFirst.mockResolvedValue(existing)
      mockPrisma.securityIncident.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/security/incidents/i1/status',
        payload: { status: 'RESOLVED', resolution: 'Handled by guard' },
      })

      expect(res.statusCode).toBe(200)
    })

    it('deve retornar 404 para incidente inexistente', async () => {
      mockPrisma.securityIncident.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/security/incidents/inexistente/status',
        payload: { status: 'CLOSED' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // RONDAS
  // ═══════════════════════════════════════════

  describe('GET /v1/security/patrols', () => {
    it('deve listar rondas com paginacao', async () => {
      mockPrisma.securityPatrol.findMany.mockResolvedValue([{ id: 'p1', guardName: 'Joao', status: 'IN_PROGRESS' }])
      mockPrisma.securityPatrol.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/security/patrols?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(res.json().total).toBe(1)
    })
  })

  describe('POST /v1/security/patrols', () => {
    it('deve criar ronda com sucesso', async () => {
      const created = { id: 'p1', guardId: 'g1', guardName: 'Joao', status: 'IN_PROGRESS' }
      mockPrisma.securityPatrol.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/security/patrols',
        payload: {
          guardId: 'g1',
          guardName: 'Joao',
          startedAt: '2026-01-01T08:00:00.000Z',
        },
      })

      expect(res.statusCode).toBe(201)
    })
  })

  describe('PATCH /v1/security/patrols/:id/complete', () => {
    it('deve concluir ronda com sucesso', async () => {
      const existing = { id: 'p1', status: 'IN_PROGRESS', checkpoints: [], tenantId: 'tenant-1' }
      const updated = { ...existing, status: 'COMPLETED' }
      mockPrisma.securityPatrol.findFirst.mockResolvedValue(existing)
      mockPrisma.securityPatrol.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/security/patrols/p1/complete',
        payload: { complete: true },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().message).toContain('conclu')
    })

    it('deve adicionar checkpoint a ronda existente', async () => {
      const existing = { id: 'p1', status: 'IN_PROGRESS', checkpoints: [], tenantId: 'tenant-1' }
      const updated = { ...existing, checkpoints: [{ name: 'Portao A', checkedAt: '2026-01-01T08:30:00.000Z' }] }
      mockPrisma.securityPatrol.findFirst.mockResolvedValue(existing)
      mockPrisma.securityPatrol.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/security/patrols/p1/complete',
        payload: {
          checkpoint: { name: 'Portao A', checkedAt: '2026-01-01T08:30:00.000Z' },
        },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().message).toContain('Checkpoint')
    })

    it('deve retornar 404 para ronda inexistente', async () => {
      mockPrisma.securityPatrol.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/security/patrols/inexistente/complete',
        payload: { complete: true },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // TENANT ISOLATION
  // ═══════════════════════════════════════════

  describe('Tenant isolation', () => {
    it('deve filtrar contratos pelo tenantId do utilizador', async () => {
      mockPrisma.securityContract.findMany.mockResolvedValue([])
      mockPrisma.securityContract.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/security' })

      expect(mockPrisma.securityContract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })

    it('deve filtrar incidentes pelo tenantId do utilizador', async () => {
      mockPrisma.securityIncident.findMany.mockResolvedValue([])
      mockPrisma.securityIncident.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/security/incidents' })

      expect(mockPrisma.securityIncident.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })
  })
})

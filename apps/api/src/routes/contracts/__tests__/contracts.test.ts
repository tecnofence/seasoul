import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import contractsRoutes from '../index.js'

// ── Mock Prisma ──────────────────────────────────
const mockPrisma = {
  serviceContract: {
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
describe('Contracts API — /v1/contracts', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(contractsRoutes, { prefix: '/v1/contracts' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ═══════════════════════════════════════════
  // LISTAR CONTRATOS
  // ═══════════════════════════════════════════

  describe('GET /v1/contracts', () => {
    it('deve listar contratos com paginacao', async () => {
      const contracts = [
        { id: 'sc1', title: 'Contrato A', clientName: 'Cliente A', status: 'ACTIVE' },
      ]
      mockPrisma.serviceContract.findMany.mockResolvedValue(contracts)
      mockPrisma.serviceContract.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/contracts?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.totalPages).toBe(1)
    })

    it('deve filtrar contratos por status', async () => {
      mockPrisma.serviceContract.findMany.mockResolvedValue([])
      mockPrisma.serviceContract.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/contracts?status=ACTIVE' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.serviceContract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'ACTIVE' }) }),
      )
    })

    it('deve suportar busca por search', async () => {
      mockPrisma.serviceContract.findMany.mockResolvedValue([])
      mockPrisma.serviceContract.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/contracts?search=Manutencao' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.serviceContract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'Manutencao', mode: 'insensitive' } }),
            ]),
          }),
        }),
      )
    })
  })

  // ═══════════════════════════════════════════
  // CONTRATOS A EXPIRAR
  // ═══════════════════════════════════════════

  describe('GET /v1/contracts/expiring', () => {
    it('deve listar contratos a expirar nos proximos 30 dias', async () => {
      const contracts = [{ id: 'sc1', title: 'Contrato Expirando', status: 'ACTIVE' }]
      mockPrisma.serviceContract.findMany.mockResolvedValue(contracts)
      mockPrisma.serviceContract.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/contracts/expiring' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(1)
      expect(mockPrisma.serviceContract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        }),
      )
    })
  })

  // ═══════════════════════════════════════════
  // OBTER CONTRATO POR ID
  // ═══════════════════════════════════════════

  describe('GET /v1/contracts/:id', () => {
    it('deve retornar contrato por ID', async () => {
      const contract = { id: 'sc1', title: 'Contrato A', tenantId: 'tenant-1' }
      mockPrisma.serviceContract.findFirst.mockResolvedValue(contract)

      const res = await app.inject({ method: 'GET', url: '/v1/contracts/sc1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('sc1')
    })

    it('deve retornar 404 se contrato nao existe', async () => {
      mockPrisma.serviceContract.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'GET', url: '/v1/contracts/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // CRIAR CONTRATO
  // ═══════════════════════════════════════════

  describe('POST /v1/contracts', () => {
    it('deve criar contrato com sucesso', async () => {
      const created = { id: 'sc1', title: 'Contrato Novo', clientName: 'Cliente A', status: 'DRAFT' }
      mockPrisma.serviceContract.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/contracts',
        payload: {
          clientName: 'Cliente A',
          title: 'Contrato Novo',
          contractType: 'MANUTENCAO',
          startDate: '2026-01-01',
        },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.id).toBe('sc1')
    })

    it('deve retornar 400 para dados invalidos (titulo em falta)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/contracts',
        payload: { clientName: 'Cliente A' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('deve retornar 400 para dados invalidos (clientName em falta)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/contracts',
        payload: { title: 'Contrato', contractType: 'MANUTENCAO', startDate: '2026-01-01' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('deve retornar 400 se utilizador sem tenant', async () => {
      const noTenantApp = buildApp(noTenantUser)
      await noTenantApp.register(contractsRoutes, { prefix: '/v1/contracts' })
      await noTenantApp.ready()

      const res = await noTenantApp.inject({
        method: 'POST',
        url: '/v1/contracts',
        payload: {
          clientName: 'Cliente A',
          title: 'Contrato Novo',
          contractType: 'MANUTENCAO',
          startDate: '2026-01-01',
        },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toContain('Tenant')
      await noTenantApp.close()
    })
  })

  // ═══════════════════════════════════════════
  // ATUALIZAR ESTADO DO CONTRATO
  // ═══════════════════════════════════════════

  describe('PATCH /v1/contracts/:id/status', () => {
    it('deve atualizar estado do contrato', async () => {
      const existing = { id: 'sc1', status: 'DRAFT', tenantId: 'tenant-1' }
      const updated = { ...existing, status: 'ACTIVE' }
      mockPrisma.serviceContract.findFirst.mockResolvedValue(existing)
      mockPrisma.serviceContract.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/contracts/sc1/status',
        payload: { status: 'ACTIVE' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.status).toBe('ACTIVE')
    })

    it('deve retornar 404 para contrato inexistente', async () => {
      mockPrisma.serviceContract.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/contracts/inexistente/status',
        payload: { status: 'ACTIVE' },
      })

      expect(res.statusCode).toBe(404)
    })

    it('deve retornar 400 para status invalido', async () => {
      const existing = { id: 'sc1', status: 'DRAFT', tenantId: 'tenant-1' }
      mockPrisma.serviceContract.findFirst.mockResolvedValue(existing)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/contracts/sc1/status',
        payload: { status: 'INVALID_STATUS' },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  // ═══════════════════════════════════════════
  // TENANT ISOLATION
  // ═══════════════════════════════════════════

  describe('Tenant isolation', () => {
    it('deve filtrar contratos pelo tenantId do utilizador', async () => {
      mockPrisma.serviceContract.findMany.mockResolvedValue([])
      mockPrisma.serviceContract.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/contracts' })

      expect(mockPrisma.serviceContract.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })

    it('deve filtrar contrato por ID incluindo tenantId', async () => {
      mockPrisma.serviceContract.findFirst.mockResolvedValue(null)

      await app.inject({ method: 'GET', url: '/v1/contracts/sc1' })

      expect(mockPrisma.serviceContract.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })
  })
})

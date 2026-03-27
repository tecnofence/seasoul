import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import crmRoutes from '../index.js'

// ── Mock Prisma ──────────────────────────────────
const mockPrisma = {
  client: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  deal: {
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
describe('CRM API — /v1/crm', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(crmRoutes, { prefix: '/v1/crm' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ═══════════════════════════════════════════
  // CLIENTES
  // ═══════════════════════════════════════════

  describe('GET /v1/crm', () => {
    it('deve listar clientes com paginacao', async () => {
      const clients = [
        { id: 'cl1', name: 'Cliente A', type: 'INDIVIDUAL', _count: { deals: 2 } },
      ]
      mockPrisma.client.findMany.mockResolvedValue(clients)
      mockPrisma.client.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/crm?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.totalPages).toBe(1)
    })

    it('deve filtrar clientes por type', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/crm?type=COMPANY' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'COMPANY' }) }),
      )
    })

    it('deve suportar busca por search', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/crm?search=Joao' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Joao', mode: 'insensitive' } }),
            ]),
          }),
        }),
      )
    })
  })

  describe('GET /v1/crm/:id', () => {
    it('deve retornar cliente por ID', async () => {
      const client = { id: 'cl1', name: 'Cliente A', tenantId: 'tenant-1', deals: [] }
      mockPrisma.client.findFirst.mockResolvedValue(client)

      const res = await app.inject({ method: 'GET', url: '/v1/crm/cl1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('cl1')
    })

    it('deve retornar 404 se cliente nao existe', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'GET', url: '/v1/crm/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /v1/crm', () => {
    it('deve criar cliente com sucesso', async () => {
      const created = { id: 'cl1', name: 'Cliente Novo', type: 'INDIVIDUAL', tenantId: 'tenant-1' }
      mockPrisma.client.findFirst.mockResolvedValue(null) // NIF check
      mockPrisma.client.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/crm',
        payload: { name: 'Cliente Novo' },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.id).toBe('cl1')
    })

    it('deve retornar 400 para dados invalidos (nome em falta)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/crm',
        payload: {},
      })

      expect(res.statusCode).toBe(400)
    })

    it('deve retornar 400 se utilizador sem tenant', async () => {
      const noTenantApp = buildApp(noTenantUser)
      await noTenantApp.register(crmRoutes, { prefix: '/v1/crm' })
      await noTenantApp.ready()

      const res = await noTenantApp.inject({
        method: 'POST',
        url: '/v1/crm',
        payload: { name: 'Cliente A' },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toContain('Tenant')
      await noTenantApp.close()
    })

    it('deve retornar 409 para NIF duplicado no tenant', async () => {
      mockPrisma.client.findFirst.mockResolvedValue({ id: 'cl-existing', nif: '123456789' })

      const res = await app.inject({
        method: 'POST',
        url: '/v1/crm',
        payload: { name: 'Cliente Dup', nif: '123456789' },
      })

      expect(res.statusCode).toBe(409)
      expect(res.json().error).toContain('NIF')
    })
  })

  describe('PATCH /v1/crm/:id', () => {
    it('deve atualizar cliente existente', async () => {
      const existing = { id: 'cl1', name: 'Cliente A', tenantId: 'tenant-1', nif: null }
      const updated = { ...existing, name: 'Cliente B' }
      mockPrisma.client.findFirst.mockResolvedValue(existing)
      mockPrisma.client.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/crm/cl1',
        payload: { name: 'Cliente B' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.name).toBe('Cliente B')
    })

    it('deve retornar 404 se cliente nao existe ao atualizar', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/crm/inexistente',
        payload: { name: 'Cliente B' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // NEGOCIOS (PIPELINE)
  // ═══════════════════════════════════════════

  describe('GET /v1/crm/deals', () => {
    it('deve listar negocios com paginacao', async () => {
      const deals = [{ id: 'd1', title: 'Negocio A', stage: 'LEAD', client: { id: 'cl1', name: 'Cliente A', type: 'INDIVIDUAL' } }]
      mockPrisma.deal.findMany.mockResolvedValue(deals)
      mockPrisma.deal.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/crm/deals?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(1)
    })
  })

  describe('GET /v1/crm/deals/:id', () => {
    it('deve retornar negocio por ID', async () => {
      const deal = { id: 'd1', title: 'Negocio A', tenantId: 'tenant-1', client: { id: 'cl1', name: 'Cliente A' } }
      mockPrisma.deal.findFirst.mockResolvedValue(deal)

      const res = await app.inject({ method: 'GET', url: '/v1/crm/deals/d1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('d1')
    })

    it('deve retornar 404 para negocio inexistente', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'GET', url: '/v1/crm/deals/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /v1/crm/deals', () => {
    it('deve criar negocio com sucesso', async () => {
      const client = { id: 'cl1', tenantId: 'tenant-1', name: 'Cliente A' }
      const created = { id: 'd1', title: 'Negocio A', stage: 'LEAD', client: { id: 'cl1', name: 'Cliente A' } }
      mockPrisma.client.findFirst.mockResolvedValue(client)
      mockPrisma.deal.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/crm/deals',
        payload: { clientId: 'cl1', title: 'Negocio A' },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.id).toBe('d1')
    })

    it('deve retornar 404 se cliente nao pertence ao tenant', async () => {
      mockPrisma.client.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/crm/deals',
        payload: { clientId: 'cl-wrong', title: 'Negocio A' },
      })

      expect(res.statusCode).toBe(404)
    })

    it('deve retornar 400 para dados invalidos (titulo em falta)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/crm/deals',
        payload: { clientId: 'cl1' },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  describe('PATCH /v1/crm/deals/:id/stage', () => {
    it('deve mover negocio para WON', async () => {
      const existing = { id: 'd1', stage: 'NEGOTIATION', tenantId: 'tenant-1' }
      const updated = { ...existing, stage: 'WON', closedAt: new Date(), client: { id: 'cl1', name: 'Cliente A' } }
      mockPrisma.deal.findFirst.mockResolvedValue(existing)
      mockPrisma.deal.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/crm/deals/d1/stage',
        payload: { stage: 'WON' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.stage).toBe('WON')
    })

    it('deve retornar 404 para negocio inexistente', async () => {
      mockPrisma.deal.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/crm/deals/inexistente/stage',
        payload: { stage: 'WON' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // TENANT ISOLATION
  // ═══════════════════════════════════════════

  describe('Tenant isolation', () => {
    it('deve filtrar clientes pelo tenantId do utilizador', async () => {
      mockPrisma.client.findMany.mockResolvedValue([])
      mockPrisma.client.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/crm' })

      expect(mockPrisma.client.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })

    it('deve filtrar negocios pelo tenantId do utilizador', async () => {
      mockPrisma.deal.findMany.mockResolvedValue([])
      mockPrisma.deal.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/crm/deals' })

      expect(mockPrisma.deal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })
  })
})

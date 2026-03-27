import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import tenantsRoutes from '../index.js'

// ── Mock Prisma ──────────────────────────────────
const mockPrisma = {
  tenant: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  tenantModule: {
    upsert: vi.fn(),
    updateMany: vi.fn(),
  },
  branch: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}

// ── Mock User ────────────────────────────────────
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
function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()

  // Decorar com prisma mock
  app.decorate('prisma', mockPrisma as any)

  // Decorar com authenticate mock (injeta utilizador de teste)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })

  return app
}

// ── TESTES ───────────────────────────────────────
describe('Tenants API — /v1/tenants', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(tenantsRoutes, { prefix: '/v1/tenants' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── LIST TENANTS ──────────────────────────────
  describe('GET /v1/tenants', () => {
    it('deve listar tenants com paginacao', async () => {
      const tenants = [
        { id: 'tenant-1', name: 'Resort Cabo Ledo', slug: 'cabo-ledo', modules: [], branches: [], _count: { users: 5 } },
        { id: 'tenant-2', name: 'Resort Sangano', slug: 'sangano', modules: [], branches: [], _count: { users: 3 } },
      ]
      mockPrisma.tenant.findMany.mockResolvedValue(tenants)
      mockPrisma.tenant.count.mockResolvedValue(2)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(2)
      expect(body.total).toBe(2)
      expect(body.page).toBe(1)
      expect(body.totalPages).toBe(1)
    })

    it('deve suportar pesquisa por nome', async () => {
      mockPrisma.tenant.findMany.mockResolvedValue([])
      mockPrisma.tenant.count.mockResolvedValue(0)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants?search=Cabo',
      })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.tenant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Cabo', mode: 'insensitive' } }),
            ]),
          }),
        }),
      )
    })

    it('deve rejeitar utilizadores sem SUPER_ADMIN', async () => {
      const staffApp = buildApp(regularUser)
      await staffApp.register(tenantsRoutes, { prefix: '/v1/tenants' })
      await staffApp.ready()

      const res = await staffApp.inject({
        method: 'GET',
        url: '/v1/tenants',
      })

      expect(res.statusCode).toBe(403)
      expect(res.json().error).toBe('Sem permissão')

      await staffApp.close()
    })
  })

  // ── GET TENANT BY ID ──────────────────────────
  describe('GET /v1/tenants/:id', () => {
    it('deve retornar detalhe do tenant', async () => {
      const tenant = {
        id: 'tenant-1',
        name: 'Resort Cabo Ledo',
        slug: 'cabo-ledo',
        modules: [{ moduleId: 'core', active: true }],
        branches: [{ id: 'branch-1', name: 'Sede' }],
        _count: { users: 5 },
      }
      mockPrisma.tenant.findUnique.mockResolvedValue(tenant)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants/tenant-1',
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('tenant-1')
      expect(res.json().data.modules).toHaveLength(1)
    })

    it('deve retornar 404 se tenant nao existe', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants/nao-existe',
      })

      expect(res.statusCode).toBe(404)
      expect(res.json().error).toBe('Tenant não encontrado')
    })
  })

  // ── CREATE TENANT ─────────────────────────────
  describe('POST /v1/tenants', () => {
    it('deve criar tenant com modulo core incluido', async () => {
      const newTenant = {
        id: 'tenant-new',
        name: 'Hotel Luanda',
        slug: 'hotel-luanda',
        plan: 'STARTER',
        modules: [{ moduleId: 'core', active: true }],
      }
      mockPrisma.tenant.create.mockResolvedValue(newTenant)
      mockPrisma.auditLog.create.mockResolvedValue({})

      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        payload: {
          name: 'Hotel Luanda',
          slug: 'hotel-luanda',
        },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.name).toBe('Hotel Luanda')
      expect(mockPrisma.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Hotel Luanda',
            slug: 'hotel-luanda',
            modules: expect.objectContaining({
              create: expect.arrayContaining([{ moduleId: 'core' }]),
            }),
          }),
        }),
      )
    })

    it('deve criar tenant com modulos adicionais', async () => {
      const newTenant = {
        id: 'tenant-new',
        name: 'Hotel Luanda',
        slug: 'hotel-luanda',
        plan: 'PROFESSIONAL',
        modules: [
          { moduleId: 'core', active: true },
          { moduleId: 'invoicing', active: true },
        ],
      }
      mockPrisma.tenant.create.mockResolvedValue(newTenant)
      mockPrisma.auditLog.create.mockResolvedValue({})

      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        payload: {
          name: 'Hotel Luanda',
          slug: 'hotel-luanda',
          plan: 'PROFESSIONAL',
          modules: ['core', 'invoicing'],
        },
      })

      expect(res.statusCode).toBe(201)
      // core nao deve ser duplicado
      expect(mockPrisma.tenant.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            modules: expect.objectContaining({
              create: [{ moduleId: 'core' }, { moduleId: 'invoicing' }],
            }),
          }),
        }),
      )
    })

    it('deve rejeitar utilizadores sem SUPER_ADMIN', async () => {
      const staffApp = buildApp(regularUser)
      await staffApp.register(tenantsRoutes, { prefix: '/v1/tenants' })
      await staffApp.ready()

      const res = await staffApp.inject({
        method: 'POST',
        url: '/v1/tenants',
        payload: { name: 'Test', slug: 'test' },
      })

      expect(res.statusCode).toBe(403)
      await staffApp.close()
    })
  })

  // ── UPDATE TENANT ─────────────────────────────
  describe('PATCH /v1/tenants/:id', () => {
    it('deve atualizar dados do tenant', async () => {
      const updated = { id: 'tenant-1', name: 'Novo Nome', plan: 'ENTERPRISE' }
      mockPrisma.tenant.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/tenants/tenant-1',
        payload: { name: 'Novo Nome', plan: 'ENTERPRISE' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.name).toBe('Novo Nome')
    })
  })

  // ── MODULE ACTIVATION ─────────────────────────
  describe('POST /v1/tenants/:id/modules', () => {
    it('deve ativar modulo num tenant', async () => {
      mockPrisma.tenantModule.upsert.mockResolvedValue({
        tenantId: 'tenant-1',
        moduleId: 'invoicing',
        active: true,
      })

      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants/tenant-1/modules',
        payload: { moduleId: 'invoicing' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.moduleId).toBe('invoicing')
      expect(res.json().data.active).toBe(true)
    })
  })

  // ── MODULE DEACTIVATION ───────────────────────
  describe('DELETE /v1/tenants/:id/modules/:moduleId', () => {
    it('deve desativar modulo', async () => {
      mockPrisma.tenantModule.updateMany.mockResolvedValue({ count: 1 })

      const res = await app.inject({
        method: 'DELETE',
        url: '/v1/tenants/tenant-1/modules/invoicing',
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.message).toBe('Módulo desativado')
    })

    it('deve impedir desativacao do modulo core', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/v1/tenants/tenant-1/modules/core',
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toBe('O módulo Core não pode ser desativado')
    })
  })

  // ── BRANCHES ──────────────────────────────────
  describe('GET /v1/tenants/:id/branches', () => {
    it('deve listar filiais do tenant', async () => {
      const branches = [
        { id: 'branch-1', name: 'Cabo Ledo', tenantId: 'tenant-1', active: true },
        { id: 'branch-2', name: 'Sangano', tenantId: 'tenant-1', active: true },
      ]
      mockPrisma.branch.findMany.mockResolvedValue(branches)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants/tenant-1/branches',
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data).toHaveLength(2)
    })
  })

  describe('POST /v1/tenants/:id/branches', () => {
    it('deve criar filial', async () => {
      const tenant = { maxBranches: 5, _count: { branches: 1 } }
      mockPrisma.tenant.findUnique.mockResolvedValue(tenant)

      const newBranch = {
        id: 'branch-new',
        name: 'Filial Luanda',
        slug: 'filial-luanda',
        tenantId: 'tenant-1',
      }
      mockPrisma.branch.create.mockResolvedValue(newBranch)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants/tenant-1/branches',
        payload: { name: 'Filial Luanda', slug: 'filial-luanda' },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.name).toBe('Filial Luanda')
    })

    it('deve rejeitar se limite de filiais atingido', async () => {
      const tenant = { maxBranches: 1, _count: { branches: 1 } }
      mockPrisma.tenant.findUnique.mockResolvedValue(tenant)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants/tenant-1/branches',
        payload: { name: 'Extra', slug: 'extra' },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toContain('Limite de')
    })
  })

  // ── GET /me/modules ───────────────────────────
  describe('GET /v1/tenants/me/modules', () => {
    it('deve retornar modulos ativos do utilizador', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        trainingMode: false,
        plan: 'PROFESSIONAL',
        modules: [{ moduleId: 'core' }, { moduleId: 'invoicing' }, { moduleId: 'crm' }],
      })

      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants/me/modules',
      })

      expect(res.statusCode).toBe(200)
      const data = res.json().data
      expect(data.modules).toEqual(['core', 'invoicing', 'crm'])
      expect(data.plan).toBe('PROFESSIONAL')
      expect(data.trainingMode).toBe(false)
    })

    it('deve retornar wildcard para SUPER_ADMIN sem tenant', async () => {
      const noTenantApp = buildApp({
        ...superAdminUser,
        tenantId: undefined as any,
      })
      await noTenantApp.register(tenantsRoutes, { prefix: '/v1/tenants' })
      await noTenantApp.ready()

      const res = await noTenantApp.inject({
        method: 'GET',
        url: '/v1/tenants/me/modules',
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.modules).toEqual(['*'])

      await noTenantApp.close()
    })

    it('deve retornar 404 se tenant nao encontrado', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants/me/modules',
      })

      expect(res.statusCode).toBe(404)
    })
  })
})

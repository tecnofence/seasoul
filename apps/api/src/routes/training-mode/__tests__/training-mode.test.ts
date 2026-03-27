import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import trainingModeRoutes from '../index.js'

// ── Mock Prisma ──────────────────────────────────
const mockPrisma = {
  tenant: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  invoice: {
    count: vi.fn(),
    deleteMany: vi.fn(),
  },
  invoiceItem: {
    deleteMany: vi.fn(),
  },
  invoiceSeries: {
    upsert: vi.fn(),
    updateMany: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
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

const managerUser = {
  id: 'user-2',
  email: 'manager@engeris.ao',
  role: 'RESORT_MANAGER',
  tenantId: 'tenant-1',
  type: 'staff' as const,
}

const staffUser = {
  id: 'user-3',
  email: 'staff@engeris.ao',
  role: 'STAFF',
  tenantId: 'tenant-1',
  type: 'staff' as const,
}

// ── Helper ───────────────────────────────────────
function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

// ── TESTES ───────────────────────────────────────
describe('Training Mode API — /v1/training-mode', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(trainingModeRoutes, { prefix: '/v1/training-mode' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET STATUS ────────────────────────────────
  describe('GET /v1/training-mode', () => {
    it('deve retornar estado do modo formacao (inativo)', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Resort Cabo Ledo',
        trainingMode: false,
      })
      mockPrisma.invoice.count.mockResolvedValue(0)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/training-mode',
      })

      expect(res.statusCode).toBe(200)
      const data = res.json().data
      expect(data.enabled).toBe(false)
      expect(data.tenantName).toBe('Resort Cabo Ledo')
      expect(data.trainingDocuments).toBe(0)
      expect(data.banner).toBeNull()
    })

    it('deve retornar banner quando modo formacao ativo', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        name: 'Resort Cabo Ledo',
        trainingMode: true,
      })
      mockPrisma.invoice.count.mockResolvedValue(12)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/training-mode',
      })

      expect(res.statusCode).toBe(200)
      const data = res.json().data
      expect(data.enabled).toBe(true)
      expect(data.trainingDocuments).toBe(12)
      expect(data.banner).toBeDefined()
      expect(data.banner.color).toBe('#F59E0B')
      expect(data.banner.text).toContain('MODO FORMAÇÃO')
    })

    it('deve retornar 400 para utilizador sem tenant', async () => {
      const noTenantApp = buildApp({
        ...superAdminUser,
        tenantId: undefined as any,
      })
      await noTenantApp.register(trainingModeRoutes, { prefix: '/v1/training-mode' })
      await noTenantApp.ready()

      const res = await noTenantApp.inject({
        method: 'GET',
        url: '/v1/training-mode',
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toBe('Utilizador sem tenant associado')

      await noTenantApp.close()
    })

    it('deve retornar 404 se tenant nao encontrado', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue(null)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/training-mode',
      })

      expect(res.statusCode).toBe(404)
      expect(res.json().error).toBe('Tenant não encontrado')
    })
  })

  // ── ACTIVATE ──────────────────────────────────
  describe('POST /v1/training-mode/activate', () => {
    it('deve ativar modo formacao', async () => {
      mockPrisma.tenant.update.mockResolvedValue({
        id: 'tenant-1',
        trainingMode: true,
      })
      mockPrisma.invoiceSeries.upsert.mockResolvedValue({})
      mockPrisma.auditLog.create.mockResolvedValue({})

      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-mode/activate',
      })

      expect(res.statusCode).toBe(200)
      const data = res.json().data
      expect(data.enabled).toBe(true)
      expect(data.message).toBe('Modo formação ativado com sucesso')
    })

    it('deve criar series TREINO para todos os tipos de documento', async () => {
      mockPrisma.tenant.update.mockResolvedValue({ id: 'tenant-1', trainingMode: true })
      mockPrisma.invoiceSeries.upsert.mockResolvedValue({})
      mockPrisma.auditLog.create.mockResolvedValue({})

      await app.inject({
        method: 'POST',
        url: '/v1/training-mode/activate',
      })

      // Deve criar series para FT, FR, NC, ORC, PF, RC (6 tipos)
      expect(mockPrisma.invoiceSeries.upsert).toHaveBeenCalledTimes(6)

      const docTypes = mockPrisma.invoiceSeries.upsert.mock.calls.map(
        (call: any) => call[0].where.tenantId_documentType_series.documentType,
      )
      expect(docTypes).toContain('FT')
      expect(docTypes).toContain('FR')
      expect(docTypes).toContain('NC')
      expect(docTypes).toContain('ORC')
      expect(docTypes).toContain('PF')
      expect(docTypes).toContain('RC')
    })

    it('deve registar na auditoria', async () => {
      mockPrisma.tenant.update.mockResolvedValue({ id: 'tenant-1', trainingMode: true })
      mockPrisma.invoiceSeries.upsert.mockResolvedValue({})
      mockPrisma.auditLog.create.mockResolvedValue({})

      await app.inject({
        method: 'POST',
        url: '/v1/training-mode/activate',
      })

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            action: 'TRAINING_MODE_ACTIVATED',
            entity: 'Tenant',
          }),
        }),
      )
    })

    it('RESORT_MANAGER tambem pode ativar', async () => {
      const managerApp = buildApp(managerUser)
      await managerApp.register(trainingModeRoutes, { prefix: '/v1/training-mode' })
      await managerApp.ready()

      mockPrisma.tenant.update.mockResolvedValue({ id: 'tenant-1', trainingMode: true })
      mockPrisma.invoiceSeries.upsert.mockResolvedValue({})
      mockPrisma.auditLog.create.mockResolvedValue({})

      const res = await managerApp.inject({
        method: 'POST',
        url: '/v1/training-mode/activate',
      })

      expect(res.statusCode).toBe(200)
      await managerApp.close()
    })

    it('deve rejeitar STAFF sem permissao', async () => {
      const staffApp = buildApp(staffUser)
      await staffApp.register(trainingModeRoutes, { prefix: '/v1/training-mode' })
      await staffApp.ready()

      const res = await staffApp.inject({
        method: 'POST',
        url: '/v1/training-mode/activate',
      })

      expect(res.statusCode).toBe(403)
      await staffApp.close()
    })
  })

  // ── DEACTIVATE ────────────────────────────────
  describe('POST /v1/training-mode/deactivate', () => {
    it('deve desativar modo formacao', async () => {
      mockPrisma.tenant.update.mockResolvedValue({
        id: 'tenant-1',
        trainingMode: false,
      })
      mockPrisma.auditLog.create.mockResolvedValue({})

      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-mode/deactivate',
      })

      expect(res.statusCode).toBe(200)
      const data = res.json().data
      expect(data.enabled).toBe(false)
      expect(data.message).toBe('Modo formação desativado')
    })

    it('deve registar na auditoria', async () => {
      mockPrisma.tenant.update.mockResolvedValue({ id: 'tenant-1', trainingMode: false })
      mockPrisma.auditLog.create.mockResolvedValue({})

      await app.inject({
        method: 'POST',
        url: '/v1/training-mode/deactivate',
      })

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TRAINING_MODE_DEACTIVATED',
          }),
        }),
      )
    })

    it('deve rejeitar STAFF sem permissao', async () => {
      const staffApp = buildApp(staffUser)
      await staffApp.register(trainingModeRoutes, { prefix: '/v1/training-mode' })
      await staffApp.ready()

      const res = await staffApp.inject({
        method: 'POST',
        url: '/v1/training-mode/deactivate',
      })

      expect(res.statusCode).toBe(403)
      await staffApp.close()
    })
  })

  // ── PURGE ─────────────────────────────────────
  describe('DELETE /v1/training-mode/purge', () => {
    it('deve limpar todos os dados de formacao', async () => {
      mockPrisma.invoiceItem.deleteMany.mockResolvedValue({ count: 25 })
      mockPrisma.invoice.deleteMany.mockResolvedValue({ count: 10 })
      mockPrisma.invoiceSeries.updateMany.mockResolvedValue({ count: 6 })
      mockPrisma.auditLog.create.mockResolvedValue({})

      const res = await app.inject({
        method: 'DELETE',
        url: '/v1/training-mode/purge',
      })

      expect(res.statusCode).toBe(200)
      const data = res.json().data
      expect(data.purged).toBe(10)
      expect(data.message).toBe('10 documentos de formação eliminados')
    })

    it('deve apagar items antes das faturas (cascade)', async () => {
      mockPrisma.invoiceItem.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.invoice.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.invoiceSeries.updateMany.mockResolvedValue({ count: 0 })
      mockPrisma.auditLog.create.mockResolvedValue({})

      await app.inject({
        method: 'DELETE',
        url: '/v1/training-mode/purge',
      })

      // invoiceItem.deleteMany deve ser chamado primeiro
      const itemDeleteOrder = mockPrisma.invoiceItem.deleteMany.mock.invocationCallOrder[0]
      const invoiceDeleteOrder = mockPrisma.invoice.deleteMany.mock.invocationCallOrder[0]
      expect(itemDeleteOrder).toBeLessThan(invoiceDeleteOrder)

      // Deve filtrar por isTraining: true
      expect(mockPrisma.invoiceItem.deleteMany).toHaveBeenCalledWith({
        where: { invoice: { tenantId: 'tenant-1', isTraining: true } },
      })
      expect(mockPrisma.invoice.deleteMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isTraining: true },
      })
    })

    it('deve resetar contadores das series de formacao', async () => {
      mockPrisma.invoiceItem.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.invoice.deleteMany.mockResolvedValue({ count: 0 })
      mockPrisma.invoiceSeries.updateMany.mockResolvedValue({ count: 6 })
      mockPrisma.auditLog.create.mockResolvedValue({})

      await app.inject({
        method: 'DELETE',
        url: '/v1/training-mode/purge',
      })

      expect(mockPrisma.invoiceSeries.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', isTraining: true },
        data: { lastNumber: 0 },
      })
    })

    it('deve ser restrito a SUPER_ADMIN apenas', async () => {
      const managerApp = buildApp(managerUser)
      await managerApp.register(trainingModeRoutes, { prefix: '/v1/training-mode' })
      await managerApp.ready()

      const res = await managerApp.inject({
        method: 'DELETE',
        url: '/v1/training-mode/purge',
      })

      expect(res.statusCode).toBe(403)
      expect(res.json().error).toBe('Apenas SUPER_ADMIN pode limpar dados de formação')

      await managerApp.close()
    })

    it('deve rejeitar utilizador sem tenant', async () => {
      const noTenantApp = buildApp({
        ...superAdminUser,
        tenantId: undefined as any,
      })
      await noTenantApp.register(trainingModeRoutes, { prefix: '/v1/training-mode' })
      await noTenantApp.ready()

      const res = await noTenantApp.inject({
        method: 'DELETE',
        url: '/v1/training-mode/purge',
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toBe('Utilizador sem tenant associado')

      await noTenantApp.close()
    })

    it('deve registar purge na auditoria', async () => {
      mockPrisma.invoiceItem.deleteMany.mockResolvedValue({ count: 5 })
      mockPrisma.invoice.deleteMany.mockResolvedValue({ count: 3 })
      mockPrisma.invoiceSeries.updateMany.mockResolvedValue({ count: 6 })
      mockPrisma.auditLog.create.mockResolvedValue({})

      await app.inject({
        method: 'DELETE',
        url: '/v1/training-mode/purge',
      })

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'TRAINING_DATA_PURGED',
            entity: 'Invoice',
            after: { deletedCount: 3 },
          }),
        }),
      )
    })
  })
})

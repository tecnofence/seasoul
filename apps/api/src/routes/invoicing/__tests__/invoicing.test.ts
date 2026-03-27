import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import invoicingRoutes from '../index.js'

// ── Mock Prisma ──────────────────────────────────
const mockPrisma: any = {
  invoice: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    groupBy: vi.fn(),
  },
  tenant: {
    findUnique: vi.fn(),
  },
  invoiceSeries: {
    upsert: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(async (fn: any) => fn(mockPrisma)),
}

// ── Mock Users ───────────────────────────────────
const staffUser = {
  id: 'user-1',
  email: 'fatura@engeris.ao',
  role: 'RESORT_MANAGER',
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

// ── Helper ───────────────────────────────────────
function buildApp(user = staffUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

// ── TESTES ───────────────────────────────────────
describe('Invoicing API — /v1/invoicing', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(invoicingRoutes, { prefix: '/v1/invoicing' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── LIST INVOICES ─────────────────────────────
  describe('GET /v1/invoicing', () => {
    it('deve listar documentos fiscais com paginacao', async () => {
      const invoices = [
        { id: 'inv-1', fullNumber: 'FT A/00001', documentType: 'FT', totalAmount: 10000, items: [] },
        { id: 'inv-2', fullNumber: 'FR A/00001', documentType: 'FR', totalAmount: 5000, items: [] },
      ]
      mockPrisma.invoice.findMany.mockResolvedValue(invoices)
      mockPrisma.invoice.count.mockResolvedValue(2)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/invoicing',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(2)
      expect(body.total).toBe(2)
      expect(body.page).toBe(1)
    })

    it('deve filtrar por tipo de documento', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([])
      mockPrisma.invoice.count.mockResolvedValue(0)

      await app.inject({
        method: 'GET',
        url: '/v1/invoicing?type=NC',
      })

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ documentType: 'NC' }),
        }),
      )
    })

    it('deve filtrar por documentos de formacao', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([])
      mockPrisma.invoice.count.mockResolvedValue(0)

      await app.inject({
        method: 'GET',
        url: '/v1/invoicing?isTraining=true',
      })

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isTraining: true }),
        }),
      )
    })

    it('deve filtrar por status cancelado', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([])
      mockPrisma.invoice.count.mockResolvedValue(0)

      await app.inject({
        method: 'GET',
        url: '/v1/invoicing?status=cancelled',
      })

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cancelledAt: { not: null } }),
        }),
      )
    })

    it('deve filtrar por intervalo de datas', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([])
      mockPrisma.invoice.count.mockResolvedValue(0)

      await app.inject({
        method: 'GET',
        url: '/v1/invoicing?from=2026-01-01&to=2026-03-31',
      })

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2026-01-01'),
              lte: new Date('2026-03-31'),
            },
          }),
        }),
      )
    })

    it('deve pesquisar por numero, cliente ou NIF', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([])
      mockPrisma.invoice.count.mockResolvedValue(0)

      await app.inject({
        method: 'GET',
        url: '/v1/invoicing?search=Engeris',
      })

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ clientName: { contains: 'Engeris', mode: 'insensitive' } }),
            ]),
          }),
        }),
      )
    })

    it('deve filtrar por tenantId do utilizador', async () => {
      mockPrisma.invoice.findMany.mockResolvedValue([])
      mockPrisma.invoice.count.mockResolvedValue(0)

      await app.inject({
        method: 'GET',
        url: '/v1/invoicing',
      })

      expect(mockPrisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1' }),
        }),
      )
    })
  })

  // ── CREATE INVOICE ────────────────────────────
  describe('POST /v1/invoicing', () => {
    const validPayload = {
      documentType: 'FT',
      clientName: 'ENGERIS SA',
      clientNif: '5000123456',
      items: [
        { description: 'Estadia Suite', quantity: 2, unitPrice: 50000 },
      ],
    }

    it('deve criar fatura com auto-numeracao', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ trainingMode: false })
      mockPrisma.invoiceSeries.upsert.mockResolvedValue({
        id: 'series-1',
        series: 'A',
        lastNumber: 0,
      })
      mockPrisma.invoiceSeries.update.mockResolvedValue({
        id: 'series-1',
        lastNumber: 1,
      })

      const createdInvoice = {
        id: 'inv-new',
        fullNumber: 'FT A/00001',
        documentType: 'FT',
        number: 1,
        isTraining: false,
        clientName: 'ENGERIS SA',
        clientNif: '5000123456',
        subtotal: 100000,
        taxAmount: 14000,
        totalAmount: 114000,
        items: [{ description: 'Estadia Suite', quantity: 2, unitPrice: 50000 }],
      }
      mockPrisma.invoice.create.mockResolvedValue(createdInvoice)
      mockPrisma.auditLog.create.mockResolvedValue({})

      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoicing',
        payload: validPayload,
      })

      expect(res.statusCode).toBe(201)
      const data = res.json().data
      expect(data.fullNumber).toBe('FT A/00001')
      expect(data.isTraining).toBe(false)
    })

    it('deve criar fatura com serie TREINO em modo formacao', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ trainingMode: true })
      mockPrisma.invoiceSeries.upsert.mockResolvedValue({
        id: 'series-treino',
        series: 'TREINO',
        lastNumber: 0,
      })
      mockPrisma.invoiceSeries.update.mockResolvedValue({
        id: 'series-treino',
        lastNumber: 3,
      })

      const createdInvoice = {
        id: 'inv-treino',
        fullNumber: 'FT-TREINO TREINO/00003',
        documentType: 'FT',
        number: 3,
        isTraining: true,
        clientName: 'ENGERIS SA',
        totalAmount: 114000,
        items: [],
      }
      mockPrisma.invoice.create.mockResolvedValue(createdInvoice)
      mockPrisma.auditLog.create.mockResolvedValue({})

      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoicing',
        payload: validPayload,
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.isTraining).toBe(true)
      expect(res.json().data.fullNumber).toContain('TREINO')
    })

    it('deve rejeitar fatura sem items', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoicing',
        payload: {
          documentType: 'FT',
          clientName: 'Test',
          items: [],
        },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toBe('Pelo menos um item é obrigatório')
    })

    it('deve rejeitar utilizador sem tenant', async () => {
      const noTenantApp = buildApp({
        ...staffUser,
        tenantId: undefined as any,
      })
      await noTenantApp.register(invoicingRoutes, { prefix: '/v1/invoicing' })
      await noTenantApp.ready()

      const res = await noTenantApp.inject({
        method: 'POST',
        url: '/v1/invoicing',
        payload: validPayload,
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toBe('Utilizador sem tenant')

      await noTenantApp.close()
    })

    it('deve calcular IVA a 14% por defeito', async () => {
      mockPrisma.tenant.findUnique.mockResolvedValue({ trainingMode: false })
      mockPrisma.invoiceSeries.upsert.mockResolvedValue({ id: 's-1', series: 'A', lastNumber: 0 })
      mockPrisma.invoiceSeries.update.mockResolvedValue({ id: 's-1', lastNumber: 1 })
      mockPrisma.invoice.create.mockResolvedValue({ id: 'inv-1', items: [] })
      mockPrisma.auditLog.create.mockResolvedValue({})

      await app.inject({
        method: 'POST',
        url: '/v1/invoicing',
        payload: {
          documentType: 'FT',
          clientName: 'Test',
          items: [{ description: 'Item', quantity: 1, unitPrice: 10000 }],
        },
      })

      // Verificar que o create foi chamado com valores corretos de imposto
      const createCall = mockPrisma.invoice.create.mock.calls[0][0]
      expect(createCall.data.subtotal).toBeCloseTo(10000, 2)
      expect(createCall.data.taxAmount).toBeCloseTo(1400, 2) // 14% de 10000
      expect(createCall.data.totalAmount).toBeCloseTo(11400, 2)
    })
  })

  // ── CANCEL INVOICE ────────────────────────────
  describe('POST /v1/invoicing/:id/cancel', () => {
    it('deve anular documento com motivo', async () => {
      const invoice = {
        id: 'inv-1',
        fullNumber: 'FT A/00001',
        cancelledAt: null,
      }
      mockPrisma.invoice.findFirst.mockResolvedValue(invoice)
      mockPrisma.invoice.update.mockResolvedValue({
        ...invoice,
        cancelledAt: new Date(),
        cancelReason: 'Erro de valores',
      })
      mockPrisma.auditLog.create.mockResolvedValue({})

      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoicing/inv-1/cancel',
        payload: { reason: 'Erro de valores' },
      })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.cancelReason).toBe('Erro de valores')
    })

    it('deve rejeitar anulacao sem motivo', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoicing/inv-1/cancel',
        payload: {},
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toBe('Motivo de anulação é obrigatório')
    })

    it('deve rejeitar anulacao de documento ja anulado', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue({
        id: 'inv-1',
        cancelledAt: new Date(),
      })

      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoicing/inv-1/cancel',
        payload: { reason: 'Duplicado' },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toBe('Documento já anulado')
    })

    it('deve retornar 404 para documento inexistente', async () => {
      mockPrisma.invoice.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoicing/nao-existe/cancel',
        payload: { reason: 'Test' },
      })

      expect(res.statusCode).toBe(404)
    })

    it('deve rejeitar utilizadores sem permissao de anulacao', async () => {
      const staffApp = buildApp(regularUser)
      await staffApp.register(invoicingRoutes, { prefix: '/v1/invoicing' })
      await staffApp.ready()

      const res = await staffApp.inject({
        method: 'POST',
        url: '/v1/invoicing/inv-1/cancel',
        payload: { reason: 'Erro' },
      })

      expect(res.statusCode).toBe(403)
      expect(res.json().error).toBe('Sem permissão para anular documentos')

      await staffApp.close()
    })
  })

  // ── SUMMARY ───────────────────────────────────
  describe('GET /v1/invoicing/summary', () => {
    it('deve retornar resumo por tipo de documento', async () => {
      mockPrisma.invoice.groupBy.mockResolvedValue([
        { documentType: 'FT', _count: { id: 15 }, _sum: { totalAmount: 1500000 } },
        { documentType: 'FR', _count: { id: 8 }, _sum: { totalAmount: 400000 } },
        { documentType: 'NC', _count: { id: 2 }, _sum: { totalAmount: 50000 } },
      ])

      const res = await app.inject({
        method: 'GET',
        url: '/v1/invoicing/summary',
      })

      expect(res.statusCode).toBe(200)
      const data = res.json().data
      expect(data).toHaveLength(3)
      expect(data[0]).toEqual({
        type: 'FT',
        label: 'Fatura',
        count: 15,
        total: 1500000,
      })
    })

    it('deve filtrar resumo por documentos de formacao', async () => {
      mockPrisma.invoice.groupBy.mockResolvedValue([])

      await app.inject({
        method: 'GET',
        url: '/v1/invoicing/summary?isTraining=true',
      })

      expect(mockPrisma.invoice.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isTraining: true }),
        }),
      )
    })

    it('deve excluir documentos anulados do resumo', async () => {
      mockPrisma.invoice.groupBy.mockResolvedValue([])

      await app.inject({
        method: 'GET',
        url: '/v1/invoicing/summary',
      })

      expect(mockPrisma.invoice.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ cancelledAt: null }),
        }),
      )
    })
  })

  // ── TYPES ─────────────────────────────────────
  describe('GET /v1/invoicing/types', () => {
    it('deve retornar lista de tipos de documento', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/invoicing/types',
      })

      expect(res.statusCode).toBe(200)
      const data = res.json().data
      expect(data).toContainEqual({ code: 'FT', label: 'Fatura' })
      expect(data).toContainEqual({ code: 'NC', label: 'Nota de Crédito' })
      expect(data).toContainEqual({ code: 'ORC', label: 'Orçamento' })
      expect(data.length).toBe(10) // FT, FR, NC, ND, ORC, PF, RC, GT, AM, CS
    })
  })
})

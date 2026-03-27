import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import invoicesRoutes from '../index.js'

// ── Mock Prisma ──────────────────────────────────
const mockPrisma: any = {
  sale: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(async (fn: any) => fn(mockPrisma)),
}

// ── Mock Users ────────────────────────────────────
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
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

// ── Sample Data ─────────────────────────────────
const sampleInvoice = {
  id: 'sale-1',
  resortId: 'resort-1',
  status: 'INVOICED',
  totalAmount: '15000.00',
  invoiceNumber: 'FT A/00001',
  invoiceSeries: 'FT',
  createdAt: new Date('2026-01-15'),
  items: [
    {
      id: 'item-1',
      quantity: 2,
      unitPrice: '7500.00',
      product: { id: 'prod-1', name: 'Cocktail Tropical' },
    },
  ],
  resort: { id: 'resort-1', name: 'Cabo Ledo' },
}

const sampleSalePending = {
  id: 'clsale2xxxxxxxxxxxxxxxxxx',
  resortId: 'resort-1',
  status: 'COMPLETED',
  totalAmount: '8000.00',
  invoiceNumber: null,
  invoiceSeries: null,
  createdAt: new Date('2026-01-20'),
}

// ── TESTES ───────────────────────────────────────
describe('Invoices API — /v1/invoices', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(invoicesRoutes, { prefix: '/v1/invoices' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── LIST INVOICES ──────────────────────────────
  describe('GET /v1/invoices', () => {
    it('deve listar faturas com paginacao', async () => {
      const invoices = [sampleInvoice]
      mockPrisma.sale.findMany.mockResolvedValue(invoices)
      mockPrisma.sale.count.mockResolvedValue(1)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/invoices',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.page).toBe(1)
      expect(body.limit).toBe(20)
      expect(body.totalPages).toBe(1)
      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'INVOICED', invoiceNumber: { not: null } },
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      )
    })

    it('deve filtrar por resortId e datas', async () => {
      mockPrisma.sale.findMany.mockResolvedValue([])
      mockPrisma.sale.count.mockResolvedValue(0)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/invoices?resortId=resort-1&from=2026-01-01&to=2026-01-31&page=2&limit=10',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.page).toBe(2)
      expect(body.limit).toBe(10)
      expect(mockPrisma.sale.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resortId: 'resort-1',
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
          skip: 10,
          take: 10,
        }),
      )
    })

    it('deve retornar 400 para parametros invalidos', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/invoices?page=-1',
      })

      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body.error).toBe('Parâmetros inválidos')
    })
  })

  // ── GET BY ID ──────────────────────────────────
  describe('GET /v1/invoices/:id', () => {
    it('deve retornar fatura por ID', async () => {
      const invoiceWithReservation = {
        ...sampleInvoice,
        reservation: { id: 'res-1', guestName: 'Carlos Silva', guestEmail: 'carlos@mail.com' },
      }
      mockPrisma.sale.findUnique.mockResolvedValue(invoiceWithReservation)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/invoices/sale-1',
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.id).toBe('sale-1')
      expect(body.data.invoiceNumber).toBe('FT A/00001')
      expect(body.data.reservation.guestName).toBe('Carlos Silva')
    })

    it('deve retornar 404 para fatura inexistente', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(null)

      const res = await app.inject({
        method: 'GET',
        url: '/v1/invoices/nonexistent-id',
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body.error).toBe('Fatura não encontrada')
    })

    it('deve retornar 404 para venda sem numero de fatura', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue({
        id: 'sale-3',
        invoiceNumber: null,
        status: 'COMPLETED',
      })

      const res = await app.inject({
        method: 'GET',
        url: '/v1/invoices/sale-3',
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body.error).toBe('Fatura não encontrada')
    })
  })

  // ── EMIT INVOICE ──────────────────────────────
  describe('POST /v1/invoices/emit', () => {
    it('deve emitir fatura com sucesso', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(sampleSalePending)

      const emittedInvoice = {
        ...sampleSalePending,
        status: 'INVOICED',
        invoiceNumber: 'FT A/00002',
        invoiceSeries: 'FT',
        items: [],
        resort: { id: 'resort-1', name: 'Cabo Ledo' },
      }
      mockPrisma.sale.findFirst.mockResolvedValue({ invoiceNumber: 'FT A/00001' })
      mockPrisma.sale.update.mockResolvedValue(emittedInvoice)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoices/emit',
        payload: { saleId: 'clsale2xxxxxxxxxxxxxxxxxx' },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.invoiceNumber).toBe('FT A/00002')
      expect(body.message).toContain('emitida com sucesso')
    })

    it('deve gerar sequencia 00001 quando nao ha faturas anteriores', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(sampleSalePending)

      const emittedInvoice = {
        ...sampleSalePending,
        status: 'INVOICED',
        invoiceNumber: 'FT A/00001',
        invoiceSeries: 'FT',
        items: [],
        resort: { id: 'resort-1', name: 'Cabo Ledo' },
      }
      mockPrisma.sale.findFirst.mockResolvedValue(null)
      mockPrisma.sale.update.mockResolvedValue(emittedInvoice)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoices/emit',
        payload: { saleId: 'clsale2xxxxxxxxxxxxxxxxxx' },
      })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data.invoiceNumber).toBe('FT A/00001')
    })

    it('deve retornar 404 quando venda nao existe', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue(null)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoices/emit',
        payload: { saleId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' },
      })

      expect(res.statusCode).toBe(404)
      const body = res.json()
      expect(body.error).toBe('Venda não encontrada')
    })

    it('deve retornar 400 quando venda ja esta faturada', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue({
        ...sampleSalePending,
        status: 'INVOICED',
        invoiceNumber: 'FT A/00001',
      })

      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoices/emit',
        payload: { saleId: 'clsale2xxxxxxxxxxxxxxxxxx' },
      })

      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body.error).toBe('Fatura já emitida para esta venda')
    })

    it('deve retornar 400 quando venda esta cancelada', async () => {
      mockPrisma.sale.findUnique.mockResolvedValue({
        ...sampleSalePending,
        status: 'CANCELLED',
      })

      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoices/emit',
        payload: { saleId: 'clsale2xxxxxxxxxxxxxxxxxx' },
      })

      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body.error).toBe('Não é possível faturar venda cancelada')
    })

    it('deve retornar 400 para body invalido', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/invoices/emit',
        payload: { saleId: 'not-a-cuid' },
      })

      expect(res.statusCode).toBe(400)
      const body = res.json()
      expect(body.error).toBe('Dados inválidos')
    })

    it('deve retornar 403 para utilizador sem permissao', async () => {
      const staffApp = buildApp(regularUser)
      await staffApp.register(invoicesRoutes, { prefix: '/v1/invoices' })
      await staffApp.ready()

      const res = await staffApp.inject({
        method: 'POST',
        url: '/v1/invoices/emit',
        payload: { saleId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' },
      })

      expect(res.statusCode).toBe(403)
      const body = res.json()
      expect(body.error).toBe('Sem permissão para emitir faturas')

      await staffApp.close()
    })
  })
})

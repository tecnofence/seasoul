import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import posRoutes from '../index.js'

const mockPrisma = {
  sale: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  resort: {
    findUnique: vi.fn(),
  },
  reservation: {
    findUnique: vi.fn(),
  },
  product: {
    findMany: vi.fn(),
  },
}

// Valid CUIDs for test payloads
const RESORT_CUID = 'cly1234567890abcdefghijklm'
const PRODUCT_CUID = 'clz1234567890abcdefghijklm'
const RESERVATION_CUID = 'clw1234567890abcdefghijklm'

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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('POS API — /v1/pos', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(posRoutes, { prefix: '/v1/pos' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — Listar vendas ──

  it('should list sales with pagination (200)', async () => {
    const mockSales = [
      { id: 'sale-1', resortId: 'resort-1', status: 'PENDING', totalAmount: '5000.00' },
    ]
    mockPrisma.sale.findMany.mockResolvedValue(mockSales)
    mockPrisma.sale.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/pos?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('should list sales with filters (resortId, status, paymentMethod)', async () => {
    mockPrisma.sale.findMany.mockResolvedValue([])
    mockPrisma.sale.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/pos?page=1&limit=10&resortId=resort-1&status=PENDING&paymentMethod=CASH',
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.sale.findMany).toHaveBeenCalled()
  })

  it('should list sales with date range filters', async () => {
    mockPrisma.sale.findMany.mockResolvedValue([])
    mockPrisma.sale.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/pos?page=1&limit=10&from=2026-01-01&to=2026-01-31',
    })

    expect(res.statusCode).toBe(200)
  })

  // ── GET /:id — Obter venda por ID ──

  it('should return a sale by ID (200)', async () => {
    const mockSale = { id: 'sale-1', resortId: 'resort-1', status: 'PENDING', items: [], resort: { id: 'resort-1', name: 'Cabo Ledo' } }
    mockPrisma.sale.findUnique.mockResolvedValue(mockSale)

    const res = await app.inject({ method: 'GET', url: '/v1/pos/sale-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('sale-1')
  })

  it('should return 404 when sale not found', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/pos/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Venda não encontrada')
  })

  // ── POST / — Criar venda ──

  it('should create a sale (201)', async () => {
    const mockResort = { id: RESORT_CUID, name: 'Cabo Ledo' }
    const mockProducts = [{ id: PRODUCT_CUID, name: 'Cerveja', active: true }]
    const mockSale = {
      id: 'sale-new',
      resortId: RESORT_CUID,
      status: 'PENDING',
      totalAmount: '1140.00',
      taxAmount: '140.00',
      items: [],
      resort: mockResort,
    }

    mockPrisma.resort.findUnique.mockResolvedValue(mockResort)
    mockPrisma.product.findMany.mockResolvedValue(mockProducts)
    mockPrisma.sale.create.mockResolvedValue(mockSale)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/pos',
      payload: {
        resortId: RESORT_CUID,
        paymentMethod: 'CASH',
        items: [{ productId: PRODUCT_CUID, qty: 2, unitPrice: 500, taxRate: 14 }],
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Venda registada com sucesso')
  })

  it('should return 400 when body is invalid on create', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/pos',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('should return 404 when resort not found on create', async () => {
    mockPrisma.resort.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/pos',
      payload: {
        resortId: RESORT_CUID,
        paymentMethod: 'CASH',
        items: [{ productId: PRODUCT_CUID, qty: 1, unitPrice: 500, taxRate: 14 }],
      },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Resort não encontrado')
  })

  it('should return 400 for ROOM_CHARGE without reservationId', async () => {
    mockPrisma.resort.findUnique.mockResolvedValue({ id: RESORT_CUID, name: 'Cabo Ledo' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/pos',
      payload: {
        resortId: RESORT_CUID,
        paymentMethod: 'ROOM_CHARGE',
        items: [{ productId: PRODUCT_CUID, qty: 1, unitPrice: 500, taxRate: 14 }],
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Reserva obrigatória para débito no quarto')
  })

  it('should return 400 when products not found or inactive', async () => {
    mockPrisma.resort.findUnique.mockResolvedValue({ id: RESORT_CUID, name: 'Cabo Ledo' })
    mockPrisma.product.findMany.mockResolvedValue([]) // no products found

    const res = await app.inject({
      method: 'POST',
      url: '/v1/pos',
      payload: {
        resortId: RESORT_CUID,
        paymentMethod: 'CASH',
        items: [{ productId: PRODUCT_CUID, qty: 1, unitPrice: 500, taxRate: 14 }],
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Um ou mais produtos não encontrados ou inativos')
  })

  // ── PATCH /:id/cancel — Cancelar venda ──

  it('should cancel a pending sale', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue({ id: 'sale-1', status: 'PENDING' })
    mockPrisma.sale.update.mockResolvedValue({ id: 'sale-1', status: 'CANCELLED' })

    const res = await app.inject({ method: 'PATCH', url: '/v1/pos/sale-1/cancel' })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Venda cancelada')
  })

  it('should return 404 when cancelling non-existent sale', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'PATCH', url: '/v1/pos/nonexistent/cancel' })

    expect(res.statusCode).toBe(404)
  })

  it('should return 400 when sale is already cancelled', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue({ id: 'sale-1', status: 'CANCELLED' })

    const res = await app.inject({ method: 'PATCH', url: '/v1/pos/sale-1/cancel' })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Venda já cancelada')
  })

  it('should return 400 when sale is already invoiced', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue({ id: 'sale-1', status: 'INVOICED' })

    const res = await app.inject({ method: 'PATCH', url: '/v1/pos/sale-1/cancel' })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('nota de crédito')
  })
})

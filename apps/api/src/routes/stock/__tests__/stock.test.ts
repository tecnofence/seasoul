import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import stockRoutes from '../index.js'

const mockDecimal = (value: number): Record<string, any> => ({
  lessThanOrEqualTo: vi.fn((other: any) => value <= (other?.value ?? other)),
  plus: vi.fn((other: any) => mockDecimal(value + (other?.value ?? other))),
  minus: vi.fn((other: any) => mockDecimal(value - (other?.value ?? other))),
  isNegative: vi.fn(() => value < 0),
  toDecimalPlaces: vi.fn(() => mockDecimal(value)),
  value,
  toString: () => String(value),
})

const mockPrisma = {
  stockItem: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  stockMovement: {
    create: vi.fn(),
  },
  $queryRaw: vi.fn(),
  $transaction: vi.fn(),
}

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

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Stock API — /v1/stock', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(stockRoutes, { prefix: '/v1/stock' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — Listar itens de stock ──

  it('should list stock items with pagination (200)', async () => {
    const items = [
      { id: 'item-1', name: 'Cerveja', currentQty: mockDecimal(50), minQty: mockDecimal(10), resort: { id: 'r1', name: 'Cabo Ledo' } },
    ]
    mockPrisma.stockItem.findMany.mockResolvedValue(items)
    mockPrisma.stockItem.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/stock?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
  })

  it('should filter stock items by resortId and department', async () => {
    mockPrisma.stockItem.findMany.mockResolvedValue([])
    mockPrisma.stockItem.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/stock?page=1&limit=10&resortId=resort-1&department=KITCHEN',
    })

    expect(res.statusCode).toBe(200)
  })

  // ── GET /alerts — Stock baixo ──

  it('should return low stock alerts (200)', async () => {
    const alerts = [{ id: 'item-1', name: 'Toalha', currentQty: 2, minQty: 10, resortName: 'Cabo Ledo' }]
    mockPrisma.$queryRaw.mockResolvedValue(alerts)

    const res = await app.inject({ method: 'GET', url: '/v1/stock/alerts' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  // ── GET /:id — Obter item de stock ──

  it('should return a stock item by ID (200)', async () => {
    const item = {
      id: 'item-1',
      name: 'Cerveja',
      currentQty: mockDecimal(50),
      minQty: mockDecimal(10),
      resort: { id: 'r1', name: 'Cabo Ledo' },
      movements: [],
    }
    mockPrisma.stockItem.findUnique.mockResolvedValue(item)

    const res = await app.inject({ method: 'GET', url: '/v1/stock/item-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('item-1')
  })

  it('should return 404 when stock item not found', async () => {
    mockPrisma.stockItem.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/stock/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Item não encontrado')
  })

  // ── POST / — Criar item de stock ──

  it('should create a stock item (201)', async () => {
    const created = { id: 'item-new', name: 'Azeite', resort: { id: 'r1', name: 'Cabo Ledo' } }
    mockPrisma.stockItem.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/stock',
      payload: {
        name: 'Azeite',
        unit: 'litros',
        department: 'KITCHEN',
        resortId: 'cm1234567890abcdefghijklm',
        currentQty: 100,
        minQty: 20,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Item de stock criado')
  })

  it('should return 400 when create body is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/stock',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('should return 403 for unauthorized user on create', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(stockRoutes, { prefix: '/v1/stock' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/stock',
      payload: {
        name: 'Azeite',
        unit: 'litros',
        department: 'KITCHEN',
        resortId: 'cm1234567890abcdefghijklm',
        currentQty: 100,
        minQty: 20,
      },
    })

    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('Sem permissão')
    await staffApp.close()
  })

  // ── PUT /:id — Atualizar item de stock ──

  it('should update a stock item (200)', async () => {
    mockPrisma.stockItem.findUnique.mockResolvedValue({ id: 'item-1', name: 'Cerveja' })
    mockPrisma.stockItem.update.mockResolvedValue({ id: 'item-1', name: 'Cerveja Premium' })

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/stock/item-1',
      payload: { name: 'Cerveja Premium' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Item atualizado')
  })

  it('should return 404 when updating non-existent item', async () => {
    mockPrisma.stockItem.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/stock/nonexistent',
      payload: { name: 'Updated' },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── POST /movement — Registar movimento ──

  it('should create a stock movement IN (201)', async () => {
    const item = { id: 'cm1234567890abcdefghijklm', currentQty: mockDecimal(50) }
    mockPrisma.stockItem.findUnique.mockResolvedValue(item)
    const movement = { id: 'mov-1', type: 'IN', qty: 10, stockItemId: 'cm1234567890abcdefghijklm' }
    mockPrisma.$transaction.mockResolvedValue([movement, {}])

    const res = await app.inject({
      method: 'POST',
      url: '/v1/stock/movement',
      payload: {
        stockItemId: 'cm1234567890abcdefghijklm',
        type: 'IN',
        qty: 10,
        reason: 'Reposicao',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toContain('Movimento registado')
  })

  it('should return 404 for movement on non-existent stock item', async () => {
    mockPrisma.stockItem.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/stock/movement',
      payload: {
        stockItemId: 'cm0000000000000000000000n',
        type: 'IN',
        qty: 10,
        reason: 'Reposicao',
      },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Item de stock não encontrado')
  })

  it('should return 400 for OUT movement with insufficient stock', async () => {
    const item = {
      id: 'cm1234567890abcdefghijklm',
      currentQty: mockDecimal(5),
    }
    mockPrisma.stockItem.findUnique.mockResolvedValue(item)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/stock/movement',
      payload: {
        stockItemId: 'cm1234567890abcdefghijklm',
        type: 'OUT',
        qty: 100,
        reason: 'Grande saida',
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('Stock insuficiente')
  })

  it('should return 403 for unauthorized user on movement', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(stockRoutes, { prefix: '/v1/stock' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/stock/movement',
      payload: {
        stockItemId: 'item-1',
        type: 'IN',
        qty: 10,
        reason: 'Test',
      },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })
})

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──────────────────────

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Lojas
const storeListQuery = paginationQuery.extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'TEMPORARILY_CLOSED']).optional(),
  search: z.string().optional(),
})

const createStoreSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  managerId: z.string().optional(),
  managerName: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TEMPORARILY_CLOSED']).default('ACTIVE'),
  openingHours: z.string().optional(),
  notes: z.string().optional(),
})

const updateStoreSchema = createStoreSchema.partial()

// Vendas
const saleListQuery = paginationQuery.extend({
  storeId: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'MOBILE_PAYMENT', 'MIXED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

const saleItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  sku: z.string().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
})

const createSaleSchema = z.object({
  storeId: z.string().min(1),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerNif: z.string().optional(),
  items: z.array(saleItemSchema).min(1),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'MOBILE_PAYMENT', 'MIXED']),
  notes: z.string().optional(),
})

// Resumo
const summaryQuery = z.object({
  storeId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

// ── Rotas ─────────────────────────────────────

export default async function retailRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ═══════════════════════════════════════════
  // LOJAS
  // ═══════════════════════════════════════════

  // ── GET /stores — Listar lojas ──
  app.get('/stores', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = storeListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.retailStore.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { sales: true } } },
      }),
      app.prisma.retailStore.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /stores/:id — Obter loja por ID ──
  app.get<{ Params: { id: string } }>('/stores/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const store = await app.prisma.retailStore.findFirst({
      where,
      include: { _count: { select: { sales: true } } },
    })

    if (!store) {
      return reply.code(404).send({ error: 'Loja não encontrada' })
    }

    return reply.send({ data: store })
  })

  // ── POST /stores — Criar loja ──
  app.post('/stores', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createStoreSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const store = await app.prisma.retailStore.create({
      data: {
        tenantId: user.tenantId,
        ...parsed.data,
      },
    })

    return reply.code(201).send({ data: store, message: 'Loja criada com sucesso' })
  })

  // ── PATCH /stores/:id — Atualizar loja ──
  app.patch<{ Params: { id: string } }>('/stores/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateStoreSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.retailStore.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Loja não encontrada' })
    }

    const store = await app.prisma.retailStore.update({
      where: { id: request.params.id },
      data: parsed.data,
    })

    return reply.send({ data: store, message: 'Loja atualizada com sucesso' })
  })

  // ═══════════════════════════════════════════
  // VENDAS
  // ═══════════════════════════════════════════

  // ── GET /sales — Listar vendas ──
  app.get('/sales', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = saleListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, storeId, paymentMethod, dateFrom, dateTo } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (storeId) where.storeId = storeId
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.createdAt = dateFilter
    }

    const [data, total] = await Promise.all([
      app.prisma.retailSale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { store: { select: { id: true, name: true } } },
      }),
      app.prisma.retailSale.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /sales/:id — Obter venda por ID ──
  app.get<{ Params: { id: string } }>('/sales/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const sale = await app.prisma.retailSale.findFirst({
      where,
      include: { store: { select: { id: true, name: true } } },
    })

    if (!sale) {
      return reply.code(404).send({ error: 'Venda não encontrada' })
    }

    return reply.send({ data: sale })
  })

  // ── POST /sales — Criar venda ──
  app.post('/sales', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createSaleSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    // Verificar que a loja pertence ao tenant
    const store = await app.prisma.retailStore.findFirst({
      where: { id: parsed.data.storeId, tenantId: user.tenantId },
    })
    if (!store) {
      return reply.code(404).send({ error: 'Loja não encontrada neste tenant' })
    }

    // Calcular totais com Decimal
    let subtotal = new Decimal('0')
    const itemsWithTotals = parsed.data.items.map((item) => {
      const lineTotal = new Decimal(String(item.unitPrice))
        .times(item.quantity)
        .minus(new Decimal(String(item.discount)))
        .toDecimalPlaces(2)
      subtotal = subtotal.plus(lineTotal)
      return { ...item, lineTotal: lineTotal.toNumber() }
    })

    const taxRate = new Decimal('0.14') // IVA Angola 14%
    const taxAmount = subtotal.times(taxRate).toDecimalPlaces(2)
    const totalAmount = subtotal.plus(taxAmount).toDecimalPlaces(2)

    const sale = await app.prisma.retailSale.create({
      data: {
        tenantId: user.tenantId,
        storeId: parsed.data.storeId,
        soldById: user.id,
        customerId: parsed.data.customerId || null,
        customerName: parsed.data.customerName || null,
        customerNif: parsed.data.customerNif || null,
        items: itemsWithTotals,
        subtotal,
        taxAmount,
        totalAmount,
        paymentMethod: parsed.data.paymentMethod,
        notes: parsed.data.notes || null,
      },
      include: { store: { select: { id: true, name: true } } },
    })

    return reply.code(201).send({ data: sale, message: 'Venda registada com sucesso' })
  })

  // ═══════════════════════════════════════════
  // RESUMO DE VENDAS
  // ═══════════════════════════════════════════

  // ── GET /summary — Resumo de vendas: total, receita, ticket médio ──
  app.get('/summary', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = summaryQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { storeId, dateFrom, dateTo } = parsed.data

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (storeId) where.storeId = storeId
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = new Date(dateFrom)
      if (dateTo) dateFilter.lte = new Date(dateTo)
      where.createdAt = dateFilter
    }

    const [aggregation, totalSales] = await Promise.all([
      app.prisma.retailSale.aggregate({
        where,
        _sum: { totalAmount: true },
        _avg: { totalAmount: true },
      }),
      app.prisma.retailSale.count({ where }),
    ])

    return reply.send({
      data: {
        totalSales,
        totalRevenue: aggregation._sum.totalAmount || new Decimal('0'),
        averageTicket: aggregation._avg.totalAmount || new Decimal('0'),
      },
    })
  })
}

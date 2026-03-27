import type { FastifyInstance } from 'fastify'
import { Prisma, Decimal } from '@prisma/client/runtime/library'
import { createStockItemSchema, updateStockItemSchema, stockMovementSchema, listStockQuery } from './schemas.js'

export default async function stockRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar itens de stock ──
  app.get('/', async (request, reply) => {
    const parsed = listStockQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, resortId, department, lowStock } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (resortId) where.resortId = resortId
    if (department) where.department = department

    const [items, total] = await Promise.all([
      app.prisma.stockItem.findMany({
        where,
        include: { resort: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      app.prisma.stockItem.count({ where }),
    ])

    // Adicionar flag isLow e filtrar se lowStock=true
    let data = items.map((item) => ({
      ...item,
      isLow: item.currentQty.lessThanOrEqualTo(item.minQty),
    }))

    if (lowStock) {
      data = data.filter((item) => item.isLow)
    }

    return reply.send({ data, total: lowStock ? data.length : total, page, limit, totalPages: Math.ceil((lowStock ? data.length : total) / limit) })
  })

  // ── GET /alerts — Itens com stock baixo (FIX: query parametrizada) ──
  app.get('/alerts', async (request, reply) => {
    const { resortId } = request.query as { resortId?: string }

    // Query segura sem interpolação de strings
    const items = resortId
      ? await app.prisma.$queryRaw`
          SELECT s.*, r.name as "resortName"
          FROM "StockItem" s
          JOIN "Resort" r ON r.id = s."resortId"
          WHERE s."currentQty" <= s."minQty" AND s."resortId" = ${resortId}
          ORDER BY s."currentQty" ASC`
      : await app.prisma.$queryRaw`
          SELECT s.*, r.name as "resortName"
          FROM "StockItem" s
          JOIN "Resort" r ON r.id = s."resortId"
          WHERE s."currentQty" <= s."minQty"
          ORDER BY s."currentQty" ASC`

    return reply.send({ data: items, total: (items as any[]).length })
  })

  // ── GET /:id — Obter item de stock com movimentos ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const item = await app.prisma.stockItem.findUnique({
      where: { id: request.params.id },
      include: {
        resort: { select: { id: true, name: true } },
        movements: {
          include: { supplier: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!item) {
      return reply.code(404).send({ error: 'Item não encontrado' })
    }

    return reply.send({ data: { ...item, isLow: item.currentQty.lessThanOrEqualTo(item.minQty) } })
  })

  // ── POST / — Criar item de stock ──
  app.post('/', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'STOCK_MANAGER'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = createStockItemSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const item = await app.prisma.stockItem.create({
      data: {
        ...parsed.data,
        currentQty: new Decimal(String(parsed.data.currentQty)),
        minQty: new Decimal(String(parsed.data.minQty)),
      },
      include: { resort: { select: { id: true, name: true } } },
    })

    return reply.code(201).send({ data: item, message: 'Item de stock criado' })
  })

  // ── PUT /:id — Atualizar item de stock ──
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'STOCK_MANAGER'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = updateStockItemSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.stockItem.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Item não encontrado' })
    }

    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.minQty !== undefined) data.minQty = new Decimal(String(parsed.data.minQty))

    const item = await app.prisma.stockItem.update({
      where: { id: request.params.id },
      data,
    })

    return reply.send({ data: item, message: 'Item atualizado' })
  })

  // ── POST /movement — Registar movimento de stock ──
  app.post('/movement', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'STOCK_MANAGER'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = stockMovementSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { stockItemId, type, qty, reason, supplierId } = parsed.data

    const item = await app.prisma.stockItem.findUnique({ where: { id: stockItemId } })
    if (!item) {
      return reply.code(404).send({ error: 'Item de stock não encontrado' })
    }

    // Calcular nova quantidade
    const qtyDecimal = new Decimal(String(qty))
    let newQty: Decimal

    if (type === 'IN') {
      newQty = item.currentQty.plus(qtyDecimal)
    } else if (type === 'OUT') {
      newQty = item.currentQty.minus(qtyDecimal)
      if (newQty.isNegative()) {
        return reply.code(400).send({ error: `Stock insuficiente. Disponível: ${item.currentQty}` })
      }
    } else {
      // ADJUSTMENT — valor absoluto
      newQty = qtyDecimal
    }

    // Transação: criar movimento + atualizar quantidade
    const [movement] = await app.prisma.$transaction([
      app.prisma.stockMovement.create({
        data: {
          stockItemId,
          type,
          qty: qtyDecimal,
          reason,
          supplierId,
          createdBy: request.user.id,
        },
        include: { stockItem: { select: { id: true, name: true } }, supplier: { select: { id: true, name: true } } },
      }),
      app.prisma.stockItem.update({
        where: { id: stockItemId },
        data: { currentQty: newQty },
      }),
    ])

    return reply.code(201).send({ data: movement, message: `Movimento registado. Nova quantidade: ${newQty}` })
  })
}

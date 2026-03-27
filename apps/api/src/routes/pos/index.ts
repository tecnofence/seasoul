import type { FastifyInstance } from 'fastify'
import { Decimal } from '@prisma/client/runtime/library'
import { createSaleSchema, listSalesQuery } from './schemas.js'

export default async function posRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar vendas ──
  app.get('/', async (request, reply) => {
    const parsed = listSalesQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, resortId, status, paymentMethod, from, to } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (resortId) where.resortId = resortId
    if (status) where.status = status
    if (paymentMethod) where.paymentMethod = paymentMethod
    if (from || to) {
      where.createdAt = {}
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from)
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to)
    }

    const [data, total] = await Promise.all([
      app.prisma.sale.findMany({
        where,
        include: {
          items: { include: { product: { select: { id: true, name: true, category: true } } } },
          resort: { select: { id: true, name: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.sale.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter venda por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const sale = await app.prisma.sale.findUnique({
      where: { id: request.params.id },
      include: {
        items: { include: { product: true } },
        resort: { select: { id: true, name: true } },
        reservation: { select: { id: true, guestName: true, roomId: true } },
      },
    })

    if (!sale) {
      return reply.code(404).send({ error: 'Venda não encontrada' })
    }

    return reply.send({ data: sale })
  })

  // ── POST / — Criar venda (registar no POS) ──
  app.post('/', async (request, reply) => {
    const parsed = createSaleSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { resortId, reservationId, paymentMethod, items } = parsed.data

    // Verificar resort
    const resort = await app.prisma.resort.findUnique({ where: { id: resortId } })
    if (!resort) {
      return reply.code(404).send({ error: 'Resort não encontrado' })
    }

    // Se ROOM_CHARGE, verificar reserva ativa
    if (paymentMethod === 'ROOM_CHARGE') {
      if (!reservationId) {
        return reply.code(400).send({ error: 'Reserva obrigatória para débito no quarto' })
      }
      const reservation = await app.prisma.reservation.findUnique({ where: { id: reservationId } })
      if (!reservation || reservation.status !== 'CHECKED_IN') {
        return reply.code(400).send({ error: 'Reserva não está em check-in' })
      }
    }

    // Verificar produtos e calcular totais
    const productIds = items.map((i) => i.productId)
    const products = await app.prisma.product.findMany({ where: { id: { in: productIds }, active: true } })
    if (products.length !== productIds.length) {
      return reply.code(400).send({ error: 'Um ou mais produtos não encontrados ou inativos' })
    }

    // Calcular totais por item com Decimal para precisão financeira
    let totalAmount = new Decimal('0')
    let taxAmount = new Decimal('0')
    const saleItems = items.map((item) => {
      const unitPrice = new Decimal(String(item.unitPrice))
      const taxRate = new Decimal(String(item.taxRate))
      const itemTotal = unitPrice.times(item.qty)
      const itemTax = itemTotal.times(taxRate).dividedBy(100)
      totalAmount = totalAmount.plus(itemTotal).plus(itemTax)
      taxAmount = taxAmount.plus(itemTax)
      return {
        productId: item.productId,
        qty: item.qty,
        unitPrice,
        taxRate,
        total: itemTotal.plus(itemTax).toDecimalPlaces(2),
      }
    })

    const sale = await app.prisma.sale.create({
      data: {
        resortId,
        reservationId,
        operatorId: request.user.id,
        paymentMethod,
        totalAmount: totalAmount.toDecimalPlaces(2),
        taxAmount: taxAmount.toDecimalPlaces(2),
        status: 'PENDING',
        items: { create: saleItems },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
        resort: { select: { id: true, name: true } },
      },
    })

    return reply.code(201).send({ data: sale, message: 'Venda registada com sucesso' })
  })

  // ── PATCH /:id/cancel — Cancelar venda ──
  app.patch<{ Params: { id: string } }>('/:id/cancel', async (request, reply) => {
    const sale = await app.prisma.sale.findUnique({ where: { id: request.params.id } })
    if (!sale) {
      return reply.code(404).send({ error: 'Venda não encontrada' })
    }

    if (sale.status === 'CANCELLED') {
      return reply.code(400).send({ error: 'Venda já cancelada' })
    }

    if (sale.status === 'INVOICED') {
      return reply.code(400).send({ error: 'Não é possível cancelar venda já faturada. Emita nota de crédito.' })
    }

    const updated = await app.prisma.sale.update({
      where: { id: request.params.id },
      data: { status: 'CANCELLED' },
    })

    return reply.send({ data: updated, message: 'Venda cancelada' })
  })
}

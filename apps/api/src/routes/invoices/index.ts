import type { FastifyInstance } from 'fastify'
import { emitInvoiceSchema, listInvoicesQuery } from './schemas.js'

export default async function invoicesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar faturas emitidas ──
  app.get('/', async (request, reply) => {
    const parsed = listInvoicesQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, resortId, from, to } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      status: 'INVOICED',
      invoiceNumber: { not: null },
    }
    if (resortId) where.resortId = resortId
    if (from || to) {
      where.createdAt = {}
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from)
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to)
    }

    const [data, total] = await Promise.all([
      app.prisma.sale.findMany({
        where,
        include: {
          items: { include: { product: { select: { id: true, name: true } } } },
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

  // ── POST /emit — Emitir fatura para uma venda ──
  app.post('/emit', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'POS_OPERATOR'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão para emitir faturas' })
    }

    const parsed = emitInvoiceSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const sale = await app.prisma.sale.findUnique({ where: { id: parsed.data.saleId } })
    if (!sale) {
      return reply.code(404).send({ error: 'Venda não encontrada' })
    }

    if (sale.status === 'INVOICED') {
      return reply.code(400).send({ error: 'Fatura já emitida para esta venda' })
    }

    if (sale.status === 'CANCELLED') {
      return reply.code(400).send({ error: 'Não é possível faturar venda cancelada' })
    }

    // Gerar número de fatura sequencial por resort — em transação para evitar race conditions
    const updated = await app.prisma.$transaction(async (tx) => {
      const lastInvoice = await tx.sale.findFirst({
        where: { resortId: sale.resortId, invoiceNumber: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { invoiceNumber: true },
      })

      let sequence = 1
      if (lastInvoice?.invoiceNumber) {
        const match = lastInvoice.invoiceNumber.match(/\/(\d+)$/)
        if (match) sequence = parseInt(match[1], 10) + 1
      }

      const series = 'FT'
      const invoiceNumber = `${series} A/${String(sequence).padStart(5, '0')}`

      return tx.sale.update({
        where: { id: sale.id },
        data: {
          status: 'INVOICED',
          invoiceNumber,
          invoiceSeries: series,
        },
        include: {
          items: { include: { product: { select: { id: true, name: true } } } },
          resort: { select: { id: true, name: true } },
        },
      })
    })

    // TODO: Assinar com RSA e submeter à AGT
    // TODO: Gerar PDF e guardar no MinIO

    return reply.send({ data: updated, message: `Fatura ${updated.invoiceNumber} emitida com sucesso` })
  })

  // ── GET /:id — Obter fatura por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const sale = await app.prisma.sale.findUnique({
      where: { id: request.params.id },
      include: {
        items: { include: { product: true } },
        resort: { select: { id: true, name: true } },
        reservation: { select: { id: true, guestName: true, guestEmail: true } },
      },
    })

    if (!sale || !sale.invoiceNumber) {
      return reply.code(404).send({ error: 'Fatura não encontrada' })
    }

    return reply.send({ data: sale })
  })
}

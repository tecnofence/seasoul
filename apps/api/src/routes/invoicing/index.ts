import { createHash } from 'crypto'
import { FastifyInstance } from 'fastify'
import { generateSAFT } from '../../utils/saft'

// ── FATURAÇÃO UNIVERSAL ENGERIS ONE ──────────────
// Suporta: FT, FR, NC, ND, ORC, PF, RC, GT, AM, CS
// Modo Formação: série TREINO, não reporta à AGT

const DOC_TYPE_LABELS: Record<string, string> = {
  FT: 'Fatura', FR: 'Fatura-Recibo', NC: 'Nota de Crédito',
  ND: 'Nota de Débito', ORC: 'Orçamento', PF: 'Proforma',
  RC: 'Recibo', GT: 'Guia de Transporte', AM: 'Auto de Medição',
  CS: 'Contrato de Serviço',
}

function computeInvoiceHash(
  number: number,
  issuedAt: Date,
  totalAmount: number,
  previousHash: string
): string {
  // Format: "number;date;total;previousHash" — Angola AGT hash chain
  const dateStr = issuedAt.toISOString().split('T')[0] // YYYY-MM-DD
  const data = `${number};${dateStr};${totalAmount.toFixed(2)};${previousHash}`
  return createHash('sha256').update(data, 'utf8').digest('hex')
}

const EMPTY_HASH = '0'.repeat(64) // initial hash for first invoice in series

export default async function invoicingRoutes(app: FastifyInstance) {
  // ── Listar documentos fiscais ─────────────────
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }
    const query = request.query as {
      page?: string; limit?: string; type?: string; search?: string
      isTraining?: string; from?: string; to?: string; status?: string
    }

    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Number(query.limit) || 20)
    const skip = (page - 1) * limit

    const where: any = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (query.type) where.documentType = query.type
    if (query.isTraining !== undefined) where.isTraining = query.isTraining === 'true'
    if (query.status === 'cancelled') where.cancelledAt = { not: null }
    if (query.status === 'active') where.cancelledAt = null
    if (query.from || query.to) {
      where.createdAt = {}
      if (query.from) where.createdAt.gte = new Date(query.from)
      if (query.to) where.createdAt.lte = new Date(query.to)
    }
    if (query.search) {
      where.OR = [
        { fullNumber: { contains: query.search, mode: 'insensitive' } },
        { clientName: { contains: query.search, mode: 'insensitive' } },
        { clientNif: { contains: query.search } },
      ]
    }

    const [invoices, total] = await Promise.all([
      app.prisma.invoice.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      app.prisma.invoice.count({ where }),
    ])

    return reply.send({
      data: invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── Detalhe de um documento ────────────────────
  app.get<{ Params: { id: string } }>('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }
    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const invoice = await app.prisma.invoice.findFirst({
      where,
      include: { items: true, series: true },
    })

    if (!invoice) return reply.status(404).send({ error: 'Documento não encontrado' })
    return reply.send({ data: invoice })
  })

  // ── Emitir novo documento fiscal ───────────────
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string }
    const body = request.body as {
      documentType: string
      clientName: string
      clientNif?: string
      clientAddress?: string
      clientEmail?: string
      clientPhone?: string
      currency?: string
      paymentMethod?: string
      dueDate?: string
      relatedInvoiceId?: string
      notes?: string
      resortId?: string
      clientCativoType?: string  // 'PRIVATE' | 'STATE' | 'BANK' | 'OIL'
      items: {
        description: string
        quantity: number
        unitPrice: number
        taxRate?: number
        discount?: number
        unit?: string
        productId?: string
      }[]
    }

    if (!body.items?.length) {
      return reply.status(400).send({ error: 'Pelo menos um item é obrigatório' })
    }

    const tenantId = user.tenantId
    if (!tenantId) return reply.status(400).send({ error: 'Utilizador sem tenant' })

    // Verificar se o tenant está em modo formação
    const tenant = await app.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { trainingMode: true },
    })

    const isTraining = tenant?.trainingMode ?? false
    const seriesCode = isTraining ? 'TREINO' : 'A'

    // Calcular valores dos items com precisão Decimal
    const taxRate14 = 14
    const processedItems = body.items.map((item) => {
      const qty = Number(item.quantity)
      const price = Number(item.unitPrice)
      const tax = Number(item.taxRate ?? taxRate14)
      const disc = Number(item.discount ?? 0)
      const subtotal = qty * price
      const discountAmount = subtotal * (disc / 100)
      const taxableAmount = subtotal - discountAmount
      const taxAmount = taxableAmount * (tax / 100)
      const total = Math.round((taxableAmount + taxAmount) * 100) / 100

      return {
        description: item.description,
        quantity: qty,
        unitPrice: price,
        taxRate: tax,
        discount: disc,
        total,
        productId: item.productId || null,
        unit: item.unit || 'un',
      }
    })

    const subtotal = Math.round(processedItems.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (1 - i.discount / 100)), 0) * 100) / 100
    const taxAmount = Math.round(processedItems.reduce((sum, i) => {
      const base = i.quantity * i.unitPrice * (1 - i.discount / 100)
      return sum + base * (i.taxRate / 100)
    }, 0) * 100) / 100
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100

    // Imposto Cativo — retenção na fonte (Art. 21.º/6 CIVA)
    const CATIVO_RATES: Record<string, number> = {
      PRIVATE: 0,    // clientes privados: hotel remete 100% à AGT
      STATE:   100,  // entidades estatais: retêm 100% do IVA
      BANK:    50,   // bancos/seguradoras/telecoms: retêm 50%
      OIL:     100,  // empresas petrolíferas: retêm 100%
    }
    const cativoPct = CATIVO_RATES[body.clientCativoType ?? 'PRIVATE'] ?? 0
    const cativoAmount = Math.round(taxAmount * (cativoPct / 100) * 100) / 100

    // Transação atómica: série + número + fatura (previne race condition)
    const invoice = await app.prisma.$transaction(async (tx) => {
      // Obter ou criar série
      const series = await tx.invoiceSeries.upsert({
        where: {
          tenantId_documentType_series: {
            tenantId,
            documentType: body.documentType as any,
            series: seriesCode,
          },
        },
        create: {
          tenantId,
          documentType: body.documentType as any,
          series: seriesCode,
          prefix: isTraining ? `${body.documentType}-TREINO` : body.documentType,
          isTraining,
        },
        update: {},
      })

      // Gerar número sequencial (atómico dentro da transação)
      const updatedSeries = await tx.invoiceSeries.update({
        where: { id: series.id },
        data: { lastNumber: { increment: 1 } },
      })

      const number = updatedSeries.lastNumber
      const paddedNumber = String(number).padStart(5, '0')
      const fullNumber = isTraining
        ? `${body.documentType}-TREINO ${seriesCode}/${paddedNumber}`
        : `${body.documentType} ${seriesCode}/${paddedNumber}`

      // Buscar hash do documento anterior nesta série (cadeia de integridade)
      const prevInvoice = await tx.invoice.findFirst({
        where: { seriesId: series.id, cancelledAt: null },
        orderBy: { number: 'desc' },
        select: { agtHash: true },
      })
      const previousHash = prevInvoice?.agtHash ?? EMPTY_HASH
      const issuedAt = new Date()
      const invoiceHash = computeInvoiceHash(number, issuedAt, totalAmount, previousHash)

      // Criar fatura com items
      return tx.invoice.create({
        data: {
          tenantId,
          resortId: body.resortId || null,
          seriesId: series.id,
          documentType: body.documentType as any,
          number,
          fullNumber,
          isTraining,
          clientName: body.clientName,
          clientNif: body.clientNif || null,
          clientAddress: body.clientAddress || null,
          clientEmail: body.clientEmail || null,
          clientPhone: body.clientPhone || null,
          subtotal,
          taxAmount,
          totalAmount,
          currency: (body.currency || 'AOA') as any,
          paymentMethod: body.paymentMethod as any || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          relatedInvoiceId: body.relatedInvoiceId || null,
          notes: body.notes || null,
          createdBy: user.id,
          agtHash: invoiceHash,
          agtPreviousHash: previousHash,
          agtStatus: 'pending',
          clientCativoType: body.clientCativoType || 'PRIVATE',
          cativoAmount: cativoAmount,
          items: {
            create: processedItems,
          },
        },
        include: { items: true },
      })
    })

    // Registar na auditoria
    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: isTraining ? 'TRAINING_INVOICE_EMIT' : 'INVOICE_EMIT',
        entity: 'Invoice',
        entityId: invoice.id,
        after: {
          fullNumber: invoice.fullNumber,
          documentType: invoice.documentType,
          totalAmount: Number(invoice.totalAmount),
          clientName: invoice.clientName,
          isTraining,
        },
      },
    })

    return reply.status(201).send({ data: invoice })
  })

  // ── Anular documento ──────────────────────────
  app.post<{ Params: { id: string } }>('/:id/cancel', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; role: string; tenantId?: string }
    const body = request.body as { reason: string }

    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão para anular documentos' })
    }

    if (!body.reason) {
      return reply.status(400).send({ error: 'Motivo de anulação é obrigatório' })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const invoice = await app.prisma.invoice.findFirst({ where })

    if (!invoice) return reply.status(404).send({ error: 'Documento não encontrado' })
    if (invoice.cancelledAt) return reply.status(400).send({ error: 'Documento já anulado' })

    const updated = await app.prisma.invoice.update({
      where: { id: request.params.id },
      data: {
        cancelledAt: new Date(),
        cancelReason: body.reason,
      },
    })

    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'INVOICE_CANCEL',
        entity: 'Invoice',
        entityId: invoice.id,
        before: { fullNumber: invoice.fullNumber, status: 'active' },
        after: { status: 'cancelled', reason: body.reason },
      },
    })

    return reply.send({ data: updated })
  })

  // ── Emitir Nota de Crédito sobre documento existente ──
  app.post<{ Params: { id: string } }>('/:id/credit-note', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const body = request.body as {
      reason: string
      items?: {
        description: string
        quantity: number
        unitPrice: number
        taxRate?: number
        discount?: number
      }[]
      // Se items não fornecido: NC pelo valor total da fatura original
    }

    if (!body.reason) {
      return reply.status(400).send({ error: 'Motivo da nota de crédito é obrigatório' })
    }

    const tenantId = user.tenantId
    if (!tenantId) return reply.status(400).send({ error: 'Utilizador sem tenant' })

    const where: Record<string, unknown> = { id: request.params.id, tenantId }
    const original = await app.prisma.invoice.findFirst({
      where,
      include: { items: true, series: true },
    })

    if (!original) return reply.status(404).send({ error: 'Fatura original não encontrada' })
    if (original.cancelledAt) return reply.status(400).send({ error: 'Não é possível emitir NC sobre documento anulado' })
    if (original.documentType === 'NC') return reply.status(400).send({ error: 'Não é possível emitir NC sobre outra NC' })

    // Verificar se já existe NC para esta fatura
    const existingNC = await app.prisma.invoice.findFirst({
      where: { relatedInvoiceId: original.id, documentType: 'NC', cancelledAt: null, tenantId },
    })
    if (existingNC) {
      return reply.status(400).send({ error: `Já existe NC ${existingNC.fullNumber} para esta fatura` })
    }

    // Usar items fornecidos ou copiar da fatura original (NC total)
    const ncItems = body.items ?? original.items.map(i => ({
      description: i.description,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      taxRate: Number(i.taxRate),
      discount: Number(i.discount),
    }))

    if (!ncItems.length) return reply.status(400).send({ error: 'Pelo menos um item é obrigatório' })

    const processedItems = ncItems.map((item) => {
      const qty = Number(item.quantity)
      const price = Number(item.unitPrice)
      const tax = Number(item.taxRate ?? 14)
      const disc = Number(item.discount ?? 0)
      const subtotal = qty * price
      const discountAmount = subtotal * (disc / 100)
      const taxableAmount = subtotal - discountAmount
      const taxAmount = taxableAmount * (tax / 100)
      const total = Math.round((taxableAmount + taxAmount) * 100) / 100
      return { description: item.description, quantity: qty, unitPrice: price, taxRate: tax, discount: disc, total, unit: 'un' }
    })

    const subtotal = Math.round(processedItems.reduce((s, i) => s + i.quantity * i.unitPrice * (1 - i.discount / 100), 0) * 100) / 100
    const taxAmount = Math.round(processedItems.reduce((s, i) => { const b = i.quantity * i.unitPrice * (1 - i.discount / 100); return s + b * (i.taxRate / 100) }, 0) * 100) / 100
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100

    const isTraining = original.isTraining

    const nc = await app.prisma.$transaction(async (tx) => {
      const series = await tx.invoiceSeries.upsert({
        where: { tenantId_documentType_series: { tenantId, documentType: 'NC', series: isTraining ? 'TREINO' : 'A' } },
        create: { tenantId, documentType: 'NC', series: isTraining ? 'TREINO' : 'A', prefix: isTraining ? 'NC-TREINO' : 'NC', isTraining },
        update: {},
      })
      const updatedSeries = await tx.invoiceSeries.update({ where: { id: series.id }, data: { lastNumber: { increment: 1 } } })
      const number = updatedSeries.lastNumber
      const fullNumber = isTraining
        ? `NC-TREINO TREINO/${String(number).padStart(5, '0')}`
        : `NC A/${String(number).padStart(5, '0')}`

      // Hash chain para a NC
      const prevInvoice = await tx.invoice.findFirst({
        where: { seriesId: series.id, cancelledAt: null },
        orderBy: { number: 'desc' },
        select: { agtHash: true },
      })
      const previousHash = prevInvoice?.agtHash ?? EMPTY_HASH
      const issuedAt = new Date()
      const invoiceHash = computeInvoiceHash(number, issuedAt, totalAmount, previousHash)

      return tx.invoice.create({
        data: {
          tenantId,
          resortId: original.resortId,
          seriesId: series.id,
          documentType: 'NC',
          number,
          fullNumber,
          isTraining,
          clientName: original.clientName,
          clientNif: original.clientNif,
          clientAddress: original.clientAddress,
          clientEmail: original.clientEmail,
          clientPhone: original.clientPhone,
          subtotal,
          taxAmount,
          totalAmount,
          currency: original.currency,
          agtHash: invoiceHash,
          agtPreviousHash: previousHash,
          agtStatus: 'pending',
          relatedInvoiceId: original.id,
          notes: body.reason,
          createdBy: user.id,
          clientCativoType: original.clientCativoType,
          cativoAmount: original.cativoAmount,
          items: { create: processedItems },
        },
        include: { items: true },
      })
    })

    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREDIT_NOTE_EMIT',
        entity: 'Invoice',
        entityId: nc.id,
        after: { fullNumber: nc.fullNumber, relatedInvoice: original.fullNumber, reason: body.reason },
      },
    })

    return reply.status(201).send({ data: nc })
  })

  // ── Totais / Resumo ────────────────────────────
  app.get('/summary', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }
    const query = request.query as { from?: string; to?: string; isTraining?: string }

    const where: any = { cancelledAt: null }
    if (user.tenantId) where.tenantId = user.tenantId
    if (query.isTraining !== undefined) where.isTraining = query.isTraining === 'true'
    if (query.from || query.to) {
      where.createdAt = {}
      if (query.from) where.createdAt.gte = new Date(query.from)
      if (query.to) where.createdAt.lte = new Date(query.to)
    }

    const invoices = await app.prisma.invoice.groupBy({
      by: ['documentType'],
      where,
      _count: { id: true },
      _sum: { totalAmount: true },
    })

    const summary = invoices.map((g) => ({
      type: g.documentType,
      label: DOC_TYPE_LABELS[g.documentType] ?? g.documentType,
      count: g._count.id,
      total: Number(g._sum.totalAmount ?? 0),
    }))

    return reply.send({ data: summary })
  })

  // ── Exportar SAF-T Angola ──────────────────────
  // GET /v1/invoicing/saft?year=2026&month=3 (month opcional — sem month = ano completo)
  app.get('/saft', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }
    const query = request.query as { year?: string; month?: string }

    const tenantId = user.tenantId
    if (!tenantId) return reply.status(400).send({ error: 'Utilizador sem tenant' })

    const year = Number(query.year) || new Date().getFullYear()
    const month = query.month ? Number(query.month) : null

    // Datas do período
    const startDate = month
      ? new Date(year, month - 1, 1)
      : new Date(year, 0, 1)
    const endDate = month
      ? new Date(year, month, 0, 23, 59, 59) // último dia do mês
      : new Date(year, 11, 31, 23, 59, 59)

    const [tenant, invoices] = await Promise.all([
      app.prisma.tenant.findUnique({ where: { id: tenantId } }),
      app.prisma.invoice.findMany({
        where: {
          tenantId,
          isTraining: false,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: { items: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    if (!tenant) return reply.status(404).send({ error: 'Tenant não encontrado' })

    const xml = generateSAFT({
      tenant: {
        name: tenant.name,
        nif: tenant.nif ?? '000000000',
        address: undefined,
        city: 'Luanda',
      },
      fiscalYear: year,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      softwareVersion: '1.0.0',
      invoices,
      currency: 'AOA',
    })

    const filename = month
      ? `SAFT_AO_${year}_${String(month).padStart(2, '0')}_${tenant.nif ?? 'EMPRESA'}.xml`
      : `SAFT_AO_${year}_${tenant.nif ?? 'EMPRESA'}.xml`

    reply.header('Content-Type', 'application/xml; charset=utf-8')
    reply.header('Content-Disposition', `attachment; filename="${filename}"`)
    return reply.send(xml)
  })

  // ── Tipos de documento disponíveis ─────────────
  app.get('/types', async (_request, reply) => {
    return reply.send({
      data: Object.entries(DOC_TYPE_LABELS).map(([code, label]) => ({ code, label })),
    })
  })
}

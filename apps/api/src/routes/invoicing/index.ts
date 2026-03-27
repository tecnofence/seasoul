import { FastifyInstance } from 'fastify'

// ── FATURAÇÃO UNIVERSAL ENGERIS ONE ──────────────
// Suporta: FT, FR, NC, ND, ORC, PF, RC, GT, AM, CS
// Modo Formação: série TREINO, não reporta à AGT

const DOC_TYPE_LABELS: Record<string, string> = {
  FT: 'Fatura', FR: 'Fatura-Recibo', NC: 'Nota de Crédito',
  ND: 'Nota de Débito', ORC: 'Orçamento', PF: 'Proforma',
  RC: 'Recibo', GT: 'Guia de Transporte', AM: 'Auto de Medição',
  CS: 'Contrato de Serviço',
}

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
    const invoice = await app.prisma.invoice.findUnique({
      where: { id: request.params.id },
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

    // Obter ou criar série
    const series = await app.prisma.invoiceSeries.upsert({
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

    // Calcular valores dos items
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
      const total = taxableAmount + taxAmount

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

    const subtotal = processedItems.reduce((sum, i) => sum + (i.quantity * i.unitPrice * (1 - i.discount / 100)), 0)
    const taxAmount = processedItems.reduce((sum, i) => {
      const base = i.quantity * i.unitPrice * (1 - i.discount / 100)
      return sum + base * (i.taxRate / 100)
    }, 0)
    const totalAmount = subtotal + taxAmount

    // Gerar número sequencial (atómico)
    const updatedSeries = await app.prisma.invoiceSeries.update({
      where: { id: series.id },
      data: { lastNumber: { increment: 1 } },
    })

    const number = updatedSeries.lastNumber
    const paddedNumber = String(number).padStart(5, '0')
    const fullNumber = isTraining
      ? `${body.documentType}-TREINO ${seriesCode}/${paddedNumber}`
      : `${body.documentType} ${seriesCode}/${paddedNumber}`

    // Criar fatura com items
    const invoice = await app.prisma.invoice.create({
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
        currency: body.currency || 'AOA',
        paymentMethod: body.paymentMethod as any || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        relatedInvoiceId: body.relatedInvoiceId || null,
        notes: body.notes || null,
        createdBy: user.id,
        items: {
          create: processedItems,
        },
      },
      include: { items: true },
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
    const user = request.user as { id: string; role: string }
    const body = request.body as { reason: string }

    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(user.role)) {
      return reply.status(403).send({ error: 'Sem permissão para anular documentos' })
    }

    if (!body.reason) {
      return reply.status(400).send({ error: 'Motivo de anulação é obrigatório' })
    }

    const invoice = await app.prisma.invoice.findUnique({
      where: { id: request.params.id },
    })

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

  // ── Tipos de documento disponíveis ─────────────
  app.get('/types', async (_request, reply) => {
    return reply.send({
      data: Object.entries(DOC_TYPE_LABELS).map(([code, label]) => ({ code, label })),
    })
  })
}

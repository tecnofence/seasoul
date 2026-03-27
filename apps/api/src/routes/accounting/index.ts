import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──

const listEntriesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  account: z.string().optional(),
  category: z.enum(['REVENUE', 'EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY']).optional(),
  reconciled: z.enum(['true', 'false']).optional(),
})

const createEntrySchema = z.object({
  entryNumber: z.string().optional(),
  date: z.coerce.date(),
  description: z.string().min(1),
  account: z.string().min(1),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  category: z.enum(['REVENUE', 'EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY']).optional(),
  reference: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
})

const updateEntrySchema = z.object({
  entryNumber: z.string().optional(),
  date: z.coerce.date().optional(),
  description: z.string().min(1).optional(),
  account: z.string().min(1).optional(),
  debit: z.number().min(0).optional(),
  credit: z.number().min(0).optional(),
  category: z.enum(['REVENUE', 'EXPENSE', 'ASSET', 'LIABILITY', 'EQUITY']).optional(),
  reference: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
})

// ── Rotas de Contabilidade ──

export default async function accountingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ══════════════════════════════════════════════
  // LANÇAMENTOS CONTABILÍSTICOS
  // ══════════════════════════════════════════════

  // ── GET / — Listar lançamentos ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listEntriesQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, dateFrom, dateTo, account, category, reconciled } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (account) where.account = account
    if (category) where.category = category
    if (reconciled !== undefined) where.reconciled = reconciled === 'true'
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = dateFrom
      if (dateTo) dateFilter.lte = dateTo
      where.date = dateFilter
    }

    const [data, total] = await Promise.all([
      app.prisma.accountingEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      app.prisma.accountingEntry.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /balance — Resumo: total débito, crédito, saldo por categoria ──
  app.get('/balance', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId

    const entries = await app.prisma.accountingEntry.findMany({
      where,
      select: { debit: true, credit: true, category: true },
    })

    const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit), 0)
    const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit), 0)
    const balance = totalDebit - totalCredit

    // Agrupar por categoria
    const byCategory: Record<string, { debit: number; credit: number; balance: number }> = {}
    for (const entry of entries) {
      const cat = entry.category || 'SEM_CATEGORIA'
      if (!byCategory[cat]) {
        byCategory[cat] = { debit: 0, credit: 0, balance: 0 }
      }
      byCategory[cat].debit += Number(entry.debit)
      byCategory[cat].credit += Number(entry.credit)
      byCategory[cat].balance = byCategory[cat].debit - byCategory[cat].credit
    }

    return reply.send({
      data: {
        totalDebit,
        totalCredit,
        balance,
        byCategory,
      },
    })
  })

  // ── GET /trial-balance — Balancete: agrupar por conta, somar débito/crédito ──
  app.get('/trial-balance', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId

    const entries = await app.prisma.accountingEntry.findMany({
      where,
      select: { account: true, debit: true, credit: true },
    })

    // Agrupar por conta
    const byAccount: Record<string, { account: string; debit: number; credit: number; balance: number }> = {}
    for (const entry of entries) {
      if (!byAccount[entry.account]) {
        byAccount[entry.account] = { account: entry.account, debit: 0, credit: 0, balance: 0 }
      }
      byAccount[entry.account].debit += Number(entry.debit)
      byAccount[entry.account].credit += Number(entry.credit)
      byAccount[entry.account].balance = byAccount[entry.account].debit - byAccount[entry.account].credit
    }

    const data = Object.values(byAccount).sort((a, b) => a.account.localeCompare(b.account))

    return reply.send({ data })
  })

  // ── POST / — Criar lançamento ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createEntrySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const entry = await app.prisma.accountingEntry.create({
      data: {
        tenantId: user.tenantId,
        entryNumber: parsed.data.entryNumber || null,
        date: parsed.data.date,
        description: parsed.data.description,
        account: parsed.data.account,
        debit: new Decimal(parsed.data.debit),
        credit: new Decimal(parsed.data.credit),
        category: parsed.data.category || null,
        reference: parsed.data.reference || null,
        referenceId: parsed.data.referenceId || null,
        notes: parsed.data.notes || null,
      },
    })

    return reply.code(201).send({ data: entry, message: 'Lançamento criado com sucesso' })
  })

  // ── PATCH /:id — Atualizar lançamento ──
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateEntrySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.accountingEntry.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Lançamento não encontrado' })
    }

    if (existing.reconciled) {
      return reply.code(400).send({ error: 'Não é possível alterar um lançamento já reconciliado' })
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.entryNumber !== undefined) updateData.entryNumber = parsed.data.entryNumber
    if (parsed.data.date !== undefined) updateData.date = parsed.data.date
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description
    if (parsed.data.account !== undefined) updateData.account = parsed.data.account
    if (parsed.data.debit !== undefined) updateData.debit = new Decimal(parsed.data.debit)
    if (parsed.data.credit !== undefined) updateData.credit = new Decimal(parsed.data.credit)
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category
    if (parsed.data.reference !== undefined) updateData.reference = parsed.data.reference
    if (parsed.data.referenceId !== undefined) updateData.referenceId = parsed.data.referenceId
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes

    const entry = await app.prisma.accountingEntry.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: entry, message: 'Lançamento atualizado com sucesso' })
  })

  // ── POST /:id/reconcile — Marcar como reconciliado ──
  app.post<{ Params: { id: string } }>('/:id/reconcile', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.accountingEntry.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Lançamento não encontrado' })
    }

    if (existing.reconciled) {
      return reply.code(400).send({ error: 'Lançamento já está reconciliado' })
    }

    const entry = await app.prisma.accountingEntry.update({
      where: { id: request.params.id },
      data: { reconciled: true },
    })

    return reply.send({ data: entry, message: 'Lançamento reconciliado com sucesso' })
  })
}

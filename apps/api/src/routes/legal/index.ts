import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──

const listCasesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'HEARING', 'APPEALED', 'CLOSED', 'ARCHIVED']).optional(),
  caseType: z.enum(['CIVIL', 'CRIMINAL', 'LABOR', 'TAX', 'COMMERCIAL', 'ADMINISTRATIVE', 'CONTRACT', 'OTHER']).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  search: z.string().optional(),
})

const createCaseSchema = z.object({
  caseNumber: z.string().optional(),
  title: z.string().min(1),
  caseType: z.enum(['CIVIL', 'CRIMINAL', 'LABOR', 'TAX', 'COMMERCIAL', 'ADMINISTRATIVE', 'CONTRACT', 'OTHER']),
  clientName: z.string().min(1),
  clientNif: z.string().optional(),
  court: z.string().optional(),
  judge: z.string().optional(),
  lawyer: z.string().min(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  filingDate: z.coerce.date().optional(),
  nextHearing: z.coerce.date().optional(),
  fees: z.number().min(0).optional(),
  notes: z.string().optional(),
  documents: z.array(z.string()).optional(),
})

const updateCaseSchema = z.object({
  caseNumber: z.string().optional(),
  title: z.string().min(1).optional(),
  caseType: z.enum(['CIVIL', 'CRIMINAL', 'LABOR', 'TAX', 'COMMERCIAL', 'ADMINISTRATIVE', 'CONTRACT', 'OTHER']).optional(),
  clientName: z.string().min(1).optional(),
  clientNif: z.string().optional(),
  court: z.string().optional(),
  judge: z.string().optional(),
  lawyer: z.string().min(1).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  filingDate: z.coerce.date().optional(),
  nextHearing: z.coerce.date().optional(),
  outcome: z.string().optional(),
  fees: z.number().min(0).optional(),
  notes: z.string().optional(),
  documents: z.array(z.string()).optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'HEARING', 'APPEALED', 'CLOSED', 'ARCHIVED']),
  outcome: z.string().optional(),
})

// ── Rotas Jurídicas ──

export default async function legalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ══════════════════════════════════════════════
  // PROCESSOS JURÍDICOS
  // ══════════════════════════════════════════════

  // ── GET / — Listar processos ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listCasesQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, caseType, priority, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (caseType) where.caseType = caseType
    if (priority) where.priority = priority
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.legalCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.legalCase.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /upcoming-hearings — Audiências nos próximos 30 dias ──
  app.get('/upcoming-hearings', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    const where: Record<string, unknown> = {
      nextHearing: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
      status: { notIn: ['CLOSED', 'ARCHIVED'] },
    }
    if (user.tenantId) where.tenantId = user.tenantId

    const data = await app.prisma.legalCase.findMany({
      where,
      orderBy: { nextHearing: 'asc' },
    })

    return reply.send({ data })
  })

  // ── GET /:id — Obter processo ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const legalCase = await app.prisma.legalCase.findFirst({ where })

    if (!legalCase) {
      return reply.code(404).send({ error: 'Processo não encontrado' })
    }

    return reply.send({ data: legalCase })
  })

  // ── POST / — Criar processo ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createCaseSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const legalCase = await app.prisma.legalCase.create({
      data: {
        tenantId: user.tenantId,
        caseNumber: parsed.data.caseNumber || null,
        title: parsed.data.title,
        caseType: parsed.data.caseType,
        clientName: parsed.data.clientName,
        clientNif: parsed.data.clientNif || null,
        court: parsed.data.court || null,
        judge: parsed.data.judge || null,
        lawyer: parsed.data.lawyer,
        priority: parsed.data.priority,
        filingDate: parsed.data.filingDate || null,
        nextHearing: parsed.data.nextHearing || null,
        fees: parsed.data.fees !== undefined ? new Decimal(parsed.data.fees) : null,
        notes: parsed.data.notes || null,
        documents: parsed.data.documents || [],
      },
    })

    return reply.code(201).send({ data: legalCase, message: 'Processo criado com sucesso' })
  })

  // ── PATCH /:id — Atualizar processo ──
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateCaseSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.legalCase.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Processo não encontrado' })
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.caseNumber !== undefined) updateData.caseNumber = parsed.data.caseNumber
    if (parsed.data.title !== undefined) updateData.title = parsed.data.title
    if (parsed.data.caseType !== undefined) updateData.caseType = parsed.data.caseType
    if (parsed.data.clientName !== undefined) updateData.clientName = parsed.data.clientName
    if (parsed.data.clientNif !== undefined) updateData.clientNif = parsed.data.clientNif
    if (parsed.data.court !== undefined) updateData.court = parsed.data.court
    if (parsed.data.judge !== undefined) updateData.judge = parsed.data.judge
    if (parsed.data.lawyer !== undefined) updateData.lawyer = parsed.data.lawyer
    if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority
    if (parsed.data.filingDate !== undefined) updateData.filingDate = parsed.data.filingDate
    if (parsed.data.nextHearing !== undefined) updateData.nextHearing = parsed.data.nextHearing
    if (parsed.data.outcome !== undefined) updateData.outcome = parsed.data.outcome
    if (parsed.data.fees !== undefined) updateData.fees = new Decimal(parsed.data.fees)
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes
    if (parsed.data.documents !== undefined) updateData.documents = parsed.data.documents

    const legalCase = await app.prisma.legalCase.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: legalCase, message: 'Processo atualizado com sucesso' })
  })

  // ── PATCH /:id/status — Atualizar estado do processo ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.legalCase.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Processo não encontrado' })
    }

    const data: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.outcome) data.outcome = parsed.data.outcome

    const legalCase = await app.prisma.legalCase.update({
      where: { id: request.params.id },
      data,
    })

    return reply.send({ data: legalCase, message: `Estado do processo atualizado para ${parsed.data.status}` })
  })
}

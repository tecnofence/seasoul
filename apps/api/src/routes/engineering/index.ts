import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──

const listProjectsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['PLANNING', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  projectType: z.enum(['CONSTRUCTION', 'RENOVATION', 'MAINTENANCE', 'DESIGN', 'CONSULTATION', 'INSPECTION', 'OTHER']).optional(),
})

const createProjectSchema = z.object({
  branchId: z.string().optional(),
  name: z.string().min(1),
  code: z.string().optional(),
  clientName: z.string().min(1),
  clientNif: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  projectType: z.enum(['CONSTRUCTION', 'RENOVATION', 'MAINTENANCE', 'DESIGN', 'CONSULTATION', 'INSPECTION', 'OTHER']),
  description: z.string().optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  budget: z.number().optional(),
  currency: z.string().default('AOA'),
  startDate: z.coerce.date().optional(),
  estimatedEnd: z.coerce.date().optional(),
  managerId: z.string().optional(),
  notes: z.string().optional(),
})

const updateProjectStatusSchema = z.object({
  status: z.enum(['PLANNING', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
})

const listWorksQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  projectId: z.string().min(1),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']).optional(),
})

const createWorkSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  phase: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  assignedTeam: z.string().optional(),
  notes: z.string().optional(),
})

const updateWorkSchema = z.object({
  progress: z.number().int().min(0).max(100).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CANCELLED']).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  phase: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  assignedTeam: z.string().optional(),
  notes: z.string().optional(),
})

const createBudgetItemSchema = z.object({
  projectId: z.string().min(1),
  code: z.string().optional(),
  description: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  category: z.string().optional(),
  notes: z.string().optional(),
})

const listMeasurementsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  projectId: z.string().min(1),
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'INVOICED', 'REJECTED']).optional(),
})

const createMeasurementSchema = z.object({
  projectId: z.string().min(1),
  number: z.number().int().positive(),
  period: z.string().min(1),
  measuredBy: z.string().optional(),
  items: z.array(z.object({
    budgetItemId: z.string().optional(),
    description: z.string(),
    unit: z.string(),
    qty: z.number(),
    unitPrice: z.number(),
    total: z.number(),
  })),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
})

const updateMeasurementStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'INVOICED', 'REJECTED']),
})

// ── Rotas de Engenharia & Construção ──

export default async function engineeringRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ════════════════════════════════════════════
  // PROJETOS DE ENGENHARIA
  // ════════════════════════════════════════════

  // ── GET / — Listar projetos ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listProjectsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, projectType } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (status) where.status = status
    if (projectType) where.projectType = projectType

    const [projects, total] = await Promise.all([
      app.prisma.engineeringProject.findMany({
        where,
        include: {
          _count: {
            select: {
              works: true,
              budgetItems: true,
              measurements: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.engineeringProject.count({ where }),
    ])

    return reply.send({
      data: projects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── GET /:id — Obter projeto por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const project = await app.prisma.engineeringProject.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
      include: {
        _count: {
          select: {
            works: true,
            budgetItems: true,
            measurements: true,
          },
        },
        works: { orderBy: { createdAt: 'desc' }, take: 10 },
        budgetItems: { orderBy: { createdAt: 'desc' }, take: 10 },
        measurements: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    })

    if (!project) {
      return reply.code(404).send({ error: 'Projeto não encontrado' })
    }

    return reply.send({ data: project })
  })

  // ── POST / — Criar projeto ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createProjectSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { budget, ...rest } = parsed.data

    const project = await app.prisma.engineeringProject.create({
      data: {
        ...rest,
        tenantId: user.tenantId!,
        budget: budget !== undefined ? new Decimal(String(budget)) : undefined,
        startDate: rest.startDate ?? undefined,
        estimatedEnd: rest.estimatedEnd ?? undefined,
      },
      include: {
        _count: {
          select: { works: true, budgetItems: true, measurements: true },
        },
      },
    })

    return reply.code(201).send({ data: project, message: 'Projeto criado com sucesso' })
  })

  // ── PATCH /:id/status — Alterar estado do projeto ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateProjectStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.engineeringProject.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Projeto não encontrado' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.status === 'COMPLETED') {
      updateData.actualEnd = new Date()
    }

    const project = await app.prisma.engineeringProject.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: project, message: 'Estado do projeto atualizado' })
  })

  // ════════════════════════════════════════════
  // OBRAS (CONSTRUCTION WORKS)
  // ════════════════════════════════════════════

  // ── GET /works — Listar obras por projeto ──
  app.get('/works', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listWorksQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, projectId, status } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId, projectId }
    if (status) where.status = status

    const [works, total] = await Promise.all([
      app.prisma.constructionWork.findMany({
        where,
        include: { project: { select: { id: true, name: true, code: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.constructionWork.count({ where }),
    ])

    return reply.send({
      data: works,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── POST /works — Criar obra ──
  app.post('/works', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createWorkSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    // Verificar que o projeto pertence ao tenant
    const project = await app.prisma.engineeringProject.findFirst({
      where: { id: parsed.data.projectId, tenantId: user.tenantId },
    })
    if (!project) {
      return reply.code(404).send({ error: 'Projeto não encontrado' })
    }

    const work = await app.prisma.constructionWork.create({
      data: {
        ...parsed.data,
        tenantId: user.tenantId!,
        startDate: parsed.data.startDate ?? undefined,
        endDate: parsed.data.endDate ?? undefined,
      },
      include: { project: { select: { id: true, name: true, code: true } } },
    })

    return reply.code(201).send({ data: work, message: 'Obra criada com sucesso' })
  })

  // ── PATCH /works/:id — Atualizar obra (progresso/estado) ──
  app.patch<{ Params: { id: string } }>('/works/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateWorkSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.constructionWork.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Obra não encontrada' })
    }

    const work = await app.prisma.constructionWork.update({
      where: { id: request.params.id },
      data: parsed.data,
      include: { project: { select: { id: true, name: true, code: true } } },
    })

    return reply.send({ data: work, message: 'Obra atualizada' })
  })

  // ════════════════════════════════════════════
  // ORÇAMENTOS TÉCNICOS (BUDGET ITEMS)
  // ════════════════════════════════════════════

  // ── GET /budgets/:projectId — Listar itens de orçamento ──
  app.get<{ Params: { projectId: string } }>('/budgets/:projectId', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const page = Math.max(1, Number((request.query as Record<string, string>).page) || 1)
    const limit = Math.min(100, Math.max(1, Number((request.query as Record<string, string>).limit) || 20))
    const skip = (page - 1) * limit

    const where = { tenantId: user.tenantId, projectId: request.params.projectId }

    const [items, total] = await Promise.all([
      app.prisma.budgetItem.findMany({
        where,
        include: { project: { select: { id: true, name: true, code: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.budgetItem.count({ where }),
    ])

    // Calcular total do orçamento
    const budgetTotal = items.reduce(
      (sum, item) => sum.plus(item.total),
      new Decimal('0'),
    )

    return reply.send({
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      budgetTotal,
    })
  })

  // ── POST /budgets — Criar item de orçamento ──
  app.post('/budgets', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createBudgetItemSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    // Verificar que o projeto pertence ao tenant
    const project = await app.prisma.engineeringProject.findFirst({
      where: { id: parsed.data.projectId, tenantId: user.tenantId },
    })
    if (!project) {
      return reply.code(404).send({ error: 'Projeto não encontrado' })
    }

    const { quantity, unitPrice, ...rest } = parsed.data
    const qtyDecimal = new Decimal(String(quantity))
    const priceDecimal = new Decimal(String(unitPrice))
    const totalDecimal = qtyDecimal.mul(priceDecimal)

    const item = await app.prisma.budgetItem.create({
      data: {
        ...rest,
        tenantId: user.tenantId!,
        quantity: qtyDecimal,
        unitPrice: priceDecimal,
        total: totalDecimal,
      },
      include: { project: { select: { id: true, name: true, code: true } } },
    })

    return reply.code(201).send({ data: item, message: 'Item de orçamento criado' })
  })

  // ── DELETE /budgets/:id — Remover item de orçamento ──
  app.delete<{ Params: { id: string } }>('/budgets/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const existing = await app.prisma.budgetItem.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Item de orçamento não encontrado' })
    }

    await app.prisma.budgetItem.delete({ where: { id: request.params.id } })

    return reply.send({ data: null, message: 'Item de orçamento removido' })
  })

  // ════════════════════════════════════════════
  // AUTOS DE MEDIÇÃO (WORK MEASUREMENTS)
  // ════════════════════════════════════════════

  // ── GET /measurements — Listar autos de medição ──
  app.get('/measurements', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listMeasurementsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, projectId, status } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId, projectId }
    if (status) where.status = status

    const [measurements, total] = await Promise.all([
      app.prisma.workMeasurement.findMany({
        where,
        include: { project: { select: { id: true, name: true, code: true } } },
        skip,
        take: limit,
        orderBy: [{ number: 'desc' }],
      }),
      app.prisma.workMeasurement.count({ where }),
    ])

    return reply.send({
      data: measurements,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── GET /measurements/:id — Obter auto de medição por ID ──
  app.get<{ Params: { id: string } }>('/measurements/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const measurement = await app.prisma.workMeasurement.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
      include: { project: { select: { id: true, name: true, code: true, clientName: true } } },
    })

    if (!measurement) {
      return reply.code(404).send({ error: 'Auto de medição não encontrado' })
    }

    return reply.send({ data: measurement })
  })

  // ── POST /measurements — Criar auto de medição ──
  app.post('/measurements', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createMeasurementSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    // Verificar que o projeto pertence ao tenant
    const project = await app.prisma.engineeringProject.findFirst({
      where: { id: parsed.data.projectId, tenantId: user.tenantId },
    })
    if (!project) {
      return reply.code(404).send({ error: 'Projeto não encontrado' })
    }

    const { subtotal, taxAmount, totalAmount, ...rest } = parsed.data

    const measurement = await app.prisma.workMeasurement.create({
      data: {
        ...rest,
        tenantId: user.tenantId!,
        subtotal: new Decimal(String(subtotal)),
        taxAmount: new Decimal(String(taxAmount)),
        totalAmount: new Decimal(String(totalAmount)),
      },
      include: { project: { select: { id: true, name: true, code: true } } },
    })

    return reply.code(201).send({ data: measurement, message: 'Auto de medição criado' })
  })

  // ── PATCH /measurements/:id/status — Aprovar/Rejeitar auto de medição ──
  app.patch<{ Params: { id: string } }>('/measurements/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateMeasurementStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.workMeasurement.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Auto de medição não encontrado' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.status === 'APPROVED') {
      updateData.approvedBy = user.id
      updateData.approvedAt = new Date()
    }

    const measurement = await app.prisma.workMeasurement.update({
      where: { id: request.params.id },
      data: updateData,
      include: { project: { select: { id: true, name: true, code: true } } },
    })

    return reply.send({ data: measurement, message: 'Estado do auto de medição atualizado' })
  })
}

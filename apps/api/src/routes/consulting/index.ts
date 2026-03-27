import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──

const listProjectsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  projectType: z.enum(['STRATEGY', 'TECHNOLOGY', 'MANAGEMENT', 'FINANCIAL', 'LEGAL', 'AUDIT', 'OTHER']).optional(),
})

const createProjectSchema = z.object({
  title: z.string().min(1),
  clientName: z.string().min(1),
  projectType: z.enum(['STRATEGY', 'TECHNOLOGY', 'MANAGEMENT', 'FINANCIAL', 'LEGAL', 'AUDIT', 'OTHER']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  budget: z.number().min(0).optional(),
  hourlyRate: z.number().min(0).optional(),
  totalHours: z.number().min(0).optional(),
  teamLead: z.string().optional(),
  deliverables: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
})

const listTimeLogsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  projectId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  billable: z.enum(['true', 'false']).optional(),
})

const createTimeLogSchema = z.object({
  projectId: z.string().min(1),
  userName: z.string().min(1),
  date: z.coerce.date(),
  hours: z.number().positive(),
  description: z.string().optional(),
  billable: z.boolean().default(true),
})

// ── Rotas de Consultoria ──

export default async function consultingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ══════════════════════════════════════════════
  // PROJECTOS DE CONSULTORIA
  // ══════════════════════════════════════════════

  // ── GET / — Listar projectos ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listProjectsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, projectType } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (projectType) where.projectType = projectType

    const [data, total] = await Promise.all([
      app.prisma.consultingProject.findMany({
        where,
        include: { _count: { select: { timeLogs: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.consultingProject.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /summary — Dashboard resumo ──
  app.get('/summary', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId

    const [totalProjects, totalHoursAgg, billableHoursAgg, billableLogsByProject] = await Promise.all([
      app.prisma.consultingProject.count({ where }),
      app.prisma.timeLog.aggregate({
        _sum: { hours: true },
        where,
      }),
      app.prisma.timeLog.aggregate({
        _sum: { hours: true },
        where: { ...where, billable: true },
      }),
      // Agrupar horas faturáveis por projecto para calcular receita
      app.prisma.timeLog.groupBy({
        by: ['projectId'],
        _sum: { hours: true },
        where: { ...where, billable: true },
      }),
    ])

    const totalHours = Number(totalHoursAgg._sum.hours || 0)
    const billableHours = Number(billableHoursAgg._sum.hours || 0)

    // Calcular receita com base nas horas faturáveis e taxa horária do projecto
    let revenue = 0
    if (billableLogsByProject.length > 0) {
      const projectIds = billableLogsByProject.map(g => g.projectId)
      const projects = await app.prisma.consultingProject.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, hourlyRate: true },
      })
      const rateMap = new Map(projects.map(p => [p.id, Number(p.hourlyRate || 0)]))
      revenue = billableLogsByProject.reduce(
        (sum, g) => sum + Number(g._sum.hours || 0) * (rateMap.get(g.projectId) || 0),
        0
      )
    }

    return reply.send({
      data: {
        totalProjects,
        totalHours,
        billableHours,
        revenue,
      },
    })
  })

  // ── GET /time-logs — Listar registos de tempo ──
  app.get('/time-logs', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listTimeLogsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, projectId, dateFrom, dateTo, billable } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (projectId) where.projectId = projectId
    if (billable !== undefined) where.billable = billable === 'true'
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.gte = dateFrom
      if (dateTo) dateFilter.lte = dateTo
      where.date = dateFilter
    }

    const [data, total] = await Promise.all([
      app.prisma.timeLog.findMany({
        where,
        include: { project: { select: { id: true, title: true, clientName: true } } },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      app.prisma.timeLog.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── POST /time-logs — Criar registo de tempo ──
  app.post('/time-logs', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createTimeLogSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    // Validar que o projecto pertence ao tenant
    const project = await app.prisma.consultingProject.findFirst({
      where: { id: parsed.data.projectId, tenantId: user.tenantId },
    })
    if (!project) {
      return reply.code(404).send({ error: 'Projecto não encontrado neste tenant' })
    }

    const timeLog = await app.prisma.timeLog.create({
      data: {
        tenantId: user.tenantId,
        projectId: parsed.data.projectId,
        userName: parsed.data.userName,
        date: parsed.data.date,
        hours: new Decimal(parsed.data.hours),
        description: parsed.data.description || null,
        billable: parsed.data.billable,
      },
      include: { project: { select: { id: true, title: true } } },
    })

    return reply.code(201).send({ data: timeLog, message: 'Registo de tempo criado com sucesso' })
  })

  // ── GET /:id — Obter projecto com resumo de horas ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const project = await app.prisma.consultingProject.findFirst({
      where,
      include: {
        timeLogs: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    })

    if (!project) {
      return reply.code(404).send({ error: 'Projecto não encontrado' })
    }

    // Calcular resumo de horas
    const allLogs = await app.prisma.timeLog.findMany({
      where: { projectId: project.id, tenantId: user.tenantId },
      select: { hours: true, billable: true },
    })

    const totalHours = allLogs.reduce((sum, log) => sum + Number(log.hours), 0)
    const totalBillableHours = allLogs.filter(l => l.billable).reduce((sum, log) => sum + Number(log.hours), 0)

    return reply.send({
      data: {
        ...project,
        totalHours,
        totalBillableHours,
      },
    })
  })

  // ── POST / — Criar projecto ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createProjectSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const project = await app.prisma.consultingProject.create({
      data: {
        tenantId: user.tenantId,
        title: parsed.data.title,
        clientName: parsed.data.clientName,
        projectType: parsed.data.projectType,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate || null,
        budget: parsed.data.budget !== undefined ? new Decimal(parsed.data.budget) : null,
        hourlyRate: parsed.data.hourlyRate !== undefined ? new Decimal(parsed.data.hourlyRate) : null,
        totalHours: parsed.data.totalHours !== undefined ? new Decimal(parsed.data.totalHours) : null,
        teamLead: parsed.data.teamLead || null,
        deliverables: parsed.data.deliverables || [],
        notes: parsed.data.notes || null,
      },
    })

    return reply.code(201).send({ data: project, message: 'Projecto criado com sucesso' })
  })

  // ── PATCH /:id/status — Atualizar estado do projecto ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.consultingProject.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Projecto não encontrado' })
    }

    const data: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.status === 'COMPLETED') {
      data.endDate = new Date()
    }

    const project = await app.prisma.consultingProject.update({
      where: { id: request.params.id },
      data,
    })

    return reply.send({ data: project, message: `Estado do projecto atualizado para ${parsed.data.status}` })
  })
}

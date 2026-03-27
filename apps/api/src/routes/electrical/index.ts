import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

// ── Schemas de validação ──

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  projectType: z.string().optional(),
})

const createProjectSchema = z.object({
  branchId: z.string().optional(),
  name: z.string().min(1, 'Nome do projeto é obrigatório'),
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  clientNif: z.string().optional(),
  clientPhone: z.string().optional(),
  projectType: z.enum(['NEW_INSTALLATION', 'RENOVATION', 'EXPANSION', 'MAINTENANCE', 'EMERGENCY']),
  voltageLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  address: z.string().optional(),
  description: z.string().optional(),
  budget: z.number().positive().optional(),
  currency: z.string().default('AOA'),
  startDate: z.string().datetime().optional(),
  estimatedEnd: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

const updateProjectStatusSchema = z.object({
  status: z.enum(['PLANNING', 'APPROVED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
})

const createInspectionSchema = z.object({
  projectId: z.string().optional(),
  address: z.string().min(1, 'Endereço é obrigatório'),
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  inspectorId: z.string().optional(),
  inspectorName: z.string().optional(),
  inspectionType: z.enum(['INITIAL', 'PERIODIC', 'EXTRAORDINARY', 'POST_INCIDENT']),
  scheduledDate: z.string().datetime().optional(),
  checklist: z.array(z.object({ item: z.string(), passed: z.boolean().optional(), notes: z.string().optional() })).optional(),
  photos: z.array(z.string()).optional(),
})

const completeInspectionSchema = z.object({
  result: z.enum(['APPROVED', 'APPROVED_WITH_CONDITIONS', 'REJECTED']),
  findings: z.string().optional(),
})

const listInspectionsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  inspectionType: z.string().optional(),
  projectId: z.string().optional(),
})

const createCertificationSchema = z.object({
  projectId: z.string().optional(),
  clientName: z.string().min(1, 'Nome do cliente é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  certNumber: z.string().optional(),
  certType: z.enum(['INSTALLATION_CERT', 'INSPECTION_CERT', 'COMPLIANCE_CERT', 'ENERGY_CERT']),
  issuedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  issuedBy: z.string().optional(),
  pdfUrl: z.string().optional(),
  notes: z.string().optional(),
})

const updateCertificationStatusSchema = z.object({
  status: z.enum(['PENDING', 'ISSUED', 'EXPIRED', 'REVOKED']),
})

const listCertificationsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  certType: z.string().optional(),
  projectId: z.string().optional(),
})

// ── Rotas do módulo Eletricidade & Energia ──

export default async function electricalRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ═══════════════════════════════════════════
  // PROJETOS ELÉTRICOS
  // ═══════════════════════════════════════════

  // ── GET / — Listar projetos elétricos ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, projectType } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (projectType) where.projectType = projectType

    const [projects, total] = await Promise.all([
      app.prisma.electricalProject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              inspections: true,
              certifications: true,
            },
          },
        },
      }),
      app.prisma.electricalProject.count({ where }),
    ])

    const data = projects.map((p) => ({
      ...p,
      inspectionsCount: p._count.inspections,
      certificationsCount: p._count.certifications,
      _count: undefined,
    }))

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter projeto por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const project = await app.prisma.electricalProject.findFirst({
      where: { id: request.params.id, ...(user.tenantId ? { tenantId: user.tenantId } : {}) },
      include: {
        _count: {
          select: {
            inspections: true,
            certifications: true,
          },
        },
      },
    })

    if (!project) {
      return reply.code(404).send({ error: 'Projeto não encontrado' })
    }

    return reply.send({
      data: {
        ...project,
        inspectionsCount: project._count.inspections,
        certificationsCount: project._count.certifications,
        _count: undefined,
      },
    })
  })

  // ── POST / — Criar projeto elétrico ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createProjectSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido para o utilizador' })
    }

    const { startDate, estimatedEnd, budget, ...rest } = parsed.data

    const project = await app.prisma.electricalProject.create({
      data: {
        ...rest,
        tenantId: user.tenantId,
        startDate: startDate ? new Date(startDate) : undefined,
        estimatedEnd: estimatedEnd ? new Date(estimatedEnd) : undefined,
        budget: budget !== undefined ? budget : undefined,
      },
    })

    return reply.code(201).send({ data: project, message: 'Projeto elétrico criado com sucesso' })
  })

  // ── PATCH /:id/status — Alterar estado do projeto ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateProjectStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido' })
    }

    const existing = await app.prisma.electricalProject.findFirst({
      where: { id: request.params.id, ...(user.tenantId ? { tenantId: user.tenantId } : {}) },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Projeto não encontrado' })
    }

    const project = await app.prisma.electricalProject.update({
      where: { id: request.params.id },
      data: { status: parsed.data.status },
    })

    return reply.send({ data: project, message: 'Estado do projeto atualizado' })
  })

  // ═══════════════════════════════════════════
  // INSPEÇÕES ELÉTRICAS
  // ═══════════════════════════════════════════

  // ── GET /inspections — Listar inspeções ──
  app.get('/inspections', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listInspectionsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, inspectionType, projectId } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (inspectionType) where.inspectionType = inspectionType
    if (projectId) where.projectId = projectId

    const [inspections, total] = await Promise.all([
      app.prisma.electricalInspection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true, status: true } },
        },
      }),
      app.prisma.electricalInspection.count({ where }),
    ])

    return reply.send({ data: inspections, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /inspections/:id — Obter inspeção por ID ──
  app.get<{ Params: { id: string } }>('/inspections/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const inspection = await app.prisma.electricalInspection.findFirst({
      where: { id: request.params.id, ...(user.tenantId ? { tenantId: user.tenantId } : {}) },
      include: {
        project: { select: { id: true, name: true, clientName: true, status: true } },
      },
    })

    if (!inspection) {
      return reply.code(404).send({ error: 'Inspeção não encontrada' })
    }

    return reply.send({ data: inspection })
  })

  // ── POST /inspections — Criar inspeção ──
  app.post('/inspections', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createInspectionSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido para o utilizador' })
    }

    const { scheduledDate, checklist, photos, ...rest } = parsed.data

    const inspection = await app.prisma.electricalInspection.create({
      data: {
        ...rest,
        tenantId: user.tenantId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        checklist: checklist ?? [],
        photos: photos ?? [],
      },
    })

    return reply.code(201).send({ data: inspection, message: 'Inspeção criada com sucesso' })
  })

  // ── PATCH /inspections/:id/complete — Concluir inspeção ──
  app.patch<{ Params: { id: string } }>('/inspections/:id/complete', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = completeInspectionSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.electricalInspection.findFirst({
      where: { id: request.params.id, ...(user.tenantId ? { tenantId: user.tenantId } : {}) },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Inspeção não encontrada' })
    }

    if (existing.status === 'COMPLETED') {
      return reply.code(400).send({ error: 'Inspeção já foi concluída' })
    }

    const inspection = await app.prisma.electricalInspection.update({
      where: { id: request.params.id },
      data: {
        result: parsed.data.result,
        findings: parsed.data.findings,
        status: 'COMPLETED',
        completedDate: new Date(),
      },
    })

    return reply.send({ data: inspection, message: 'Inspeção concluída com sucesso' })
  })

  // ═══════════════════════════════════════════
  // CERTIFICAÇÕES ELÉTRICAS
  // ═══════════════════════════════════════════

  // ── GET /certifications — Listar certificações ──
  app.get('/certifications', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listCertificationsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, certType, projectId } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (certType) where.certType = certType
    if (projectId) where.projectId = projectId

    const [certifications, total] = await Promise.all([
      app.prisma.electricalCertification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true, status: true } },
        },
      }),
      app.prisma.electricalCertification.count({ where }),
    ])

    return reply.send({ data: certifications, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /certifications/:id — Obter certificação por ID ──
  app.get<{ Params: { id: string } }>('/certifications/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const certification = await app.prisma.electricalCertification.findFirst({
      where: { id: request.params.id, ...(user.tenantId ? { tenantId: user.tenantId } : {}) },
      include: {
        project: { select: { id: true, name: true, clientName: true, status: true } },
      },
    })

    if (!certification) {
      return reply.code(404).send({ error: 'Certificação não encontrada' })
    }

    return reply.send({ data: certification })
  })

  // ── POST /certifications — Criar certificação ──
  app.post('/certifications', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createCertificationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido para o utilizador' })
    }

    const { issuedAt, expiresAt, ...rest } = parsed.data

    const certification = await app.prisma.electricalCertification.create({
      data: {
        ...rest,
        tenantId: user.tenantId,
        issuedAt: issuedAt ? new Date(issuedAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    })

    return reply.code(201).send({ data: certification, message: 'Certificação criada com sucesso' })
  })

  // ── PATCH /certifications/:id/status — Alterar estado da certificação ──
  app.patch<{ Params: { id: string } }>('/certifications/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateCertificationStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido' })
    }

    const existing = await app.prisma.electricalCertification.findFirst({
      where: { id: request.params.id, ...(user.tenantId ? { tenantId: user.tenantId } : {}) },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Certificação não encontrada' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.status === 'ISSUED' && !existing.issuedAt) {
      updateData.issuedAt = new Date()
    }

    const certification = await app.prisma.electricalCertification.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: certification, message: 'Estado da certificação atualizado' })
  })
}

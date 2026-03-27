import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

// ── Schemas de validação ──────────────────────

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

// Contratos
const contractListQuery = paginationQuery.extend({
  status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED']).optional(),
  contractType: z.enum(['MONITORING', 'PATROL', 'CCTV', 'ALARM', 'ACCESS_CONTROL', 'MIXED']).optional(),
  search: z.string().optional(),
})

const createContractSchema = z.object({
  branchId: z.string().optional(),
  clientName: z.string().min(1),
  clientNif: z.string().optional(),
  clientAddress: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  contractType: z.enum(['MONITORING', 'PATROL', 'CCTV', 'ALARM', 'ACCESS_CONTROL', 'MIXED']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  renewAuto: z.boolean().default(true),
  monthlyValue: z.number().positive(),
  currency: z.string().default('AOA'),
  status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED']).default('DRAFT'),
  notes: z.string().optional(),
})

const updateContractSchema = createContractSchema.partial()

// Instalações
const installationListQuery = paginationQuery.extend({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  installationType: z.enum(['CCTV', 'ALARM', 'INTERCOM', 'ACCESS_CONTROL', 'FIRE_DETECTION', 'ELECTRIC_FENCE', 'MIXED']).optional(),
  contractId: z.string().optional(),
  search: z.string().optional(),
})

const createInstallationSchema = z.object({
  contractId: z.string().optional(),
  clientName: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  installationType: z.enum(['CCTV', 'ALARM', 'INTERCOM', 'ACCESS_CONTROL', 'FIRE_DETECTION', 'ELECTRIC_FENCE', 'MIXED']),
  equipmentList: z.array(z.object({
    name: z.string(),
    brand: z.string().optional(),
    model: z.string().optional(),
    serial: z.string().optional(),
    qty: z.number().int().positive().default(1),
  })),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PLANNED'),
  scheduledDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
})

const updateInstallationStatusSchema = z.object({
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
})

// Incidentes
const incidentListQuery = paginationQuery.extend({
  status: z.enum(['OPEN', 'INVESTIGATING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  type: z.enum(['INTRUSION', 'THEFT', 'VANDALISM', 'FIRE', 'EQUIPMENT_FAILURE', 'ALARM_TRIGGER', 'ACCESS_VIOLATION', 'OTHER']).optional(),
  search: z.string().optional(),
})

const createIncidentSchema = z.object({
  branchId: z.string().optional(),
  contractId: z.string().optional(),
  type: z.enum(['INTRUSION', 'THEFT', 'VANDALISM', 'FIRE', 'EQUIPMENT_FAILURE', 'ALARM_TRIGGER', 'ACCESS_VIOLATION', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  title: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  reportedBy: z.string().optional(),
  assignedTo: z.string().optional(),
  photos: z.array(z.string()).default([]),
})

const updateIncidentStatusSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
  resolution: z.string().optional(),
})

// Rondas
const patrolListQuery = paginationQuery.extend({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'INTERRUPTED']).optional(),
  guardId: z.string().optional(),
  search: z.string().optional(),
})

const createPatrolSchema = z.object({
  branchId: z.string().optional(),
  guardId: z.string().min(1),
  guardName: z.string().min(1),
  route: z.string().optional(),
  startedAt: z.string().datetime(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'INTERRUPTED']).default('IN_PROGRESS'),
  checkpoints: z.array(z.object({
    name: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    checkedAt: z.string().datetime().optional(),
    notes: z.string().optional(),
    photo: z.string().optional(),
  })).default([]),
  notes: z.string().optional(),
})

const completePatrolSchema = z.object({
  checkpoint: z.object({
    name: z.string(),
    lat: z.number().optional(),
    lng: z.number().optional(),
    checkedAt: z.string().datetime().optional(),
    notes: z.string().optional(),
    photo: z.string().optional(),
  }).optional(),
  complete: z.boolean().default(false),
  notes: z.string().optional(),
})

// ── Rotas ─────────────────────────────────────

export default async function securityRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ═══════════════════════════════════════════
  // CONTRATOS DE SEGURANÇA
  // ═══════════════════════════════════════════

  // ── GET / — Listar contratos ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = contractListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, contractType, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (contractType) where.contractType = contractType
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientNif: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.securityContract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { installations: { select: { id: true, installationType: true, status: true } } },
      }),
      app.prisma.securityContract.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter contrato por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const contract = await app.prisma.securityContract.findFirst({
      where,
      include: { installations: true },
    })

    if (!contract) {
      return reply.code(404).send({ error: 'Contrato não encontrado' })
    }

    return reply.send({ data: contract })
  })

  // ── POST / — Criar contrato ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createContractSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const contract = await app.prisma.securityContract.create({
      data: {
        tenantId: user.tenantId,
        ...parsed.data,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      },
    })

    return reply.code(201).send({ data: contract, message: 'Contrato criado com sucesso' })
  })

  // ── PATCH /:id — Atualizar contrato ──
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateContractSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.securityContract.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Contrato não encontrado' })
    }

    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.startDate) updateData.startDate = new Date(parsed.data.startDate)
    if (parsed.data.endDate) updateData.endDate = new Date(parsed.data.endDate)

    const contract = await app.prisma.securityContract.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: contract, message: 'Contrato atualizado com sucesso' })
  })

  // ═══════════════════════════════════════════
  // INSTALAÇÕES DE EQUIPAMENTOS
  // ═══════════════════════════════════════════

  // ── GET /installations — Listar instalações ──
  app.get('/installations', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = installationListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, installationType, contractId, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (installationType) where.installationType = installationType
    if (contractId) where.contractId = contractId
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.securityInstallation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { contract: { select: { id: true, clientName: true, contractType: true } } },
      }),
      app.prisma.securityInstallation.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /installations/:id — Obter instalação por ID ──
  app.get<{ Params: { id: string } }>('/installations/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const installation = await app.prisma.securityInstallation.findFirst({
      where,
      include: { contract: true },
    })

    if (!installation) {
      return reply.code(404).send({ error: 'Instalação não encontrada' })
    }

    return reply.send({ data: installation })
  })

  // ── POST /installations — Criar instalação ──
  app.post('/installations', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createInstallationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    // Verificar contrato se fornecido
    if (parsed.data.contractId) {
      const contract = await app.prisma.securityContract.findFirst({
        where: { id: parsed.data.contractId, tenantId: user.tenantId },
      })
      if (!contract) {
        return reply.code(404).send({ error: 'Contrato não encontrado' })
      }
    }

    const installation = await app.prisma.securityInstallation.create({
      data: {
        tenantId: user.tenantId,
        ...parsed.data,
        scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null,
      },
    })

    return reply.code(201).send({ data: installation, message: 'Instalação criada com sucesso' })
  })

  // ── PATCH /installations/:id/status — Alterar estado da instalação ──
  app.patch<{ Params: { id: string } }>('/installations/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateInstallationStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido' })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.securityInstallation.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Instalação não encontrada' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.status === 'COMPLETED') {
      updateData.completedDate = new Date()
    }

    const installation = await app.prisma.securityInstallation.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: installation, message: 'Estado da instalação atualizado' })
  })

  // ═══════════════════════════════════════════
  // INCIDENTES / OCORRÊNCIAS
  // ═══════════════════════════════════════════

  // ── GET /incidents — Listar incidentes ──
  app.get('/incidents', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = incidentListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, severity, type, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (severity) where.severity = severity
    if (type) where.type = type
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.securityIncident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.securityIncident.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /incidents/:id — Obter incidente por ID ──
  app.get<{ Params: { id: string } }>('/incidents/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const incident = await app.prisma.securityIncident.findFirst({ where })

    if (!incident) {
      return reply.code(404).send({ error: 'Incidente não encontrado' })
    }

    return reply.send({ data: incident })
  })

  // ── POST /incidents — Registar incidente ──
  app.post('/incidents', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createIncidentSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const incident = await app.prisma.securityIncident.create({
      data: {
        tenantId: user.tenantId,
        ...parsed.data,
      },
    })

    return reply.code(201).send({ data: incident, message: 'Incidente registado com sucesso' })
  })

  // ── PATCH /incidents/:id/status — Alterar estado do incidente ──
  app.patch<{ Params: { id: string } }>('/incidents/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateIncidentStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.securityIncident.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Incidente não encontrado' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.resolution) updateData.resolution = parsed.data.resolution
    if (parsed.data.status === 'RESOLVED' || parsed.data.status === 'CLOSED') {
      updateData.resolvedAt = new Date()
    }

    const incident = await app.prisma.securityIncident.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: incident, message: 'Estado do incidente atualizado' })
  })

  // ═══════════════════════════════════════════
  // RONDAS DE SEGURANÇA
  // ═══════════════════════════════════════════

  // ── GET /patrols — Listar rondas ──
  app.get('/patrols', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = patrolListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, guardId, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (guardId) where.guardId = guardId
    if (search) {
      where.OR = [
        { guardName: { contains: search, mode: 'insensitive' } },
        { route: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.securityPatrol.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.securityPatrol.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /patrols/:id — Obter ronda por ID ──
  app.get<{ Params: { id: string } }>('/patrols/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const patrol = await app.prisma.securityPatrol.findFirst({ where })

    if (!patrol) {
      return reply.code(404).send({ error: 'Ronda não encontrada' })
    }

    return reply.send({ data: patrol })
  })

  // ── POST /patrols — Iniciar ronda ──
  app.post('/patrols', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createPatrolSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const patrol = await app.prisma.securityPatrol.create({
      data: {
        tenantId: user.tenantId,
        ...parsed.data,
        startedAt: new Date(parsed.data.startedAt),
      },
    })

    return reply.code(201).send({ data: patrol, message: 'Ronda iniciada com sucesso' })
  })

  // ── PATCH /patrols/:id/complete — Adicionar checkpoint ou concluir ronda ──
  app.patch<{ Params: { id: string } }>('/patrols/:id/complete', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = completePatrolSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.securityPatrol.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Ronda não encontrada' })
    }

    const currentCheckpoints = (existing.checkpoints as Record<string, unknown>[]) || []
    const updateData: Record<string, unknown> = {}

    // Adicionar checkpoint se fornecido
    if (parsed.data.checkpoint) {
      const checkpoint = {
        ...parsed.data.checkpoint,
        checkedAt: parsed.data.checkpoint.checkedAt || new Date().toISOString(),
      }
      updateData.checkpoints = [...currentCheckpoints, checkpoint]
    }

    // Concluir ronda
    if (parsed.data.complete) {
      updateData.status = 'COMPLETED'
      updateData.endedAt = new Date()
    }

    if (parsed.data.notes) {
      updateData.notes = parsed.data.notes
    }

    const patrol = await app.prisma.securityPatrol.update({
      where: { id: request.params.id },
      data: updateData,
    })

    const message = parsed.data.complete ? 'Ronda concluída com sucesso' : 'Checkpoint registado'
    return reply.send({ data: patrol, message })
  })
}

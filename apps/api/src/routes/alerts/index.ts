import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

// ── Schemas de validação ─────────────────────────
const alertModules = [
  'contracts',
  'stock',
  'invoicing',
  'security',
  'fleet',
  'hr',
  'maintenance',
  'pms',
] as const

const alertChannels = ['email', 'sms', 'push', 'in_app'] as const

const predefinedAlertTypes = [
  'CONTRACT_EXPIRING_30D',
  'STOCK_BELOW_MINIMUM',
  'INVOICE_OVERDUE',
  'INCIDENT_HIGH_CRITICAL',
  'VEHICLE_MAINTENANCE_DUE',
  'CERTIFICATION_EXPIRING',
] as const

const createAlertRuleSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  module: z.enum(alertModules),
  alertType: z.enum(predefinedAlertTypes).optional(),
  condition: z.string().min(1, 'Condição obrigatória'),
  threshold: z.number().optional(),
  channels: z.array(z.enum(alertChannels)).min(1, 'Pelo menos um canal obrigatório'),
  active: z.boolean().default(true),
})

const updateAlertRuleSchema = createAlertRuleSchema.partial()

const listAlertRulesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  module: z.string().optional(),
  active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
})

export default async function alertsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar regras de alerta do tenant ──
  app.get('/', async (request, reply) => {
    const parsed = listAlertRulesQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, module: mod, active } = parsed.data
    const skip = (page - 1) * limit
    const user = request.user as any

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (mod) where.module = mod
    if (active !== undefined) where.active = active

    const [data, total] = await Promise.all([
      app.prisma.alertRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.alertRule.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── POST / — Criar regra de alerta ──
  app.post('/', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = createAlertRuleSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const user = request.user as any

    const alertRule = await app.prisma.alertRule.create({
      data: {
        ...parsed.data,
        tenantId: user.tenantId,
        createdById: user.id,
      },
    })

    return reply.code(201).send({ data: alertRule, message: 'Regra de alerta criada' })
  })

  // ── PATCH /:id — Atualizar regra de alerta ──
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const existing = await app.prisma.alertRule.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Regra de alerta não encontrada' })
    }

    const parsed = updateAlertRuleSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const updated = await app.prisma.alertRule.update({
      where: { id: request.params.id },
      data: parsed.data,
    })

    return reply.send({ data: updated, message: 'Regra de alerta atualizada' })
  })

  // ── DELETE /:id — Eliminar regra de alerta ──
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const existing = await app.prisma.alertRule.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Regra de alerta não encontrada' })
    }

    await app.prisma.alertRule.delete({ where: { id: request.params.id } })

    return reply.send({ message: 'Regra de alerta eliminada' })
  })
}

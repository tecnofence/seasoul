import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──

const listProductionOrdersQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
})

const createProductionOrderSchema = z.object({
  code: z.string().optional(),
  productName: z.string().min(1),
  productId: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedCost: z.number().min(0).optional(),
  currency: z.string().default('AOA'),
  startDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  assignedTo: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

const updateProductionOrderStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']),
  actualQuantity: z.number().positive().optional(),
  actualCost: z.number().min(0).optional(),
  notes: z.string().optional(),
})

// ── Rotas de Manufatura ──

export default async function manufacturingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ════════════════════════════════════════════
  // ORDENS DE PRODUÇÃO
  // ════════════════════════════════════════════

  // ── GET / — Listar ordens de produção ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listProductionOrdersQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, priority } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (status) where.status = status
    if (priority) where.priority = priority

    const [orders, total] = await Promise.all([
      app.prisma.productionOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.productionOrder.count({ where }),
    ])

    return reply.send({
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── GET /:id — Obter ordem de produção ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const order = await app.prisma.productionOrder.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })

    if (!order) {
      return reply.code(404).send({ error: 'Ordem de produção não encontrada' })
    }

    return reply.send({ data: order })
  })

  // ── POST / — Criar ordem de produção ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createProductionOrderSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const { estimatedCost, quantity, ...rest } = parsed.data

    const order = await app.prisma.productionOrder.create({
      data: {
        ...rest,
        tenantId: user.tenantId,
        quantity: new Decimal(String(quantity)),
        estimatedCost: estimatedCost !== undefined ? new Decimal(String(estimatedCost)) : undefined,
        startDate: rest.startDate ?? undefined,
        dueDate: rest.dueDate ?? undefined,
      },
    })

    return reply.code(201).send({ data: order, message: 'Ordem de produção criada com sucesso' })
  })

  // ── PATCH /:id/status — Atualizar estado da ordem de produção ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateProductionOrderStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.productionOrder.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Ordem de produção não encontrada' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }
    if (parsed.data.actualQuantity !== undefined) {
      updateData.actualQuantity = new Decimal(String(parsed.data.actualQuantity))
    }
    if (parsed.data.actualCost !== undefined) {
      updateData.actualCost = new Decimal(String(parsed.data.actualCost))
    }
    if (parsed.data.notes) updateData.notes = parsed.data.notes

    const order = await app.prisma.productionOrder.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: order, message: 'Estado da ordem de produção atualizado' })
  })
}

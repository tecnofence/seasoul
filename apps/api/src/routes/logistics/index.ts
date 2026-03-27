import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──────────────────────

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const shipmentListQuery = paginationQuery.extend({
  status: z.enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED']).optional(),
  shipmentType: z.enum(['PACKAGE', 'PALLET', 'CONTAINER', 'DOCUMENT', 'BULK']).optional(),
  search: z.string().optional(),
})

const createShipmentSchema = z.object({
  trackingCode: z.string().optional(),
  origin: z.string().min(1),
  destination: z.string().min(1),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  weight: z.number().positive().optional(),
  volume: z.number().positive().optional(),
  shipmentType: z.enum(['PACKAGE', 'PALLET', 'CONTAINER', 'DOCUMENT', 'BULK']),
  status: z.enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED']).default('PENDING'),
  estimatedDelivery: z.string().datetime().optional(),
  cost: z.number().positive().optional(),
  driverId: z.string().optional(),
  vehicleId: z.string().optional(),
  notes: z.string().optional(),
})

const updateShipmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED']),
})

// ── Rotas ─────────────────────────────────────

export default async function logisticsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar envios ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = shipmentListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, shipmentType, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (shipmentType) where.shipmentType = shipmentType
    if (search) {
      where.OR = [
        { trackingCode: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.shipment.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter envio ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const shipment = await app.prisma.shipment.findFirst({ where })

    if (!shipment) {
      return reply.code(404).send({ error: 'Envio não encontrado' })
    }

    return reply.send({ data: shipment })
  })

  // ── POST / — Criar envio ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createShipmentSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const shipment = await app.prisma.shipment.create({
      data: {
        tenantId: user.tenantId,
        trackingCode: parsed.data.trackingCode || null,
        origin: parsed.data.origin,
        destination: parsed.data.destination,
        clientName: parsed.data.clientName || null,
        clientPhone: parsed.data.clientPhone || null,
        weight: parsed.data.weight !== undefined ? new Decimal(String(parsed.data.weight)) : null,
        volume: parsed.data.volume !== undefined ? new Decimal(String(parsed.data.volume)) : null,
        shipmentType: parsed.data.shipmentType,
        status: parsed.data.status,
        estimatedDelivery: parsed.data.estimatedDelivery ? new Date(parsed.data.estimatedDelivery) : null,
        cost: parsed.data.cost !== undefined ? new Decimal(String(parsed.data.cost)) : null,
        driverId: parsed.data.driverId || null,
        vehicleId: parsed.data.vehicleId || null,
        notes: parsed.data.notes || null,
      },
    })

    return reply.code(201).send({ data: shipment, message: 'Envio criado com sucesso' })
  })

  // ── PATCH /:id/status — Atualizar estado do envio ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateShipmentStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.shipment.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Envio não encontrado' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    // Registar data de entrega quando o estado muda para DELIVERED
    if (parsed.data.status === 'DELIVERED') {
      updateData.deliveredAt = new Date()
    }

    const shipment = await app.prisma.shipment.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: shipment, message: `Estado do envio atualizado para ${parsed.data.status}` })
  })

  // ── GET /tracking/:code — Encontrar envio por código de rastreio ──
  app.get<{ Params: { code: string } }>('/tracking/:code', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { trackingCode: request.params.code }
    if (user.tenantId) where.tenantId = user.tenantId

    const shipment = await app.prisma.shipment.findFirst({ where })

    if (!shipment) {
      return reply.code(404).send({ error: 'Envio não encontrado com este código de rastreio' })
    }

    return reply.send({ data: shipment })
  })
}

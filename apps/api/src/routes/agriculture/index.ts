import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──

const listFarmsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const createFarmSchema = z.object({
  name: z.string().min(1),
  location: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  areaHectares: z.number().positive().optional(),
  managerId: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

const listCropsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  farmId: z.string().optional(),
  status: z.enum(['PLANNED', 'PLANTED', 'GROWING', 'HARVESTING', 'COMPLETED', 'FAILED']).optional(),
})

const createCropSchema = z.object({
  farmId: z.string().min(1),
  name: z.string().min(1),
  variety: z.string().optional(),
  areaHectares: z.number().positive().optional(),
  plantedAt: z.coerce.date().optional(),
  expectedHarvest: z.coerce.date().optional(),
  estimatedYield: z.number().positive().optional(),
  notes: z.string().optional(),
})

const updateCropStatusSchema = z.object({
  status: z.enum(['PLANNED', 'PLANTED', 'GROWING', 'HARVESTING', 'COMPLETED', 'FAILED']),
})

const listHarvestsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  farmId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

const createHarvestSchema = z.object({
  farmId: z.string().min(1),
  cropId: z.string().optional(),
  harvestedAt: z.coerce.date(),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  quality: z.string().optional(),
  pricePerUnit: z.number().min(0).optional(),
  currency: z.string().default('AOA'),
  notes: z.string().optional(),
})

// ── Rotas de Agricultura ──

export default async function agricultureRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ════════════════════════════════════════════
  // FAZENDAS
  // ════════════════════════════════════════════

  // ── GET /farms — Listar fazendas ──
  app.get('/farms', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listFarmsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId }

    const [farms, total] = await Promise.all([
      app.prisma.farm.findMany({
        where,
        include: {
          _count: { select: { crops: true, harvests: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.farm.count({ where }),
    ])

    return reply.send({
      data: farms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── POST /farms — Criar fazenda ──
  app.post('/farms', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createFarmSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const farm = await app.prisma.farm.create({
      data: {
        ...parsed.data,
        tenantId: user.tenantId,
      },
    })

    return reply.code(201).send({ data: farm, message: 'Fazenda criada com sucesso' })
  })

  // ── GET /farms/:id — Obter fazenda com culturas e colheitas ──
  app.get<{ Params: { id: string } }>('/farms/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const farm = await app.prisma.farm.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
      include: {
        _count: { select: { crops: true, harvests: true } },
        crops: { orderBy: { createdAt: 'desc' }, take: 20 },
        harvests: { orderBy: { harvestedAt: 'desc' }, take: 20 },
      },
    })

    if (!farm) {
      return reply.code(404).send({ error: 'Fazenda não encontrada' })
    }

    return reply.send({ data: farm })
  })

  // ════════════════════════════════════════════
  // CULTURAS (CROPS)
  // ════════════════════════════════════════════

  // ── GET /crops — Listar culturas ──
  app.get('/crops', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listCropsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, farmId, status } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (farmId) where.farmId = farmId
    if (status) where.status = status

    const [crops, total] = await Promise.all([
      app.prisma.crop.findMany({
        where,
        include: { farm: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.crop.count({ where }),
    ])

    return reply.send({
      data: crops,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── POST /crops — Criar cultura ──
  app.post('/crops', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createCropSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    // Verificar que a fazenda pertence ao mesmo tenant
    const farm = await app.prisma.farm.findFirst({
      where: { id: parsed.data.farmId, tenantId: user.tenantId },
    })
    if (!farm) {
      return reply.code(404).send({ error: 'Fazenda não encontrada neste tenant' })
    }

    const crop = await app.prisma.crop.create({
      data: {
        ...parsed.data,
        tenantId: user.tenantId,
        plantedAt: parsed.data.plantedAt ?? undefined,
        expectedHarvest: parsed.data.expectedHarvest ?? undefined,
      },
      include: { farm: { select: { id: true, name: true } } },
    })

    return reply.code(201).send({ data: crop, message: 'Cultura criada com sucesso' })
  })

  // ── PATCH /crops/:id/status — Atualizar estado da cultura ──
  app.patch<{ Params: { id: string } }>('/crops/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateCropStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.crop.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Cultura não encontrada' })
    }

    const crop = await app.prisma.crop.update({
      where: { id: request.params.id },
      data: { status: parsed.data.status },
      include: { farm: { select: { id: true, name: true } } },
    })

    return reply.send({ data: crop, message: 'Estado da cultura atualizado' })
  })

  // ════════════════════════════════════════════
  // COLHEITAS (HARVESTS)
  // ════════════════════════════════════════════

  // ── GET /harvests — Listar colheitas ──
  app.get('/harvests', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listHarvestsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, farmId, dateFrom, dateTo } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (farmId) where.farmId = farmId
    if (dateFrom || dateTo) {
      where.harvestedAt = {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      }
    }

    const [harvests, total] = await Promise.all([
      app.prisma.harvest.findMany({
        where,
        include: {
          farm: { select: { id: true, name: true } },
          crop: { select: { id: true, name: true, variety: true } },
        },
        skip,
        take: limit,
        orderBy: { harvestedAt: 'desc' },
      }),
      app.prisma.harvest.count({ where }),
    ])

    return reply.send({
      data: harvests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── POST /harvests — Criar colheita ──
  app.post('/harvests', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createHarvestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    // Verificar que a fazenda pertence ao mesmo tenant
    const farm = await app.prisma.farm.findFirst({
      where: { id: parsed.data.farmId, tenantId: user.tenantId },
    })
    if (!farm) {
      return reply.code(404).send({ error: 'Fazenda não encontrada neste tenant' })
    }

    const { pricePerUnit, ...rest } = parsed.data

    const harvest = await app.prisma.harvest.create({
      data: {
        ...rest,
        tenantId: user.tenantId,
        pricePerUnit: pricePerUnit !== undefined ? new Decimal(String(pricePerUnit)) : undefined,
      },
      include: {
        farm: { select: { id: true, name: true } },
        crop: { select: { id: true, name: true, variety: true } },
      },
    })

    return reply.code(201).send({ data: harvest, message: 'Colheita registada com sucesso' })
  })
}

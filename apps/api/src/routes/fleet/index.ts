import type { FastifyInstance } from 'fastify'
import { Decimal } from '@prisma/client/runtime/library'
import { z } from 'zod'

const createVehicleSchema = z.object({
  branchId: z.string().optional().nullable(),
  plate: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  type: z.enum(['CAR', 'VAN', 'TRUCK', 'MOTORCYCLE', 'BUS', 'EQUIPMENT']),
  fuelType: z.enum(['DIESEL', 'GASOLINE', 'ELECTRIC', 'HYBRID']).optional().default('DIESEL'),
  mileage: z.number().int().min(0).optional().default(0),
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DECOMMISSIONED']).optional().default('AVAILABLE'),
  assignedTo: z.string().optional().nullable(),
  insuranceExp: z.string().optional().nullable(),
  inspectionExp: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const updateVehicleStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DECOMMISSIONED']),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1),
  driverId: z.string().optional().nullable(),
  driverName: z.string().optional().nullable(),
  date: z.string().min(1),
  liters: z.union([z.string(), z.number()]).refine((v) => {
    const n = Number(v)
    return !isNaN(n) && n > 0
  }, { message: 'liters deve ser um número positivo' }),
  pricePerLiter: z.union([z.string(), z.number()]).refine((v) => {
    const n = Number(v)
    return !isNaN(n) && n > 0
  }, { message: 'pricePerLiter deve ser um número positivo' }),
  mileage: z.number().int().min(0),
  station: z.string().optional().nullable(),
})

export default async function fleetRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ══════════════════════════════════════════════
  // VEÍCULOS
  // ══════════════════════════════════════════════

  // ── GET / — Listar veículos ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const { page = '1', limit = '20', status, type, search } = request.query as Record<string, string | undefined>

    const pageNum = Math.max(1, parseInt(page || '1', 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)))
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (type) where.type = type
    if (search) {
      where.OR = [
        { plate: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.vehicle.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { plate: 'asc' },
        include: { _count: { select: { fuelLogs: true } } },
      }),
      app.prisma.vehicle.count({ where }),
    ])

    return reply.send({ data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) })
  })

  // ── GET /:id — Obter veículo ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const vehicle = await app.prisma.vehicle.findFirst({
      where,
      include: {
        fuelLogs: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    })

    if (!vehicle) {
      return reply.code(404).send({ error: 'Veículo não encontrado' })
    }

    return reply.send({ data: vehicle })
  })

  // ── POST / — Criar veículo ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const parsed = createVehicleSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    const body = parsed.data

    // Verificar matrícula duplicada no tenant
    const exists = await app.prisma.vehicle.findUnique({
      where: { tenantId_plate: { tenantId: user.tenantId, plate: body.plate } },
    })
    if (exists) {
      return reply.code(409).send({ error: 'Matrícula já registada neste tenant' })
    }

    const vehicle = await app.prisma.vehicle.create({
      data: {
        tenantId: user.tenantId,
        branchId: body.branchId || null,
        plate: body.plate,
        brand: body.brand,
        model: body.model,
        year: body.year || null,
        type: body.type,
        fuelType: body.fuelType,
        mileage: body.mileage,
        status: body.status,
        assignedTo: body.assignedTo || null,
        insuranceExp: body.insuranceExp ? new Date(body.insuranceExp) : null,
        inspectionExp: body.inspectionExp ? new Date(body.inspectionExp) : null,
        notes: body.notes || null,
      },
    })

    return reply.code(201).send({ data: vehicle, message: 'Veículo criado com sucesso' })
  })

  // ── PATCH /:id/status — Atualizar estado do veículo ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.vehicle.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Veículo não encontrado' })
    }

    const parsed = updateVehicleStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    const body = parsed.data

    const data: Record<string, unknown> = { status: body.status }
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo || null
    if (body.notes) data.notes = body.notes

    const vehicle = await app.prisma.vehicle.update({
      where: { id: request.params.id },
      data,
    })

    return reply.send({ data: vehicle, message: `Estado do veículo alterado para ${body.status}` })
  })

  // ══════════════════════════════════════════════
  // REGISTOS DE COMBUSTÍVEL
  // ══════════════════════════════════════════════

  // ── GET /fuel-logs — Listar registos de combustível ──
  app.get('/fuel-logs', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const { page = '1', limit = '20', vehicleId, from, to } = request.query as Record<string, string | undefined>

    const pageNum = Math.max(1, parseInt(page || '1', 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)))
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (vehicleId) where.vehicleId = vehicleId
    if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) dateFilter.gte = new Date(from)
      if (to) dateFilter.lte = new Date(to)
      where.date = dateFilter
    }

    const [data, total] = await Promise.all([
      app.prisma.fuelLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { date: 'desc' },
        include: { vehicle: { select: { id: true, plate: true, brand: true, model: true } } },
      }),
      app.prisma.fuelLog.count({ where }),
    ])

    return reply.send({ data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) })
  })

  // ── POST /fuel-logs — Registar abastecimento ──
  app.post('/fuel-logs', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const parsed = createFuelLogSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    const body = parsed.data

    // Verificar que o veículo pertence ao tenant
    const vehicle = await app.prisma.vehicle.findFirst({
      where: { id: body.vehicleId, tenantId: user.tenantId },
    })
    if (!vehicle) {
      return reply.code(404).send({ error: 'Veículo não encontrado neste tenant' })
    }

    const liters = new Decimal(String(body.liters))
    const pricePerLiter = new Decimal(String(body.pricePerLiter))
    const totalCost = liters.times(pricePerLiter).toDecimalPlaces(2)
    const mileage = body.mileage

    const fuelLog = await app.prisma.fuelLog.create({
      data: {
        tenantId: user.tenantId,
        vehicleId: body.vehicleId,
        driverId: body.driverId || null,
        driverName: body.driverName || null,
        date: new Date(body.date),
        liters,
        pricePerLiter,
        totalCost,
        mileage,
        station: body.station || null,
      },
      include: { vehicle: { select: { id: true, plate: true } } },
    })

    // Atualizar quilometragem do veículo se superior
    if (mileage > vehicle.mileage) {
      await app.prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { mileage },
      })
    }

    return reply.code(201).send({ data: fuelLog, message: 'Abastecimento registado com sucesso' })
  })
}

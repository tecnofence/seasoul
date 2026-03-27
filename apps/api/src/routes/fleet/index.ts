import type { FastifyInstance } from 'fastify'
import { Decimal } from '@prisma/client/runtime/library'

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

    const body = request.body as Record<string, unknown>

    // Verificar matrícula duplicada no tenant
    const exists = await app.prisma.vehicle.findUnique({
      where: { tenantId_plate: { tenantId: user.tenantId, plate: body.plate as string } },
    })
    if (exists) {
      return reply.code(409).send({ error: 'Matrícula já registada neste tenant' })
    }

    const vehicle = await app.prisma.vehicle.create({
      data: {
        tenantId: user.tenantId,
        branchId: (body.branchId as string) || null,
        plate: body.plate as string,
        brand: body.brand as string,
        model: body.model as string,
        year: (body.year as number) || null,
        type: body.type as 'CAR' | 'VAN' | 'TRUCK' | 'MOTORCYCLE' | 'BUS' | 'EQUIPMENT',
        fuelType: (body.fuelType as 'DIESEL' | 'GASOLINE' | 'ELECTRIC' | 'HYBRID') || 'DIESEL',
        mileage: (body.mileage as number) || 0,
        status: (body.status as 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DECOMMISSIONED') || 'AVAILABLE',
        assignedTo: (body.assignedTo as string) || null,
        insuranceExp: body.insuranceExp ? new Date(body.insuranceExp as string) : null,
        inspectionExp: body.inspectionExp ? new Date(body.inspectionExp as string) : null,
        notes: (body.notes as string) || null,
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

    const body = request.body as { status: string; assignedTo?: string; notes?: string }

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

    const body = request.body as Record<string, unknown>

    // Verificar que o veículo pertence ao tenant
    const vehicle = await app.prisma.vehicle.findFirst({
      where: { id: body.vehicleId as string, tenantId: user.tenantId },
    })
    if (!vehicle) {
      return reply.code(404).send({ error: 'Veículo não encontrado neste tenant' })
    }

    const liters = new Decimal(String(body.liters))
    const pricePerLiter = new Decimal(String(body.pricePerLiter))
    const totalCost = liters.times(pricePerLiter).toDecimalPlaces(2)
    const mileage = body.mileage as number

    const fuelLog = await app.prisma.fuelLog.create({
      data: {
        tenantId: user.tenantId,
        vehicleId: body.vehicleId as string,
        driverId: (body.driverId as string) || null,
        driverName: (body.driverName as string) || null,
        date: new Date(body.date as string),
        liters,
        pricePerLiter,
        totalCost,
        mileage,
        station: (body.station as string) || null,
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

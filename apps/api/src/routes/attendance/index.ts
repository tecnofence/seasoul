import type { FastifyInstance } from 'fastify'
import { recordAttendanceSchema, listAttendanceQuery } from './schemas.js'

// Haversine — distância entre dois pontos GPS em metros
function gpsDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default async function attendanceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar registos de assiduidade ──
  app.get('/', async (request, reply) => {
    const parsed = listAttendanceQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, employeeId, resortId, from, to, validGps } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (employeeId) where.employeeId = employeeId
    if (validGps !== undefined) where.validGps = validGps
    if (resortId) {
      where.employee = { resortId }
    }
    if (from || to) {
      where.createdAt = {}
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from)
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to)
    }

    const [data, total] = await Promise.all([
      app.prisma.attendanceRecord.findMany({
        where,
        include: {
          employee: { select: { id: true, name: true, department: true, resortId: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.attendanceRecord.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── POST / — Registar ponto (entrada/saída/pausa) ──
  app.post('/', async (request, reply) => {
    const parsed = recordAttendanceSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { employeeId, type, lat, lng } = parsed.data

    // Verificar colaborador
    const employee = await app.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { resort: true },
    })
    if (!employee || !employee.active) {
      return reply.code(404).send({ error: 'Colaborador não encontrado ou inativo' })
    }

    // Validar GPS — dentro do geofence do resort
    const distance = gpsDistance(lat, lng, employee.resort.lat, employee.resort.lng)
    const validGps = distance <= employee.resort.geofenceRadius

    const record = await app.prisma.attendanceRecord.create({
      data: {
        employeeId,
        type,
        lat,
        lng,
        validGps,
      },
      include: {
        employee: { select: { id: true, name: true, department: true } },
      },
    })

    const message = validGps
      ? `Registo ${type} efetuado com sucesso`
      : `Registo ${type} efetuado — FORA do geofence (${Math.round(distance)}m do resort)`

    return reply.code(201).send({ data: { ...record, distance: Math.round(distance) }, message })
  })

  // ── GET /summary — Resumo de assiduidade por colaborador num período ──
  app.get('/summary', async (request, reply) => {
    const { employeeId, month, year } = request.query as {
      employeeId?: string
      month?: string
      year?: string
    }

    if (!employeeId || !month || !year) {
      return reply.code(400).send({ error: 'employeeId, month e year são obrigatórios' })
    }

    const from = new Date(parseInt(year), parseInt(month) - 1, 1)
    const to = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)

    const records = await app.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        createdAt: { gte: from, lte: to },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Calcular horas trabalhadas (pares ENTRY/EXIT)
    let totalHours = 0
    let invalidGpsCount = 0
    let daysPresent = new Set<string>()

    for (let i = 0; i < records.length; i++) {
      const rec = records[i]
      if (!rec.validGps) invalidGpsCount++
      daysPresent.add(rec.createdAt.toISOString().split('T')[0])

      if (rec.type === 'ENTRY') {
        // Procurar próximo EXIT
        const exit = records.slice(i + 1).find((r) => r.type === 'EXIT')
        if (exit) {
          const ms = exit.createdAt.getTime() - rec.createdAt.getTime()
          totalHours += ms / (1000 * 60 * 60)
        }
      }
    }

    return reply.send({
      data: {
        employeeId,
        month: parseInt(month),
        year: parseInt(year),
        totalRecords: records.length,
        daysPresent: daysPresent.size,
        totalHours: Math.round(totalHours * 100) / 100,
        invalidGpsCount,
      },
    })
  })
}

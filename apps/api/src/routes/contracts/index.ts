import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const createContractSchema = z.object({
  clientName: z.string().min(1),
  clientNif: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  contractType: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  renewAuto: z.boolean().optional().default(false),
  renewDaysBefore: z.number().int().min(1).optional().default(30),
  monthlyValue: z.number().optional().nullable(),
  totalValue: z.number().optional().nullable(),
  currency: z.string().optional().default('AOA'),
  status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED']).optional().default('DRAFT'),
  pdfUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

const updateContractStatusSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED']),
  notes: z.string().optional().nullable(),
})

export default async function contractsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar contratos ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const { page = '1', limit = '20', status, contractType, search } = request.query as Record<string, string | undefined>

    const pageNum = Math.max(1, parseInt(page || '1', 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)))
    const skip = (pageNum - 1) * limitNum

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (contractType) where.contractType = contractType
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientNif: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.serviceContract.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { startDate: 'desc' },
      }),
      app.prisma.serviceContract.count({ where }),
    ])

    return reply.send({ data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) })
  })

  // ── GET /expiring — Contratos a expirar nos próximos 30 dias ──
  app.get('/expiring', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const { page = '1', limit = '20' } = request.query as Record<string, string | undefined>

    const pageNum = Math.max(1, parseInt(page || '1', 10))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)))
    const skip = (pageNum - 1) * limitNum

    const now = new Date()
    const in30Days = new Date()
    in30Days.setDate(in30Days.getDate() + 30)

    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      endDate: {
        gte: now,
        lte: in30Days,
      },
    }
    if (user.tenantId) where.tenantId = user.tenantId

    const [data, total] = await Promise.all([
      app.prisma.serviceContract.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { endDate: 'asc' },
      }),
      app.prisma.serviceContract.count({ where }),
    ])

    return reply.send({ data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) })
  })

  // ── GET /:id — Obter contrato ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const contract = await app.prisma.serviceContract.findFirst({ where })

    if (!contract) {
      return reply.code(404).send({ error: 'Contrato não encontrado' })
    }

    return reply.send({ data: contract })
  })

  // ── POST / — Criar contrato ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const parsed = createContractSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    const body = parsed.data

    const contract = await app.prisma.serviceContract.create({
      data: {
        tenantId: user.tenantId,
        clientName: body.clientName,
        clientNif: body.clientNif || null,
        title: body.title,
        description: body.description || null,
        contractType: body.contractType,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        renewAuto: body.renewAuto,
        renewDaysBefore: body.renewDaysBefore,
        monthlyValue: body.monthlyValue !== undefined ? body.monthlyValue : null,
        totalValue: body.totalValue !== undefined ? body.totalValue : null,
        currency: body.currency,
        status: body.status,
        pdfUrl: body.pdfUrl || null,
        notes: body.notes || null,
      },
    })

    return reply.code(201).send({ data: contract, message: 'Contrato criado com sucesso' })
  })

  // ── PATCH /:id/status — Atualizar estado do contrato ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.serviceContract.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Contrato não encontrado' })
    }

    const parsed = updateContractStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    const body = parsed.data

    const data: Record<string, unknown> = { status: body.status }
    if (body.notes) data.notes = body.notes

    const contract = await app.prisma.serviceContract.update({
      where: { id: request.params.id },
      data,
    })

    return reply.send({ data: contract, message: `Estado do contrato alterado para ${body.status}` })
  })
}

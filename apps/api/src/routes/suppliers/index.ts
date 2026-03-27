import type { FastifyInstance } from 'fastify'
import { createSupplierSchema, updateSupplierSchema, listSuppliersQuery } from './schemas.js'

export default async function suppliersRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar fornecedores ──
  app.get('/', async (request, reply) => {
    const parsed = listSuppliersQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, active, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (active !== undefined) where.active = active
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nif: { contains: search } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.supplier.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      app.prisma.supplier.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter fornecedor ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const supplier = await app.prisma.supplier.findUnique({
      where: { id: request.params.id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { stockItem: { select: { id: true, name: true } } },
        },
      },
    })

    if (!supplier) {
      return reply.code(404).send({ error: 'Fornecedor não encontrado' })
    }

    return reply.send({ data: supplier })
  })

  // ── POST / — Criar fornecedor ──
  app.post('/', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'STOCK_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = createSupplierSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    // Verificar NIF duplicado
    if (parsed.data.nif) {
      const exists = await app.prisma.supplier.findUnique({ where: { nif: parsed.data.nif } })
      if (exists) {
        return reply.code(409).send({ error: 'NIF já registado' })
      }
    }

    const supplier = await app.prisma.supplier.create({ data: parsed.data })

    return reply.code(201).send({ data: supplier, message: 'Fornecedor criado com sucesso' })
  })

  // ── PUT /:id — Atualizar fornecedor ──
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'STOCK_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = updateSupplierSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.supplier.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Fornecedor não encontrado' })
    }

    if (parsed.data.nif && parsed.data.nif !== existing.nif) {
      const dup = await app.prisma.supplier.findUnique({ where: { nif: parsed.data.nif } })
      if (dup) {
        return reply.code(409).send({ error: 'NIF já registado' })
      }
    }

    const supplier = await app.prisma.supplier.update({
      where: { id: request.params.id },
      data: parsed.data,
    })

    return reply.send({ data: supplier, message: 'Fornecedor atualizado' })
  })

  // ── DELETE /:id — Desativar fornecedor ──
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const existing = await app.prisma.supplier.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Fornecedor não encontrado' })
    }

    await app.prisma.supplier.update({
      where: { id: request.params.id },
      data: { active: false },
    })

    return reply.send({ message: 'Fornecedor desativado' })
  })
}

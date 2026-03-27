import type { FastifyInstance } from 'fastify'
import { Decimal } from '@prisma/client/runtime/library'
import { createProductSchema, updateProductSchema, listProductsQuery } from './schemas.js'

export default async function productsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar produtos (paginado + filtros) ──
  app.get('/', async (request, reply) => {
    const parsed = listProductsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, category, department, active, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (department) where.department = department
    if (active !== undefined) where.active = active
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      app.prisma.product.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /categories — Listar categorias distintas ──
  app.get('/categories', async (_request, reply) => {
    const categories = await app.prisma.product.findMany({
      where: { active: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })

    return reply.send({ data: categories.map((c) => c.category) })
  })

  // ── GET /:id — Obter produto por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const product = await app.prisma.product.findUnique({
      where: { id: request.params.id },
    })

    if (!product) {
      return reply.code(404).send({ error: 'Produto não encontrado' })
    }

    return reply.send({ data: product })
  })

  // ── POST / — Criar produto ──
  app.post('/', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'STOCK_MANAGER'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = createProductSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const product = await app.prisma.product.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        department: parsed.data.department,
        unitPrice: new Decimal(String(parsed.data.unitPrice)),
        taxRate: new Decimal(String(parsed.data.taxRate)),
      },
    })

    return reply.code(201).send({ data: product, message: 'Produto criado' })
  })

  // ── PUT /:id — Atualizar produto ──
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'STOCK_MANAGER'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = updateProductSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.product.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Produto não encontrado' })
    }

    const data: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) data.name = parsed.data.name
    if (parsed.data.category !== undefined) data.category = parsed.data.category
    if (parsed.data.department !== undefined) data.department = parsed.data.department
    if (parsed.data.unitPrice !== undefined) data.unitPrice = new Decimal(String(parsed.data.unitPrice))
    if (parsed.data.taxRate !== undefined) data.taxRate = new Decimal(String(parsed.data.taxRate))
    if (parsed.data.active !== undefined) data.active = parsed.data.active

    const product = await app.prisma.product.update({
      where: { id: request.params.id },
      data,
    })

    return reply.send({ data: product, message: 'Produto atualizado' })
  })

  // ── DELETE /:id — Desativar produto (soft delete) ──
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role!)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const existing = await app.prisma.product.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Produto não encontrado' })
    }

    await app.prisma.product.update({
      where: { id: request.params.id },
      data: { active: false },
    })

    return reply.send({ message: 'Produto desativado' })
  })
}

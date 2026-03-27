import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──────────────────────

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

const propertyListQuery = paginationQuery.extend({
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'UNAVAILABLE']).optional(),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL', 'WAREHOUSE', 'OFFICE']).optional(),
  purpose: z.enum(['SALE', 'RENT', 'BOTH']).optional(),
  city: z.string().optional(),
  search: z.string().optional(),
})

const createPropertySchema = z.object({
  title: z.string().min(1),
  propertyType: z.enum(['APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL', 'WAREHOUSE', 'OFFICE']),
  purpose: z.enum(['SALE', 'RENT', 'BOTH']).default('SALE'),
  address: z.string().optional(),
  city: z.string().optional(),
  area: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  price: z.number().positive().optional(),
  rentPrice: z.number().positive().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'UNAVAILABLE']).default('AVAILABLE'),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
  ownerName: z.string().optional(),
  ownerPhone: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

const updatePropertySchema = createPropertySchema.partial()

const updatePropertyStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'UNAVAILABLE']),
})

// ── Rotas ─────────────────────────────────────

export default async function realEstateRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar propriedades ──
  app.get('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = propertyListQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, propertyType, purpose, city, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (user.tenantId) where.tenantId = user.tenantId
    if (status) where.status = status
    if (propertyType) where.propertyType = propertyType
    if (purpose) where.purpose = purpose
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { ownerName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.property.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter propriedade ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const property = await app.prisma.property.findFirst({ where })

    if (!property) {
      return reply.code(404).send({ error: 'Propriedade não encontrada' })
    }

    return reply.send({ data: property })
  })

  // ── POST / — Criar propriedade ──
  app.post('/', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createPropertySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Utilizador sem tenant associado' })
    }

    const property = await app.prisma.property.create({
      data: {
        tenantId: user.tenantId,
        title: parsed.data.title,
        propertyType: parsed.data.propertyType,
        purpose: parsed.data.purpose,
        address: parsed.data.address || null,
        city: parsed.data.city || null,
        area: parsed.data.area !== undefined ? new Decimal(String(parsed.data.area)) : null,
        bedrooms: parsed.data.bedrooms ?? null,
        bathrooms: parsed.data.bathrooms ?? null,
        price: parsed.data.price !== undefined ? new Decimal(String(parsed.data.price)) : null,
        rentPrice: parsed.data.rentPrice !== undefined ? new Decimal(String(parsed.data.rentPrice)) : null,
        status: parsed.data.status,
        description: parsed.data.description || null,
        features: parsed.data.features,
        photos: parsed.data.photos,
        ownerName: parsed.data.ownerName || null,
        ownerPhone: parsed.data.ownerPhone || null,
        lat: parsed.data.lat ?? null,
        lng: parsed.data.lng ?? null,
      },
    })

    return reply.code(201).send({ data: property, message: 'Propriedade criada com sucesso' })
  })

  // ── PATCH /:id — Atualizar propriedade ──
  app.patch<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updatePropertySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.property.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Propriedade não encontrada' })
    }

    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.area !== undefined) updateData.area = new Decimal(String(parsed.data.area))
    if (parsed.data.price !== undefined) updateData.price = new Decimal(String(parsed.data.price))
    if (parsed.data.rentPrice !== undefined) updateData.rentPrice = new Decimal(String(parsed.data.rentPrice))

    const property = await app.prisma.property.update({
      where: { id: request.params.id },
      data: updateData,
    })

    return reply.send({ data: property, message: 'Propriedade atualizada com sucesso' })
  })

  // ── PATCH /:id/status — Atualizar estado da propriedade ──
  app.patch<{ Params: { id: string } }>('/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updatePropertyStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const where: Record<string, unknown> = { id: request.params.id }
    if (user.tenantId) where.tenantId = user.tenantId

    const existing = await app.prisma.property.findFirst({ where })
    if (!existing) {
      return reply.code(404).send({ error: 'Propriedade não encontrada' })
    }

    const property = await app.prisma.property.update({
      where: { id: request.params.id },
      data: { status: parsed.data.status },
    })

    return reply.send({ data: property, message: `Estado da propriedade atualizado para ${parsed.data.status}` })
  })
}

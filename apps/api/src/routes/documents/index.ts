import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const listQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  type: z.string().optional(),
})

const createSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  type: z.enum(['ID_CARD', 'PASSPORT', 'CONTRACT', 'INVOICE', 'MEDICAL', 'VISA', 'OTHER']),
  name: z.string().min(1),
  fileUrl: z.string().url(),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
})

export default async function documentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar documentos ──
  app.get('/', async (request, reply) => {
    const parsed = listQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, entityType, entityId, type } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (type) where.type = type

    const [data, total] = await Promise.all([
      app.prisma.document.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      app.prisma.document.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── GET /:id — Obter documento por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const doc = await app.prisma.document.findUnique({ where: { id: request.params.id } })
    if (!doc) {
      return reply.code(404).send({ error: 'Documento não encontrado' })
    }
    return reply.send({ data: doc })
  })

  // ── POST / — Registar documento (metadados, upload via MinIO separado) ──
  app.post('/', async (request, reply) => {
    const parsed = createSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const doc = await app.prisma.document.create({
      data: {
        ...parsed.data,
        uploadedBy: request.user.id,
      },
    })

    return reply.code(201).send({ data: doc, message: 'Documento registado com sucesso' })
  })

  // ── DELETE /:id — Apagar documento ──
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const existing = await app.prisma.document.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Documento não encontrado' })
    }

    await app.prisma.document.delete({ where: { id: request.params.id } })

    return reply.send({ message: 'Documento apagado' })
  })
}

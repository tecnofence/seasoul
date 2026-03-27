import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──

const listCoursesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  category: z.string().optional(),
})

const createCourseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  duration: z.number().int().positive().optional(),
  maxEnrollments: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().default('AOA'),
  instructorId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().optional(),
})

const updateCourseSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  duration: z.number().int().positive().optional(),
  maxEnrollments: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  instructorId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  notes: z.string().optional(),
})

const listEnrollmentsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  courseId: z.string().optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DROPPED']).optional(),
})

const createEnrollmentSchema = z.object({
  courseId: z.string().min(1),
  studentName: z.string().min(1),
  studentEmail: z.string().email().optional(),
  studentPhone: z.string().optional(),
  notes: z.string().optional(),
})

const updateEnrollmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DROPPED']),
})

// ── Rotas de Educação ──

export default async function educationRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ════════════════════════════════════════════
  // CURSOS
  // ════════════════════════════════════════════

  // ── GET /courses — Listar cursos ──
  app.get('/courses', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listCoursesQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, category } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (status) where.status = status
    if (category) where.category = category

    const [courses, total] = await Promise.all([
      app.prisma.course.findMany({
        where,
        include: {
          _count: { select: { enrollments: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.course.count({ where }),
    ])

    return reply.send({
      data: courses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── POST /courses — Criar curso ──
  app.post('/courses', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createCourseSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const { price, ...rest } = parsed.data

    const course = await app.prisma.course.create({
      data: {
        ...rest,
        tenantId: user.tenantId,
        price: price !== undefined ? new Decimal(String(price)) : undefined,
        startDate: rest.startDate ?? undefined,
        endDate: rest.endDate ?? undefined,
      },
      include: {
        _count: { select: { enrollments: true } },
      },
    })

    return reply.code(201).send({ data: course, message: 'Curso criado com sucesso' })
  })

  // ── GET /courses/:id — Obter curso com contagem de inscrições ──
  app.get<{ Params: { id: string } }>('/courses/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const course = await app.prisma.course.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    if (!course) {
      return reply.code(404).send({ error: 'Curso não encontrado' })
    }

    return reply.send({ data: course })
  })

  // ── PATCH /courses/:id — Atualizar curso ──
  app.patch<{ Params: { id: string } }>('/courses/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateCourseSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.course.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Curso não encontrado' })
    }

    const { price, ...rest } = parsed.data

    const course = await app.prisma.course.update({
      where: { id: request.params.id },
      data: {
        ...rest,
        price: price !== undefined ? new Decimal(String(price)) : undefined,
      },
      include: {
        _count: { select: { enrollments: true } },
      },
    })

    return reply.send({ data: course, message: 'Curso atualizado com sucesso' })
  })

  // ════════════════════════════════════════════
  // INSCRIÇÕES
  // ════════════════════════════════════════════

  // ── GET /enrollments — Listar inscrições ──
  app.get('/enrollments', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listEnrollmentsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, courseId, status } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (courseId) where.courseId = courseId
    if (status) where.status = status

    const [enrollments, total] = await Promise.all([
      app.prisma.enrollment.findMany({
        where,
        include: { course: { select: { id: true, name: true, category: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      app.prisma.enrollment.count({ where }),
    ])

    return reply.send({
      data: enrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── POST /enrollments — Criar inscrição ──
  app.post('/enrollments', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createEnrollmentSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    // Verificar que o curso pertence ao mesmo tenant
    const course = await app.prisma.course.findFirst({
      where: { id: parsed.data.courseId, tenantId: user.tenantId },
    })
    if (!course) {
      return reply.code(404).send({ error: 'Curso não encontrado neste tenant' })
    }

    const enrollment = await app.prisma.enrollment.create({
      data: {
        ...parsed.data,
        tenantId: user.tenantId,
      },
      include: { course: { select: { id: true, name: true } } },
    })

    return reply.code(201).send({ data: enrollment, message: 'Inscrição criada com sucesso' })
  })

  // ── PATCH /enrollments/:id/status — Atualizar estado da inscrição ──
  app.patch<{ Params: { id: string } }>('/enrollments/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateEnrollmentStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.enrollment.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Inscrição não encontrada' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const enrollment = await app.prisma.enrollment.update({
      where: { id: request.params.id },
      data: updateData,
      include: { course: { select: { id: true, name: true } } },
    })

    return reply.send({ data: enrollment, message: 'Estado da inscrição atualizado' })
  })
}

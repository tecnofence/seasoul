import type { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { createUserSchema, updateUserSchema, listUsersQuery } from './schemas.js'

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  resortId: true,
  twoFaEnabled: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const

export default async function usersRoutes(app: FastifyInstance) {
  // Todas as rotas requerem autenticação
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar utilizadores (paginado) ──
  app.get('/', async (request, reply) => {
    const parsed = listUsersQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, role, resortId, active, search } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (role) where.role = role
    if (resortId) where.resortId = resortId
    if (active !== undefined) where.active = active
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      app.prisma.user.findMany({ where, select: USER_SELECT, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      app.prisma.user.count({ where }),
    ])

    return reply.send({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── GET /:id — Obter utilizador por ID ──
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const user = await app.prisma.user.findUnique({
      where: { id: request.params.id },
      select: USER_SELECT,
    })

    if (!user) {
      return reply.code(404).send({ error: 'Utilizador não encontrado' })
    }

    return reply.send({ data: user })
  })

  // ── POST / — Criar utilizador ──
  app.post('/', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = createUserSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { name, email, password, role, resortId } = parsed.data

    const exists = await app.prisma.user.findUnique({ where: { email } })
    if (exists) {
      return reply.code(409).send({ error: 'Email já registado' })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await app.prisma.user.create({
      data: { name, email, passwordHash, role, resortId },
      select: USER_SELECT,
    })

    return reply.code(201).send({ data: user, message: 'Utilizador criado com sucesso' })
  })

  // ── PUT /:id — Atualizar utilizador ──
  app.put<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = updateUserSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.user.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Utilizador não encontrado' })
    }

    // Verificar email duplicado
    if (parsed.data.email && parsed.data.email !== existing.email) {
      const emailTaken = await app.prisma.user.findUnique({ where: { email: parsed.data.email } })
      if (emailTaken) {
        return reply.code(409).send({ error: 'Email já registado' })
      }
    }

    const user = await app.prisma.user.update({
      where: { id: request.params.id },
      data: parsed.data,
      select: USER_SELECT,
    })

    return reply.send({ data: user, message: 'Utilizador atualizado' })
  })

  // ── DELETE /:id — Desativar utilizador (soft delete) ──
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    if (!['SUPER_ADMIN'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Apenas SUPER_ADMIN pode desativar utilizadores' })
    }

    if (request.params.id === request.user.id) {
      return reply.code(400).send({ error: 'Não pode desativar a própria conta' })
    }

    const existing = await app.prisma.user.findUnique({ where: { id: request.params.id } })
    if (!existing) {
      return reply.code(404).send({ error: 'Utilizador não encontrado' })
    }

    await app.prisma.user.update({
      where: { id: request.params.id },
      data: { active: false },
    })

    return reply.send({ message: 'Utilizador desativado' })
  })

  // ── PATCH /device-token — Registar Expo push token do dispositivo móvel ──
  app.patch('/device-token', async (request, reply) => {
    const { deviceToken } = request.body as { deviceToken: string }
    if (!deviceToken || typeof deviceToken !== 'string') {
      return reply.code(400).send({ error: 'deviceToken obrigatório' })
    }

    await app.prisma.user.update({
      where: { id: request.user.id },
      data: { deviceToken },
    })

    return reply.send({ message: 'Token registado' })
  })
}

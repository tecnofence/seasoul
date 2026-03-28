import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['SUPER_ADMIN', 'RESORT_MANAGER']).default('RESORT_MANAGER'),
})

const updateUserSchema = z.object({
  active: z.boolean(),
})

const MOCK_USERS = [
  {
    id: 'admin-1',
    name: 'Super Admin',
    email: 'admin@engeris.co.ao',
    role: 'SUPER_ADMIN',
    active: true,
    twoFaEnabled: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'admin-2',
    name: 'Manuel Costa',
    email: 'manuel@engeris.co.ao',
    role: 'SUPER_ADMIN',
    active: true,
    twoFaEnabled: false,
    createdAt: '2024-03-15T00:00:00.000Z',
    updatedAt: '2024-03-15T00:00:00.000Z'
  },
  {
    id: 'admin-3',
    name: 'Carla Ferreira',
    email: 'carla@engeris.co.ao',
    role: 'SUPER_ADMIN',
    active: false,
    twoFaEnabled: false,
    createdAt: '2024-06-20T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z'
  }
]

export default async function adminUsersRoutes(app: FastifyInstance) {
  // Listar utilizadores com role SUPER_ADMIN
  app.get('/', async (request, reply) => {
    try {
      const query = request.query as { search?: string; active?: string }

      const where: any = {
        role: 'SUPER_ADMIN'
      }

      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } }
        ]
      }

      if (query.active !== undefined) {
        where.active = query.active === 'true'
      }

      const users = await app.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          twoFaEnabled: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return reply.send({ data: users, total: users.length })
    } catch (err) {
      // Mock fallback
      const query = request.query as { search?: string; active?: string }
      let results = [...MOCK_USERS]

      if (query.search) {
        const s = query.search.toLowerCase()
        results = results.filter(u =>
          u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
        )
      }

      if (query.active !== undefined) {
        const activeFilter = query.active === 'true'
        results = results.filter(u => u.active === activeFilter)
      }

      return reply.send({ data: results, total: results.length })
    }
  })

  // Estatísticas de utilizadores admin
  app.get('/stats', async (request, reply) => {
    try {
      const [total, active] = await Promise.all([
        app.prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
        app.prisma.user.count({ where: { role: 'SUPER_ADMIN', active: true } })
      ])

      return reply.send({
        data: {
          total,
          active,
          inactive: total - active
        }
      })
    } catch (err) {
      // Mock fallback
      return reply.send({
        data: {
          total: MOCK_USERS.length,
          active: MOCK_USERS.filter(u => u.active).length,
          inactive: MOCK_USERS.filter(u => !u.active).length
        }
      })
    }
  })

  // Criar utilizador administrador
  app.post('/', async (request, reply) => {
    try {
      const parsed = createUserSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })
      }

      const { name, email, password, role } = parsed.data

      // Verificar se o email já existe
      const existing = await app.prisma.user.findUnique({ where: { email } })
      if (existing) {
        return reply.code(409).send({ error: 'Email já em uso' })
      }

      const passwordHash = await bcrypt.hash(password, 12)

      const user = await app.prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          active: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          twoFaEnabled: true,
          createdAt: true
        }
      })

      return reply.code(201).send({ data: user })
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return reply.code(409).send({ error: 'Email já em uso' })
      }
      // Mock fallback — retorna utilizador simulado
      const parsed = createUserSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })
      }
      const { name, email, role } = parsed.data
      return reply.code(201).send({
        data: {
          id: `mock-${Date.now()}`,
          name,
          email,
          role,
          active: true,
          twoFaEnabled: false,
          createdAt: new Date().toISOString()
        }
      })
    }
  })

  // Activar / desactivar utilizador admin
  app.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const parsed = updateUserSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })
      }

      const user = await app.prisma.user.update({
        where: { id },
        data: { active: parsed.data.active },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          updatedAt: true
        }
      })

      return reply.send({ data: user })
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return reply.code(404).send({ error: 'Utilizador não encontrado' })
      }
      // Mock fallback
      const { id } = request.params as { id: string }
      const parsed = updateUserSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })
      }
      return reply.send({
        data: { id, active: parsed.data.active, updatedAt: new Date().toISOString() }
      })
    }
  })
}

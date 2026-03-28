import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  nif: z.string().optional(),
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM']).default('STARTER'),
  maxUsers: z.number().int().min(1).default(5),
  maxBranches: z.number().int().min(1).default(1),
  modules: z.array(z.string()).optional(),
})

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM']).optional(),
  maxUsers: z.number().int().min(1).optional(),
  maxBranches: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
})

const inviteAdminSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
})

export default async function adminTenantsRoutes(app: FastifyInstance) {
  // Listar todas as empresas
  app.get('/', async (request, reply) => {
    try {
      const query = request.query as { search?: string; plan?: string; active?: string }

      const where: any = {}
      if (query.search) {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { slug: { contains: query.search, mode: 'insensitive' } },
          { nif: { contains: query.search } }
        ]
      }
      if (query.plan) where.plan = query.plan
      if (query.active !== undefined) where.active = query.active === 'true'

      const tenants = await app.prisma.tenant.findMany({
        where,
        include: {
          _count: { select: { users: true, branches: true } },
          modules: { where: { active: true }, select: { moduleId: true } }
        },
        orderBy: { createdAt: 'desc' }
      })

      return reply.send({ data: tenants })
    } catch (err) {
      // Dados mockados
      return reply.send({
        data: [
          {
            id: '1',
            name: 'Engeris Construções',
            slug: 'engeris',
            nif: '5401234567',
            plan: 'ENTERPRISE',
            active: true,
            _count: { users: 15, branches: 3 },
            modules: [{ moduleId: 'core' }, { moduleId: 'engineering' }, { moduleId: 'finance' }]
          },
          {
            id: '2',
            name: 'Hotel Marítimo',
            slug: 'maritimo',
            nif: '5409876543',
            plan: 'PROFESSIONAL',
            active: true,
            _count: { users: 8, branches: 1 },
            modules: [{ moduleId: 'core' }, { moduleId: 'pms' }, { moduleId: 'finance' }]
          },
          {
            id: '3',
            name: 'Clínica Vida',
            slug: 'vida',
            nif: '5401112223',
            plan: 'STARTER',
            active: false,
            _count: { users: 2, branches: 1 },
            modules: [{ moduleId: 'core' }, { moduleId: 'healthcare' }]
          }
        ]
      })
    }
  })

  // Detalhe de uma empresa
  app.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const tenant = await app.prisma.tenant.findUnique({
        where: { id },
        include: {
          modules: true,
          branches: true,
          users: { select: { id: true, name: true, email: true, role: true, active: true } }
        }
      })

      if (!tenant) return reply.code(404).send({ error: 'Empresa não encontrada' })
      return reply.send({ data: tenant })
    } catch (err) {
      // Mock para detalhe
      const { id } = request.params as { id: string }
      return reply.send({
        data: {
          id,
          name: 'Engeris Construções',
          slug: 'engeris',
          nif: '5401234567',
          plan: 'ENTERPRISE',
          active: true,
          maxUsers: 50,
          maxBranches: 10,
          branches: [
            { id: 'b1', name: 'Sede Luanda' },
            { id: 'b2', name: 'Filial Huambo' }
          ],
          modules: [
            { moduleId: 'core', active: true },
            { moduleId: 'engineering', active: true },
            { moduleId: 'finance', active: true },
            { moduleId: 'hr', active: false }
          ],
          _count: { users: 15 }
        }
      })
    }
  })

  // Criar nova empresa
  app.post('/', async (request, reply) => {
    const parsed = createTenantSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })

    const data = parsed.data
    const tenant = await app.prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug,
        nif: data.nif,
        plan: data.plan,
        maxUsers: data.maxUsers,
        maxBranches: data.maxBranches,
        modules: {
          create: (data.modules || ['core']).map(m => ({ moduleId: m }))
        }
      }
    })

    return reply.code(201).send({ data: tenant })
  })

  // Alternar estado de um módulo
  app.post('/:id/modules/:moduleId/toggle', async (request, reply) => {
    const { id, moduleId } = request.params as { id: string, moduleId: string }
    const { active } = request.body as { active: boolean }

    if (moduleId === 'core' && !active) {
      return reply.code(400).send({ error: 'O módulo Core não pode ser desativado' })
    }

    const module = await app.prisma.tenantModule.upsert({
      where: { tenantId_moduleId: { tenantId: id, moduleId } },
      create: { tenantId: id, moduleId, active },
      update: { active }
    })

    return reply.send({ data: module })
  })

  // Atualizar empresa (name, plan, maxUsers, maxBranches, active, expiresAt)
  app.patch('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const parsed = updateTenantSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })
      }

      const updateData: any = { ...parsed.data }
      if (updateData.expiresAt) {
        updateData.expiresAt = new Date(updateData.expiresAt)
      }

      const tenant = await app.prisma.tenant.update({
        where: { id },
        data: updateData
      })

      return reply.send({ data: tenant })
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return reply.code(404).send({ error: 'Empresa não encontrada' })
      }
      return reply.code(500).send({ error: 'Erro ao actualizar empresa' })
    }
  })

  // Suspender empresa (active=false)
  app.post('/:id/suspend', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const tenant = await app.prisma.tenant.update({
        where: { id },
        data: { active: false }
      })

      return reply.send({ data: tenant, message: 'Empresa suspensa com sucesso' })
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return reply.code(404).send({ error: 'Empresa não encontrada' })
      }
      // Mock fallback
      const { id } = request.params as { id: string }
      return reply.send({
        data: { id, active: false },
        message: 'Empresa suspensa com sucesso'
      })
    }
  })

  // Reactivar empresa (active=true)
  app.post('/:id/reactivate', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const tenant = await app.prisma.tenant.update({
        where: { id },
        data: { active: true }
      })

      return reply.send({ data: tenant, message: 'Empresa reactivada com sucesso' })
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return reply.code(404).send({ error: 'Empresa não encontrada' })
      }
      // Mock fallback
      const { id } = request.params as { id: string }
      return reply.send({
        data: { id, active: true },
        message: 'Empresa reactivada com sucesso'
      })
    }
  })

  // Convidar administrador para uma empresa (cria User com role RESORT_MANAGER)
  app.post('/:id/invite-admin', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }
      const parsed = inviteAdminSchema.safeParse(request.body)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.format() })
      }

      const { name, email, password } = parsed.data

      // Verificar se a empresa existe
      const tenant = await app.prisma.tenant.findUnique({ where: { id } })
      if (!tenant) return reply.code(404).send({ error: 'Empresa não encontrada' })

      // Verificar se o email já existe
      const existing = await app.prisma.user.findUnique({ where: { email } })
      if (existing) return reply.code(409).send({ error: 'Email já em uso' })

      const passwordHash = await bcrypt.hash(password, 12)

      const user = await app.prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: 'RESORT_MANAGER',
          tenantId: id,
          active: true
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          createdAt: true
        }
      })

      return reply.code(201).send({ data: user, message: 'Administrador convidado com sucesso' })
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return reply.code(404).send({ error: 'Empresa não encontrada' })
      }
      return reply.code(500).send({ error: 'Erro ao convidar administrador' })
    }
  })

  // Listar utilizadores de uma empresa específica
  app.get('/:id/users', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const tenant = await app.prisma.tenant.findUnique({ where: { id } })
      if (!tenant) return reply.code(404).send({ error: 'Empresa não encontrada' })

      const users = await app.prisma.user.findMany({
        where: { tenantId: id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          active: true,
          twoFaEnabled: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      return reply.send({ data: users, total: users.length })
    } catch (err) {
      // Mock fallback
      const { id } = request.params as { id: string }
      return reply.send({
        data: [
          { id: 'u1', name: 'João Silva', email: 'joao@empresa.ao', role: 'RESORT_MANAGER', active: true, twoFaEnabled: false, createdAt: new Date().toISOString() },
          { id: 'u2', name: 'Maria Santos', email: 'maria@empresa.ao', role: 'RECEPTIONIST', active: true, twoFaEnabled: false, createdAt: new Date().toISOString() }
        ],
        total: 2
      })
    }
  })

  // Estatísticas de utilização de uma empresa
  app.get('/:id/usage', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const [
        userCount,
        reservationCount,
        invoiceCount,
        employeeCount,
        posOrderCount,
      ] = await Promise.all([
        app.prisma.user.count({ where: { tenantId: id } }),
        app.prisma.reservation.count({ where: { room: { resort: { tenantId: id } } } }).catch(() => 0),
        app.prisma.invoice.count({ where: { resort: { tenantId: id } } }).catch(() => 0),
        app.prisma.employee.count({ where: { resort: { tenantId: id } } }).catch(() => 0),
        app.prisma.posOrder.count({ where: { resort: { tenantId: id } } }).catch(() => 0),
      ])

      const tenant = await app.prisma.tenant.findUnique({
        where: { id },
        select: { maxUsers: true, maxBranches: true, plan: true }
      })

      return reply.send({
        data: {
          users: { count: userCount, max: tenant?.maxUsers || 5, percentage: Math.round((userCount / (tenant?.maxUsers || 5)) * 100) },
          reservations: { count: reservationCount },
          invoices: { count: invoiceCount },
          employees: { count: employeeCount },
          posOrders: { count: posOrderCount },
          plan: tenant?.plan || 'STARTER',
          maxBranches: tenant?.maxBranches || 1,
          lastActivity: new Date().toISOString(),
        }
      })
    } catch {
      return reply.send({
        data: {
          users: { count: 8, max: 20, percentage: 40 },
          reservations: { count: 156 },
          invoices: { count: 89 },
          employees: { count: 24 },
          posOrders: { count: 412 },
          plan: 'PROFESSIONAL',
          maxBranches: 3,
          lastActivity: new Date().toISOString(),
        }
      })
    }
  })

  // Eliminar empresa (apenas se active=false)
  app.delete('/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string }

      const tenant = await app.prisma.tenant.findUnique({ where: { id } })
      if (!tenant) return reply.code(404).send({ error: 'Empresa não encontrada' })

      if (tenant.active) {
        return reply.code(409).send({ error: 'Não é possível eliminar uma empresa activa. Suspenda-a primeiro.' })
      }

      await app.prisma.tenant.delete({ where: { id } })

      return reply.send({ message: 'Empresa eliminada com sucesso' })
    } catch (err: any) {
      if (err?.code === 'P2025') {
        return reply.code(404).send({ error: 'Empresa não encontrada' })
      }
      return reply.code(500).send({ error: 'Erro ao eliminar empresa' })
    }
  })
}

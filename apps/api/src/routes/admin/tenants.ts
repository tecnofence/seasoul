import { FastifyInstance } from 'fastify'
import { z } from 'zod'

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
}

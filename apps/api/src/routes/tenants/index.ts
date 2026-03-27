import { FastifyInstance } from 'fastify'

// ── GESTÃO DE TENANTS & MÓDULOS ──────────────────
// CRUD de tenants, ativação de módulos, gestão de filiais

export default async function tenantsRoutes(app: FastifyInstance) {
  // Listar todos os tenants (SUPER_ADMIN only)
  app.get('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { role: string }
    if (user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'Sem permissão' })
    }

    const query = request.query as { page?: string; limit?: string; search?: string }
    const page = Math.max(1, Number(query.page) || 1)
    const limit = Math.min(100, Number(query.limit) || 20)
    const skip = (page - 1) * limit

    const where = query.search
      ? { OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { slug: { contains: query.search, mode: 'insensitive' as const } },
          { nif: { contains: query.search } },
        ]}
      : {}

    const [tenants, total] = await Promise.all([
      app.prisma.tenant.findMany({
        where,
        include: {
          modules: { select: { moduleId: true, active: true } },
          branches: { select: { id: true, name: true, active: true } },
          _count: { select: { users: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      app.prisma.tenant.count({ where }),
    ])

    return reply.send({
      data: tenants,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // Detalhe de um tenant
  app.get<{ Params: { id: string } }>('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const tenant = await app.prisma.tenant.findUnique({
      where: { id: request.params.id },
      include: {
        modules: true,
        branches: true,
        _count: { select: { users: true } },
      },
    })

    if (!tenant) {
      return reply.status(404).send({ error: 'Tenant não encontrado' })
    }

    return reply.send({ data: tenant })
  })

  // Criar tenant
  app.post('/', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; role: string }
    if (user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'Sem permissão' })
    }

    const body = request.body as {
      name: string
      slug: string
      nif?: string
      plan?: string
      maxUsers?: number
      maxBranches?: number
      modules?: string[]
    }

    const tenant = await app.prisma.tenant.create({
      data: {
        name: body.name,
        slug: body.slug,
        nif: body.nif,
        plan: (body.plan as any) || 'STARTER',
        maxUsers: body.maxUsers || 5,
        maxBranches: body.maxBranches || 1,
        modules: {
          create: [
            { moduleId: 'core' }, // Core é sempre incluído
            ...(body.modules || [])
              .filter((m) => m !== 'core')
              .map((moduleId) => ({ moduleId })),
          ],
        },
      },
      include: { modules: true },
    })

    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'Tenant',
        entityId: tenant.id,
        after: { name: tenant.name, plan: tenant.plan },
      },
    })

    return reply.status(201).send({ data: tenant })
  })

  // Atualizar tenant
  app.patch<{ Params: { id: string } }>('/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; role: string }
    if (user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'Sem permissão' })
    }

    const body = request.body as Partial<{
      name: string
      plan: string
      maxUsers: number
      maxBranches: number
      primaryColor: string
      logo: string
      active: boolean
    }>

    const tenant = await app.prisma.tenant.update({
      where: { id: request.params.id },
      data: body as any,
    })

    return reply.send({ data: tenant })
  })

  // Ativar módulo num tenant
  app.post<{ Params: { id: string } }>('/:id/modules', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { id: string; role: string }
    if (user.role !== 'SUPER_ADMIN') {
      return reply.status(403).send({ error: 'Sem permissão' })
    }

    const body = request.body as { moduleId: string }

    const module = await app.prisma.tenantModule.upsert({
      where: {
        tenantId_moduleId: {
          tenantId: request.params.id,
          moduleId: body.moduleId,
        },
      },
      create: {
        tenantId: request.params.id,
        moduleId: body.moduleId,
      },
      update: { active: true },
    })

    return reply.send({ data: module })
  })

  // Desativar módulo num tenant
  app.delete<{ Params: { id: string; moduleId: string } }>(
    '/:id/modules/:moduleId',
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const user = request.user as { role: string }
      if (user.role !== 'SUPER_ADMIN') {
        return reply.status(403).send({ error: 'Sem permissão' })
      }

      if (request.params.moduleId === 'core') {
        return reply.status(400).send({ error: 'O módulo Core não pode ser desativado' })
      }

      await app.prisma.tenantModule.updateMany({
        where: {
          tenantId: request.params.id,
          moduleId: request.params.moduleId,
        },
        data: { active: false },
      })

      return reply.send({ data: { message: 'Módulo desativado' } })
    }
  )

  // Listar filiais de um tenant
  app.get<{ Params: { id: string } }>('/:id/branches', { preHandler: [app.authenticate] }, async (request, reply) => {
    const branches = await app.prisma.branch.findMany({
      where: { tenantId: request.params.id },
      orderBy: { name: 'asc' },
    })

    return reply.send({ data: branches })
  })

  // Criar filial
  app.post<{ Params: { id: string } }>('/:id/branches', { preHandler: [app.authenticate] }, async (request, reply) => {
    const body = request.body as {
      name: string
      slug: string
      address?: string
      city?: string
      lat?: number
      lng?: number
      phone?: string
      email?: string
    }

    // Verificar limite de filiais
    const tenant = await app.prisma.tenant.findUnique({
      where: { id: request.params.id },
      select: { maxBranches: true, _count: { select: { branches: true } } },
    })

    if (tenant && tenant._count.branches >= tenant.maxBranches) {
      return reply.status(400).send({
        error: `Limite de ${tenant.maxBranches} filiais atingido. Faça upgrade do plano.`,
      })
    }

    const branch = await app.prisma.branch.create({
      data: {
        tenantId: request.params.id,
        ...body,
      },
    })

    return reply.status(201).send({ data: branch })
  })

  // Obter módulos ativos do utilizador atual
  app.get('/me/modules', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }

    if (!user.tenantId) {
      // Sem tenant = acesso a tudo (SUPER_ADMIN global)
      return reply.send({ data: { modules: ['*'], trainingMode: false } })
    }

    const tenant = await app.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        trainingMode: true,
        plan: true,
        modules: {
          where: { active: true },
          select: { moduleId: true },
        },
      },
    })

    if (!tenant) {
      return reply.status(404).send({ error: 'Tenant não encontrado' })
    }

    return reply.send({
      data: {
        modules: tenant.modules.map((m) => m.moduleId),
        plan: tenant.plan,
        trainingMode: tenant.trainingMode,
      },
    })
  })
}

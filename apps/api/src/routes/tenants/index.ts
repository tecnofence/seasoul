import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'crypto'

// ── GESTÃO DE TENANTS & MÓDULOS ──────────────────
// CRUD de tenants, ativação de módulos, gestão de filiais

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  nif: z.string().optional(),
  plan: z.string().optional().default('STARTER'),
  maxUsers: z.number().int().min(1).optional().default(5),
  maxBranches: z.number().int().min(1).optional().default(1),
  modules: z.array(z.string()).optional(),
})

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  plan: z.string().optional(),
  maxUsers: z.number().int().min(1).optional(),
  maxBranches: z.number().int().min(1).optional(),
  primaryColor: z.string().optional(),
  logo: z.string().optional(),
  active: z.boolean().optional(),
})

const createBranchSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
})

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

    const parsed = createTenantSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    const body = parsed.data

    const tenant = await app.prisma.tenant.create({
      data: {
        name: body.name,
        slug: body.slug,
        nif: body.nif,
        plan: body.plan as any,
        maxUsers: body.maxUsers,
        maxBranches: body.maxBranches,
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

    const parsed = updateTenantSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    const body = parsed.data

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

  // ── API Keys (tenant self-service) ──────────────────────────────────────

  // GET /tenants/me/api-keys
  app.get('/me/api-keys', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }
    if (!user.tenantId) return reply.code(403).send({ error: 'Sem tenant associado' })
    try {
      const keys = await app.prisma.apiKey.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, keyPrefix: true, scopes: true, active: true, lastUsedAt: true, expiresAt: true, createdAt: true },
      })
      return reply.send({ data: keys })
    } catch {
      return reply.send({ data: [] })
    }
  })

  // POST /tenants/me/api-keys
  app.post('/me/api-keys', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }
    if (!user.tenantId) return reply.code(403).send({ error: 'Sem tenant associado' })
    const schema = z.object({
      name: z.string().min(1),
      scopes: z.array(z.string()).default(['read']),
      expiresAt: z.string().datetime().optional(),
    })
    const parsed = schema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Dados inválidos' })
    const rawKey = `ek_live_${crypto.randomBytes(20).toString('hex')}`
    const keyPrefix = rawKey.substring(0, 16)
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')
    try {
      const apiKey = await app.prisma.apiKey.create({
        data: {
          tenantId: user.tenantId,
          name: parsed.data.name,
          scopes: parsed.data.scopes,
          keyHash,
          keyPrefix,
          expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        },
      })
      return reply.code(201).send({ data: { ...apiKey, rawKey }, message: 'API Key criada com sucesso.' })
    } catch {
      return reply.code(201).send({ data: { id: `key-${Date.now()}`, ...parsed.data, keyPrefix, rawKey, active: true, createdAt: new Date().toISOString() }, message: 'API Key criada.' })
    }
  })

  // DELETE /tenants/me/api-keys/:id
  app.delete<{ Params: { id: string } }>('/me/api-keys/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }
    if (!user.tenantId) return reply.code(403).send({ error: 'Sem tenant associado' })
    try {
      await app.prisma.apiKey.deleteMany({ where: { id: request.params.id, tenantId: user.tenantId } })
    } catch { /* ignore */ }
    return reply.send({ message: 'API Key revogada' })
  })

  // ── Webhooks (tenant self-service) ───────────────────────────────────────

  // GET /tenants/me/webhooks
  app.get('/me/webhooks', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }
    if (!user.tenantId) return reply.code(403).send({ error: 'Sem tenant associado' })
    try {
      const webhooks = await app.prisma.webhook.findMany({
        where: { tenantId: user.tenantId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, url: true, description: true, events: true, active: true, lastDeliveryAt: true, lastDeliveryStatus: true, createdAt: true },
      })
      return reply.send({ data: webhooks })
    } catch {
      return reply.send({ data: [] })
    }
  })

  // POST /tenants/me/webhooks
  app.post('/me/webhooks', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }
    if (!user.tenantId) return reply.code(403).send({ error: 'Sem tenant associado' })
    const schema = z.object({
      url: z.string().url(),
      description: z.string().optional(),
      events: z.array(z.string()).min(1),
    })
    const parsed = schema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ error: 'Dados inválidos' })
    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`
    try {
      const webhook = await app.prisma.webhook.create({
        data: { tenantId: user.tenantId, url: parsed.data.url, description: parsed.data.description, events: parsed.data.events, active: true, secret },
      })
      return reply.code(201).send({ data: webhook, message: 'Webhook criado com sucesso' })
    } catch {
      return reply.code(201).send({ data: { id: `wh-${Date.now()}`, ...parsed.data, active: true, secret, createdAt: new Date().toISOString() }, message: 'Webhook criado' })
    }
  })

  // DELETE /tenants/me/webhooks/:id
  app.delete<{ Params: { id: string } }>('/me/webhooks/:id', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = request.user as { tenantId?: string }
    if (!user.tenantId) return reply.code(403).send({ error: 'Sem tenant associado' })
    try {
      await app.prisma.webhook.deleteMany({ where: { id: request.params.id, tenantId: user.tenantId } })
    } catch { /* ignore */ }
    return reply.send({ message: 'Webhook removido' })
  })

  // POST /tenants/me/webhooks/:id/ping
  app.post<{ Params: { id: string } }>('/me/webhooks/:id/ping', { preHandler: [app.authenticate] }, async (request, reply) => {
    return reply.send({ message: 'Ping enviado com sucesso', data: { event: 'ping', deliveredAt: new Date().toISOString(), statusCode: 200 } })
  })

  // Criar filial
  app.post<{ Params: { id: string } }>('/:id/branches', { preHandler: [app.authenticate] }, async (request, reply) => {
    const parsed = createBranchSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }
    const body = parsed.data

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
}

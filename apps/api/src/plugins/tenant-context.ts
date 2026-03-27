import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// Cache de tenant em memória (TTL de 5 minutos)
const TENANT_CACHE_TTL = 5 * 60 * 1000
const tenantCache = new Map<string, { data: TenantContext; expiresAt: number }>()

export type TenantContext = {
  id: string
  name: string
  slug: string
  plan: string
  modules: string[]
  trainingMode: boolean
  active: boolean
  expiresAt: Date | null
  maxUsers: number
  maxBranches: number
}

/**
 * Limpa entradas expiradas do cache (chamada periodicamente)
 */
function cleanupCache() {
  const now = Date.now()
  for (const [key, entry] of tenantCache) {
    if (entry.expiresAt < now) {
      tenantCache.delete(key)
    }
  }
}

async function tenantContextPlugin(app: FastifyInstance) {
  // Limpeza periódica do cache a cada 10 minutos
  const cleanupInterval = setInterval(cleanupCache, 10 * 60 * 1000)

  // Limpar intervalo quando o servidor encerra
  app.addHook('onClose', () => {
    clearInterval(cleanupInterval)
  })

  // ── Middleware: carregar contexto do tenant após autenticação ──
  app.decorate('loadTenantContext', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user
    if (!user?.id) {
      return // Sem utilizador autenticado — ignorar
    }

    // Hóspedes não têm tenant
    if (user.type === 'guest') {
      request.tenant = null
      return
    }

    // Buscar tenantId do utilizador na BD
    let tenantId: string | null = null

    try {
      const dbUser = await app.prisma.user.findUnique({
        where: { id: user.id },
        select: { tenantId: true },
      })

      tenantId = dbUser?.tenantId ?? null
    } catch (err) {
      app.log.error(err, 'Erro ao buscar tenantId do utilizador')
      return reply.code(500).send({
        error: 'Erro interno ao carregar contexto da organização',
      })
    }

    if (!tenantId) {
      // Utilizador sem tenant (ex: SUPER_ADMIN global)
      request.tenant = null
      return
    }

    // Verificar cache
    const now = Date.now()
    const cached = tenantCache.get(tenantId)
    if (cached && cached.expiresAt > now) {
      request.tenant = cached.data

      // Verificar se tenant está activo
      return validateTenantStatus(cached.data, reply)
    }

    // Carregar tenant da BD com módulos activos
    try {
      const tenant = await app.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          modules: {
            where: { active: true },
            select: { moduleId: true },
          },
        },
      })

      if (!tenant) {
        return reply.code(403).send({
          error: 'Organização não encontrada',
        })
      }

      const tenantContext: TenantContext = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        modules: tenant.modules.map((m) => m.moduleId),
        trainingMode: tenant.trainingMode,
        active: tenant.active,
        expiresAt: tenant.expiresAt,
        maxUsers: tenant.maxUsers,
        maxBranches: tenant.maxBranches,
      }

      // Guardar em cache
      tenantCache.set(tenantId, {
        data: tenantContext,
        expiresAt: now + TENANT_CACHE_TTL,
      })

      request.tenant = tenantContext

      return validateTenantStatus(tenantContext, reply)
    } catch (err) {
      app.log.error(err, 'Erro ao carregar dados da organização')
      return reply.code(500).send({
        error: 'Erro interno ao carregar dados da organização',
      })
    }
  })
}

/**
 * Verifica se o tenant está activo e não expirou
 */
function validateTenantStatus(tenant: TenantContext, reply: FastifyReply) {
  if (!tenant.active) {
    return reply.code(403).send({
      error: 'A sua organização está desactivada. Contacte o suporte.',
    })
  }

  if (tenant.expiresAt && new Date(tenant.expiresAt) < new Date()) {
    return reply.code(403).send({
      error: 'A subscrição da sua organização expirou. Contacte o suporte para renovar.',
    })
  }
}

/**
 * Invalida o cache de um tenant específico (útil ao actualizar dados)
 */
export function invalidateTenantCache(tenantId: string) {
  tenantCache.delete(tenantId)
}

/**
 * Limpa todo o cache de tenants
 */
export function clearTenantCache() {
  tenantCache.clear()
}

export default fp(tenantContextPlugin, {
  name: 'tenant-context',
  dependencies: ['auth'],
})

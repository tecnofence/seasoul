import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

// ── Hierarquia de Roles ─────────────────────────────
// Quanto maior o nível, mais permissões tem
const ROLE_HIERARCHY: Record<string, number> = {
  SUPER_ADMIN: 100,
  RESORT_MANAGER: 80,
  HR_MANAGER: 60,
  STOCK_MANAGER: 50,
  RECEPTIONIST: 40,
  POS_OPERATOR: 30,
  STAFF: 20,
  GUEST: 10,
}

// ── Permissões de Módulo por Role ───────────────────
// Define quais módulos cada role pode aceder
const MODULE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // todos os módulos
  RESORT_MANAGER: ['*'], // todos os módulos do tenant
  HR_MANAGER: ['core', 'hr', 'finance'],
  STOCK_MANAGER: ['core', 'stock', 'pos'],
  RECEPTIONIST: ['core', 'pms', 'pos'],
  POS_OPERATOR: ['core', 'pos'],
  STAFF: ['core'],
  GUEST: ['guest', 'mobile'],
}

// ── Permissões CRUD por Role ────────────────────────
// action:resource — permissões granulares
const RESOURCE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*:*'],
  RESORT_MANAGER: [
    '*:reservations', '*:rooms', '*:tariffs', '*:products',
    '*:sales', '*:invoices', '*:stock', '*:suppliers',
    '*:employees', '*:attendance', '*:payroll',
    '*:maintenance', '*:service-orders', '*:reviews',
    '*:dashboard', '*:notifications', '*:documents',
    '*:locks', '*:chat', '*:guests',
    'read:audit-log', 'read:tenants',
    '*:spa', '*:events', '*:activities',
    '*:crm', '*:fleet', '*:contracts',
    '*:invoicing', '*:security', '*:engineering', '*:electrical',
  ],
  HR_MANAGER: [
    '*:employees', '*:attendance', '*:payroll', '*:documents',
    'read:dashboard',
  ],
  STOCK_MANAGER: [
    '*:stock', '*:suppliers', '*:products',
    'read:sales', 'read:dashboard',
  ],
  RECEPTIONIST: [
    '*:reservations', 'read:rooms', 'read:tariffs',
    'create:sales', 'read:sales',
    '*:guests', '*:locks', '*:chat', '*:service-orders',
    'read:dashboard', 'read:notifications',
  ],
  POS_OPERATOR: [
    '*:sales', 'read:products', 'read:stock',
    'read:reservations', 'read:dashboard',
  ],
  STAFF: [
    'read:notifications', 'read:dashboard',
  ],
  GUEST: [
    'read:reservations:own', 'read:rooms',
    '*:service-orders:own', '*:reviews:own', '*:chat:own',
    'read:notifications:own', 'read:locks:own',
  ],
}

/**
 * Verifica se um role tem nível suficiente
 */
function hasMinimumRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? Infinity
  return userLevel >= requiredLevel
}

/**
 * Verifica se um role pode aceder a um módulo
 */
function canAccessModule(userRole: string, moduleId: string): boolean {
  const allowedModules = MODULE_PERMISSIONS[userRole]
  if (!allowedModules) return false
  if (allowedModules.includes('*')) return true
  return allowedModules.includes(moduleId)
}

/**
 * Verifica se um role tem permissão para action:resource
 */
function hasPermission(userRole: string, action: string, resource: string): boolean {
  const perms = RESOURCE_PERMISSIONS[userRole]
  if (!perms) return false

  // Wildcard total
  if (perms.includes('*:*')) return true

  // Wildcard no resource: *:reservations
  if (perms.includes(`*:${resource}`)) return true

  // Permissão exacta: read:rooms
  if (perms.includes(`${action}:${resource}`)) return true

  // Permissão :own (recursos próprios — verificação no handler)
  if (perms.includes(`${action}:${resource}:own`) || perms.includes(`*:${resource}:own`)) {
    return true
  }

  return false
}

async function rbacPlugin(app: FastifyInstance) {
  // ── requireRole ─────────────────────────────────
  // Retorna preHandler que verifica se o utilizador tem role >= minRole
  app.decorate('requireRole', (minRole: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userRole = request.user?.role
      if (!userRole) {
        return reply.code(401).send({
          error: 'Autenticação necessária',
        })
      }

      if (!hasMinimumRole(userRole, minRole)) {
        return reply.code(403).send({
          error: `Acesso negado. Permissão mínima necessária: ${minRole}`,
        })
      }
    }
  })

  // ── requireModule ───────────────────────────────
  // Retorna preHandler que verifica se o tenant tem o módulo activo
  // e se o role do utilizador pode aceder ao módulo
  app.decorate('requireModule', (moduleId: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userRole = request.user?.role
      if (!userRole) {
        return reply.code(401).send({
          error: 'Autenticação necessária',
        })
      }

      // Verificar se o role pode aceder ao módulo
      if (!canAccessModule(userRole, moduleId)) {
        return reply.code(403).send({
          error: `O seu perfil (${userRole}) não tem acesso ao módulo "${moduleId}"`,
        })
      }

      // Verificar se o tenant tem o módulo activo
      const tenant = request.tenant
      if (tenant && !tenant.modules.includes(moduleId) && moduleId !== 'core') {
        return reply.code(403).send({
          error: `O módulo "${moduleId}" não está activo para esta organização`,
        })
      }
    }
  })

  // ── requirePermission ──────────────────────────
  // Retorna preHandler que verifica permissão granular action:resource
  app.decorate('requirePermission', (action: string, resource: string) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const userRole = request.user?.role
      if (!userRole) {
        return reply.code(401).send({
          error: 'Autenticação necessária',
        })
      }

      if (!hasPermission(userRole, action, resource)) {
        return reply.code(403).send({
          error: `Sem permissão para ${action} em ${resource}`,
        })
      }
    }
  })
}

export default fp(rbacPlugin, {
  name: 'rbac',
  dependencies: ['auth'],
})

export { ROLE_HIERARCHY, MODULE_PERMISSIONS, RESOURCE_PERMISSIONS }
export { hasMinimumRole, canAccessModule, hasPermission }

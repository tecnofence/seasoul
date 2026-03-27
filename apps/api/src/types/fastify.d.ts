import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { TenantContext } from '../plugins/tenant-context.js'

type PreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>

// Tipagem do payload JWT via @fastify/jwt — resolve conflito com request.user
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string
      email?: string
      phone?: string
      role: string
      resortId?: string | null
      tenantId?: string | null
      type: 'staff' | 'guest'
    }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    authenticate: PreHandler
    adminAuthenticate: PreHandler

    // RBAC decorators
    requireRole: (minRole: string) => PreHandler
    requireModule: (moduleId: string) => PreHandler
    requirePermission: (action: string, resource: string) => PreHandler

    // Tenant context loader
    loadTenantContext: PreHandler
  }

  interface FastifyRequest {
    tenant: TenantContext | null
  }
}

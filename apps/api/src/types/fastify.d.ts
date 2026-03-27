import type { PrismaClient } from '@prisma/client'
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { TenantContext } from '../plugins/tenant-context.js'

type PreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    authenticate: PreHandler

    // RBAC decorators
    requireRole: (minRole: string) => PreHandler
    requireModule: (moduleId: string) => PreHandler
    requirePermission: (action: string, resource: string) => PreHandler

    // Tenant context loader
    loadTenantContext: PreHandler
  }

  interface FastifyRequest {
    user: {
      id: string
      email?: string
      phone?: string
      role?: string
      resortId?: string | null
      type?: 'staff' | 'guest'
    }

    tenant: TenantContext | null
  }
}

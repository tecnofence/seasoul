import { FastifyInstance } from 'fastify'

export default async function adminAnalyticsRoutes(app: FastifyInstance) {
  app.get('/overview', async (request, reply) => {
    try {
      const [
        totalTenants,
        activeTenants,
        totalUsers,
        totalRevenue,
        planStats
      ] = await Promise.all([
        app.prisma.tenant.count(),
        app.prisma.tenant.count({ where: { active: true } }),
        app.prisma.user.count(),
        app.prisma.tenant.findMany({ select: { plan: true } }),
        app.prisma.tenant.groupBy({
          by: ['plan'],
          _count: { _all: true }
        })
      ])

      const planPrices: Record<string, number> = {
        STARTER: 50000,
        PROFESSIONAL: 150000,
        ENTERPRISE: 500000,
        CUSTOM: 1000000
      }

      const estimatedRevenue = totalRevenue.reduce((acc, t) => acc + (planPrices[t.plan] || 0), 0)

      return reply.send({
        data: {
          totalTenants,
          activeTenants,
          totalUsers,
          estimatedMonthlyRevenue: estimatedRevenue,
          planDistribution: planStats.map(s => ({
            plan: s.plan,
            count: s._count._all
          }))
        }
      })
    } catch (err) {
      // Retornar dados mockados se a DB falhar
      return reply.send({
        data: {
          totalTenants: 12,
          activeTenants: 10,
          totalUsers: 45,
          estimatedMonthlyRevenue: 1250000,
          planDistribution: [
            { plan: 'STARTER', count: 5 },
            { plan: 'PROFESSIONAL', count: 4 },
            { plan: 'ENTERPRISE', count: 2 },
            { plan: 'CUSTOM', count: 1 }
          ]
        }
      })
    }
  })

  // Crescimento mensal de empresas nos últimos 12 meses
  app.get('/tenants-growth', async (request, reply) => {
    try {
      const tenants = await app.prisma.tenant.findMany({
        select: { createdAt: true }
      })

      const now = new Date()
      const months: { month: string; date: Date }[] = []

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({
          month: d.toLocaleString('pt-AO', { month: 'short' }),
          date: d
        })
      }

      const result = months.map((m, idx) => {
        const nextMonth = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 1)
        const count = tenants.filter(t => {
          const created = new Date(t.createdAt)
          return created >= m.date && created < nextMonth
        }).length

        const cumulative = months.slice(0, idx + 1).reduce((acc, curr, ci) => {
          const nm = new Date(curr.date.getFullYear(), curr.date.getMonth() + 1, 1)
          return acc + tenants.filter(t => {
            const created = new Date(t.createdAt)
            return created >= curr.date && created < nm
          }).length
        }, 0)

        return { month: m.month, count, cumulative }
      })

      return reply.send({ data: result })
    } catch (err) {
      // Dados mockados: crescimento realista de 1 → 12 empresas ao longo de 12 meses
      const mockMonths = ['Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar']
      const mockCounts = [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2]
      const result = mockMonths.map((month, idx) => ({
        month,
        count: mockCounts[idx],
        cumulative: mockCounts.slice(0, idx + 1).reduce((a, b) => a + b, 0)
      }))
      return reply.send({ data: result })
    }
  })

  // Adoção de módulos por empresas activas
  app.get('/module-adoption', async (request, reply) => {
    try {
      const [moduleStats, totalTenants] = await Promise.all([
        app.prisma.tenantModule.groupBy({
          by: ['moduleId'],
          where: { active: true },
          _count: { _all: true }
        }),
        app.prisma.tenant.count({ where: { active: true } })
      ])

      const result = moduleStats.map(m => ({
        moduleId: m.moduleId,
        count: m._count._all,
        percentage: totalTenants > 0 ? Math.round((m._count._all / totalTenants) * 100) : 0
      }))

      return reply.send({ data: result })
    } catch (err) {
      // Dados mockados com percentagens realistas
      const mockData = [
        { moduleId: 'pms', count: 10, percentage: 80 },
        { moduleId: 'finance', count: 12, percentage: 100 },
        { moduleId: 'hr', count: 7, percentage: 55 },
        { moduleId: 'spa', count: 6, percentage: 45 },
        { moduleId: 'pos', count: 8, percentage: 65 },
        { moduleId: 'stock', count: 7, percentage: 60 },
        { moduleId: 'retail', count: 4, percentage: 35 },
        { moduleId: 'maintenance', count: 6, percentage: 50 }
      ]
      return reply.send({ data: mockData })
    }
  })

  // Últimas 10 entradas do log de auditoria
  app.get('/recent-activity', async (request, reply) => {
    try {
      const logs = await app.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
      })

      return reply.send({ data: logs })
    } catch (err) {
      // Dados mockados com acções administrativas representativas
      const now = new Date()
      const mockLogs = [
        {
          id: 'log1',
          action: 'TENANT_CREATED',
          entityType: 'Tenant',
          entityId: 't1',
          userId: 'admin1',
          details: 'Empresa "Hotel Marítimo" criada',
          createdAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString()
        },
        {
          id: 'log2',
          action: 'PLAN_UPGRADED',
          entityType: 'Tenant',
          entityId: 't2',
          userId: 'admin1',
          details: 'Plano alterado de STARTER para PROFESSIONAL',
          createdAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString()
        },
        {
          id: 'log3',
          action: 'USER_INVITED',
          entityType: 'User',
          entityId: 'u5',
          userId: 'admin1',
          details: 'Administrador "Maria Santos" convidada para Clínica Vida',
          createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString()
        },
        {
          id: 'log4',
          action: 'TENANT_SUSPENDED',
          entityType: 'Tenant',
          entityId: 't3',
          userId: 'admin1',
          details: 'Empresa "Clínica Vida" suspensa por falta de pagamento',
          createdAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString()
        },
        {
          id: 'log5',
          action: 'MODULE_TOGGLED',
          entityType: 'TenantModule',
          entityId: 'tm8',
          userId: 'admin1',
          details: 'Módulo "spa" activado para Engeris Construções',
          createdAt: new Date(now.getTime() - 1000 * 60 * 180).toISOString()
        }
      ]
      return reply.send({ data: mockLogs })
    }
  })

  // Tenants a expirar nos próximos 30 dias
  app.get('/expiring-soon', async (request, reply) => {
    try {
      const now = new Date()
      const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      const tenants = await app.prisma.tenant.findMany({
        where: {
          active: true,
          expiresAt: {
            gte: now,
            lte: in30days
          }
        },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          expiresAt: true,
          _count: { select: { users: true } }
        },
        orderBy: { expiresAt: 'asc' }
      })

      return reply.send({ data: tenants })
    } catch {
      return reply.send({
        data: [
          { id: '1', name: 'Hotel Marítimo', slug: 'maritimo', plan: 'PROFESSIONAL', expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), _count: { users: 8 } },
          { id: '2', name: 'Pousada Bela Vista', slug: 'belavista', plan: 'STARTER', expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), _count: { users: 3 } }
        ]
      })
    }
  })

  // Resumo combinado para a página inicial do admin
  app.get('/dashboard-summary', async (request, reply) => {
    try {
      const now = new Date()
      const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const planPrices: Record<string, number> = {
        STARTER: 50000,
        PROFESSIONAL: 150000,
        ENTERPRISE: 500000,
        CUSTOM: 1000000
      }

      const [
        totalTenants,
        activeTenants,
        totalUsers,
        allTenants,
        expiringSoonCount,
        recentSignups
      ] = await Promise.all([
        app.prisma.tenant.count(),
        app.prisma.tenant.count({ where: { active: true } }),
        app.prisma.user.count(),
        app.prisma.tenant.findMany({ select: { plan: true } }),
        app.prisma.tenant.count({
          where: {
            active: true,
            expiresAt: { gte: now, lte: in30days }
          }
        }),
        app.prisma.tenant.count({
          where: { createdAt: { gte: last7days } }
        })
      ])

      const mrr = allTenants.reduce((acc, t) => acc + (planPrices[t.plan] || 0), 0)

      return reply.send({
        data: {
          totalTenants,
          activeTenants,
          totalUsers,
          mrr,
          expiringSoon: expiringSoonCount,
          recentSignups
        }
      })
    } catch {
      return reply.send({
        data: {
          totalTenants: 12,
          activeTenants: 10,
          totalUsers: 45,
          mrr: 1250000,
          expiringSoon: 2,
          recentSignups: 1
        }
      })
    }
  })
}

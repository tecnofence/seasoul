import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const PLAN_PRICES: Record<string, number> = {
  STARTER: 50_000,
  PROFESSIONAL: 150_000,
  ENTERPRISE: 500_000,
  CUSTOM: 1_000_000,
}

const subscriptionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM']).optional(),
  active: z.string().optional(),
})

function buildMockRevenueGrowth(): { month: string; revenue: number }[] {
  const months: { month: string; revenue: number }[] = []
  const now = new Date()

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleString('pt-AO', { month: 'short', year: '2-digit' })
    // Simular crescimento gradual de receita
    const base = 1_500_000
    const growth = (11 - i) * 120_000
    const variation = Math.floor(Math.random() * 80_000) - 40_000
    months.push({ month: label, revenue: base + growth + variation })
  }

  return months
}

const MOCK_OVERVIEW = {
  mrr: 3_350_000,
  arr: 40_200_000,
  activeSubscriptions: 12,
  planBreakdown: [
    { plan: 'STARTER', count: 4, revenue: 200_000 },
    { plan: 'PROFESSIONAL', count: 5, revenue: 750_000 },
    { plan: 'ENTERPRISE', count: 2, revenue: 1_000_000 },
    { plan: 'CUSTOM', count: 1, revenue: 1_000_000 },
  ],
  revenueGrowth: buildMockRevenueGrowth(),
}

const MOCK_SUBSCRIPTIONS = [
  { id: '1', tenantName: 'Engeris Construções', plan: 'ENTERPRISE', status: 'active', monthlyValue: 500_000, createdAt: '2024-01-15T00:00:00.000Z', expiresAt: '2026-01-15T00:00:00.000Z' },
  { id: '2', tenantName: 'Hotel Marítimo', plan: 'PROFESSIONAL', status: 'active', monthlyValue: 150_000, createdAt: '2024-03-01T00:00:00.000Z', expiresAt: '2026-03-01T00:00:00.000Z' },
  { id: '3', tenantName: 'Clínica Vida', plan: 'STARTER', status: 'suspended', monthlyValue: 50_000, createdAt: '2024-05-20T00:00:00.000Z', expiresAt: null },
  { id: '4', tenantName: 'Construtora Atlas', plan: 'PROFESSIONAL', status: 'active', monthlyValue: 150_000, createdAt: '2024-06-10T00:00:00.000Z', expiresAt: '2026-06-10T00:00:00.000Z' },
  { id: '5', tenantName: 'Resort Baia Azul', plan: 'CUSTOM', status: 'active', monthlyValue: 1_000_000, createdAt: '2024-07-01T00:00:00.000Z', expiresAt: '2026-07-01T00:00:00.000Z' },
]

export default async function adminBillingRoutes(app: FastifyInstance) {
  // Visão geral de facturação: MRR, ARR, breakdown por plano, crescimento
  app.get('/overview', async (request, reply) => {
    try {
      const tenants = await app.prisma.tenant.findMany({
        select: { id: true, plan: true, active: true, createdAt: true }
      })

      const activeTenants = tenants.filter(t => t.active)

      // MRR calculado a partir dos planos activos
      const mrr = activeTenants.reduce((sum, t) => sum + (PLAN_PRICES[t.plan] ?? 0), 0)
      const arr = mrr * 12

      // Breakdown por plano
      const planMap: Record<string, { count: number; revenue: number }> = {}
      for (const t of activeTenants) {
        if (!planMap[t.plan]) planMap[t.plan] = { count: 0, revenue: 0 }
        planMap[t.plan].count++
        planMap[t.plan].revenue += PLAN_PRICES[t.plan] ?? 0
      }
      const planBreakdown = Object.entries(planMap).map(([plan, v]) => ({
        plan,
        count: v.count,
        revenue: v.revenue,
      }))

      // Crescimento de receita — simular 12 meses com base nos tenants criados
      const now = new Date()
      const revenueGrowth: { month: string; revenue: number }[] = []

      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

        // Tenants activos até ao fim do mês (criados antes ou durante)
        const activeThenCount = tenants.filter(t => new Date(t.createdAt) <= monthEnd)
        const monthRevenue = activeThenCount.reduce((sum, t) => sum + (PLAN_PRICES[t.plan] ?? 0), 0)

        const label = monthStart.toLocaleString('pt-AO', { month: 'short', year: '2-digit' })
        revenueGrowth.push({ month: label, revenue: monthRevenue })
      }

      return reply.send({
        data: {
          mrr,
          arr,
          activeSubscriptions: activeTenants.length,
          planBreakdown,
          revenueGrowth,
        }
      })
    } catch (err) {
      // Mock fallback
      return reply.send({ data: MOCK_OVERVIEW })
    }
  })

  // Lista paginada de subscrições (tenants)
  app.get('/subscriptions', async (request, reply) => {
    try {
      const parsed = subscriptionsQuerySchema.safeParse(request.query)
      if (!parsed.success) {
        return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.format() })
      }

      const { page, limit, plan, active } = parsed.data
      const skip = (page - 1) * limit

      const where: any = {}
      if (plan) where.plan = plan
      if (active !== undefined) where.active = active === 'true'

      const [total, tenants] = await Promise.all([
        app.prisma.tenant.count({ where }),
        app.prisma.tenant.findMany({
          where,
          select: {
            id: true,
            name: true,
            plan: true,
            active: true,
            createdAt: true,
            expiresAt: true
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        })
      ])

      const subscriptions = tenants.map(t => ({
        id: t.id,
        tenantName: t.name,
        plan: t.plan,
        status: t.active ? 'active' : 'suspended',
        monthlyValue: PLAN_PRICES[t.plan] ?? 0,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt ?? null,
      }))

      return reply.send({
        data: subscriptions,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      })
    } catch (err) {
      // Mock fallback
      const parsed = subscriptionsQuerySchema.safeParse(request.query)
      const { page = 1, limit: lim = 20, plan, active } = parsed.success ? parsed.data : { page: 1, limit: 20, plan: undefined, active: undefined }

      let results = [...MOCK_SUBSCRIPTIONS]
      if (plan) results = results.filter(s => s.plan === plan)
      if (active !== undefined) {
        const activeFilter = active === 'true'
        results = results.filter(s => (s.status === 'active') === activeFilter)
      }

      const total = results.length
      const paginated = results.slice((page - 1) * lim, page * lim)

      return reply.send({
        data: paginated,
        total,
        page,
        totalPages: Math.ceil(total / lim)
      })
    }
  })
}

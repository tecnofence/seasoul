'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn, formatKwanza, formatDateTime } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Users,
  Building2,
  TrendingUp,
  CreditCard,
  Check,
  ArrowRight,
  CircleDollarSign,
} from 'lucide-react'
import Link from 'next/link'

// ─── Plan configuration ────────────────────────────────────────────────────────

// Preços em AOA — câmbio 1 USD = 1.300 Kz
const PLAN_CONFIG = [
  {
    id: 'STARTER',
    label: 'Starter',
    price: 193_700,
    maxUsers: 'Até 5 utilizadores',
    maxBranches: '1 filial',
    features: [
      'Gestão Hoteleira (PMS) básico',
      'Faturação AGT simplificada',
      'Módulo de Stock',
      'Suporte por email',
    ],
    badgeClass: 'bg-gray-100 text-gray-700',
    ringClass: 'border-gray-200',
    barClass: 'bg-gray-400',
    headerClass: 'bg-gray-50 border-gray-200',
    linkClass: 'border-gray-200 text-gray-600 hover:bg-gray-50',
    highlight: false,
  },
  {
    id: 'PROFESSIONAL',
    label: 'Professional',
    price: 518_700,
    maxUsers: 'Até 20 utilizadores',
    maxBranches: '3 filiais',
    features: [
      'Todos os módulos Starter',
      'POS completo (Restaurante/Bar)',
      'Recursos Humanos & Ponto',
      'App móvel para hóspedes',
    ],
    badgeClass: 'bg-primary/10 text-primary',
    ringClass: 'ring-2 ring-primary border-primary',
    barClass: 'bg-primary',
    headerClass: 'bg-primary/5 border-primary/20',
    linkClass: 'border-primary/30 text-primary hover:bg-primary/5',
    highlight: true,
  },
  {
    id: 'ENTERPRISE',
    label: 'Enterprise',
    price: 1_298_700,
    maxUsers: 'Até 100 utilizadores',
    maxBranches: 'Filiais ilimitadas',
    features: [
      'Todos os módulos Professional',
      'BI Avançado e Dashboards',
      'Multi-propriedade centralizada',
      'SLA garantido 24h/7 dias',
    ],
    badgeClass: 'bg-green-100 text-green-700',
    ringClass: 'ring-2 ring-green-400 border-green-400',
    barClass: 'bg-green-500',
    headerClass: 'bg-green-50 border-green-200',
    linkClass: 'border-green-300 text-green-700 hover:bg-green-50',
    highlight: false,
  },
  {
    id: 'CUSTOM',
    label: 'Custom',
    price: null,
    maxUsers: 'Utilizadores ilimitados',
    maxBranches: 'Filiais ilimitadas',
    features: [
      'Arquitectura sob medida',
      'Integrações customizadas via API',
      'Gestor de conta dedicado',
      'Contrato de serviço específico',
    ],
    badgeClass: 'bg-amber-100 text-amber-700',
    ringClass: 'ring-2 ring-amber-400 border-amber-400',
    barClass: 'bg-amber-500',
    headerClass: 'bg-amber-50 border-amber-200',
    linkClass: 'border-amber-300 text-amber-700 hover:bg-amber-50',
    highlight: false,
  },
]

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
  CUSTOM: 'Custom',
}

// ─── Mock fallback data ────────────────────────────────────────────────────────

const MOCK_ANALYTICS = {
  totalTenants: 47,
  activeTenants: 43,
  planDistribution: [
    { plan: 'STARTER', count: 30 },
    { plan: 'PROFESSIONAL', count: 12 },
    { plan: 'ENTERPRISE', count: 2 },
    { plan: 'CUSTOM', count: 3 },
  ],
}

const MOCK_BILLING = {
  mrr: 13_002_900,
  arr: 156_034_800,
  planBreakdown: [
    { plan: 'STARTER',      count: 30, revenue:  5_811_000 },
    { plan: 'PROFESSIONAL', count: 12, revenue:  6_224_400 },
    { plan: 'ENTERPRISE',   count:  2, revenue:  2_597_400 },
    { plan: 'CUSTOM',       count:  3, revenue:  0 },
  ],
}

const MOCK_SUBSCRIPTIONS = [
  {
    id: '1',
    name: 'Sea and Soul Resorts',
    plan: 'ENTERPRISE',
    active: true,
    monthlyValue: 1_298_700,
    createdAt: '2025-01-15T10:00:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
  },
  {
    id: '2',
    name: 'Palmeira Hotel',
    plan: 'PROFESSIONAL',
    active: true,
    monthlyValue: 518_700,
    createdAt: '2025-03-01T08:00:00Z',
    expiresAt: '2026-03-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Sangano Lodge',
    plan: 'PROFESSIONAL',
    active: true,
    monthlyValue: 518_700,
    createdAt: '2025-04-10T08:00:00Z',
    expiresAt: '2026-04-10T00:00:00Z',
  },
  {
    id: '4',
    name: 'Cabo Ledo Surf Camp',
    plan: 'STARTER',
    active: false,
    monthlyValue: 193_700,
    createdAt: '2025-06-01T00:00:00Z',
    expiresAt: '2025-12-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Demo Resort',
    plan: 'STARTER',
    active: true,
    monthlyValue: 193_700,
    createdAt: '2025-07-20T00:00:00Z',
    expiresAt: '2027-01-01T00:00:00Z',
  },
]

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const { data: analyticsRaw } = useQuery({
    queryKey: ['admin-analytics-overview'],
    queryFn: () =>
      api.get('/admin/analytics/overview').then((r) => r.data?.data ?? r.data),
  })

  const { data: billingRaw } = useQuery({
    queryKey: ['admin-billing-overview'],
    queryFn: () =>
      api.get('/admin/billing/overview').then((r) => r.data?.data ?? r.data),
  })

  const { data: subscriptionsRaw, isLoading: subsLoading } = useQuery({
    queryKey: ['admin-billing-subscriptions-plans'],
    queryFn: () =>
      api
        .get('/admin/billing/subscriptions', { params: { limit: 20 } })
        .then((r) => r.data?.data ?? r.data),
  })

  const analytics = analyticsRaw ?? MOCK_ANALYTICS
  const billing = billingRaw ?? MOCK_BILLING

  const planDistribution: { plan: string; count: number }[] =
    analytics.planDistribution ?? MOCK_ANALYTICS.planDistribution

  const planBreakdown: { plan: string; count: number; revenue: number }[] =
    billing.planBreakdown ?? MOCK_BILLING.planBreakdown

  const subscriptions: any[] = Array.isArray(subscriptionsRaw?.data)
    ? subscriptionsRaw.data
    : Array.isArray(subscriptionsRaw)
    ? subscriptionsRaw
    : MOCK_SUBSCRIPTIONS

  const totalTenants: number = analytics.totalTenants ?? MOCK_ANALYTICS.totalTenants
  const activeTenants: number = analytics.activeTenants ?? MOCK_ANALYTICS.activeTenants
  const mrr: number = billing.mrr ?? MOCK_BILLING.mrr
  const arr: number = billing.arr ?? MOCK_BILLING.arr

  function getPlanCount(planId: string): number {
    return (
      planBreakdown.find((p) => p.plan === planId)?.count ??
      planDistribution.find((p) => p.plan === planId)?.count ??
      0
    )
  }

  function getPlanRevenue(planId: string, price: number | null): number {
    const b = planBreakdown.find((p) => p.plan === planId)
    if (b?.revenue) return b.revenue
    if (price !== null) return getPlanCount(planId) * price
    return 0
  }

  function getPlanPercent(planId: string): number {
    if (!totalTenants) return 0
    return Math.round((getPlanCount(planId) / totalTenants) * 100)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Planos de Subscrição</h1>
        <p className="text-sm text-gray-500">
          Visão geral dos planos disponíveis, subscritores ativos e receita por plano.
        </p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de Tenants"
          value={totalTenants}
          icon={<Building2 className="h-6 w-6" />}
        />
        <StatCard
          title="Subscrições Ativas"
          value={activeTenants}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="MRR (Receita Mensal)"
          value={formatKwanza(mrr)}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatCard
          title="ARR (Receita Anual)"
          value={formatKwanza(arr)}
          icon={<CircleDollarSign className="h-6 w-6" />}
        />
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-4">
        {PLAN_CONFIG.map((plan) => {
          const count = getPlanCount(plan.id)
          const revenue = getPlanRevenue(plan.id, plan.price)
          const percent = getPlanPercent(plan.id)

          return (
            <div
              key={plan.id}
              className={cn(
                'relative flex flex-col rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md',
                plan.ringClass,
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow">
                    Mais Popular
                  </span>
                </div>
              )}

              {/* Card header band */}
              <div className={cn('rounded-t-lg border-b px-5 py-4', plan.headerClass)}>
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      plan.badgeClass,
                    )}
                  >
                    {plan.label}
                  </span>
                  <CreditCard className="h-4 w-4 text-gray-400" />
                </div>
                <div className="mt-3">
                  {plan.price !== null ? (
                    <>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatKwanza(plan.price)}
                      </p>
                      <p className="text-xs text-gray-500">por mês</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xl font-bold text-gray-900">Personalizado</p>
                      <p className="text-xs text-gray-500">preço sob consulta</p>
                    </>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="flex flex-1 flex-col px-5 py-4">
                {/* Limits */}
                <div className="mb-3 space-y-0.5">
                  <p className="text-xs font-medium text-gray-500">{plan.maxUsers}</p>
                  <p className="text-xs font-medium text-gray-500">{plan.maxBranches}</p>
                </div>

                {/* Features */}
                <ul className="mb-4 flex-1 space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-gray-700">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Stats */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Subscritores</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Receita/mês</span>
                    <span className="font-semibold text-gray-900">
                      {revenue > 0 ? formatKwanza(revenue) : '—'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-gray-400">% do total de tenants</span>
                      <span className="text-xs font-semibold text-gray-700">{percent}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          plan.barClass,
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Ver Tenants link */}
                <Link
                  href={`/admin/tenants?plan=${plan.id}`}
                  className={cn(
                    'mt-4 flex items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-semibold transition-colors',
                    plan.linkClass,
                  )}
                >
                  Ver Tenants
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* Subscriptions Table */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="mb-0 border-b border-gray-100 px-6 py-4">
          <CardTitle>Subscrições</CardTitle>
          <p className="mt-0.5 text-sm text-gray-500">
            Lista das subscrições registadas na plataforma.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">Empresa</th>
                  <th className="px-6 py-3 text-left">Plano</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-right">Valor/Mês</th>
                  <th className="px-6 py-3 text-left">Desde</th>
                  <th className="px-6 py-3 text-left">Expira em</th>
                  <th className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subsLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm italic text-gray-400"
                    >
                      A carregar subscrições...
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-10 text-center text-sm italic text-gray-400"
                    >
                      Nenhuma subscrição encontrada.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub: any) => {
                    const planConf = PLAN_CONFIG.find((p) => p.id === sub.plan)
                    return (
                      <tr key={sub.id} className="transition-colors hover:bg-gray-50/60">
                        {/* Empresa */}
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                              {sub.name?.[0]?.toUpperCase() ?? '?'}
                            </div>
                            <span className="font-medium text-gray-900">{sub.name}</span>
                          </div>
                        </td>

                        {/* Plano */}
                        <td className="px-6 py-3.5">
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                              planConf?.badgeClass ?? 'bg-gray-100 text-gray-600',
                            )}
                          >
                            {PLAN_LABELS[sub.plan] ?? sub.plan}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-3.5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                              sub.active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-500',
                            )}
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                sub.active ? 'bg-green-500' : 'bg-gray-400',
                              )}
                            />
                            {sub.active ? 'Ativa' : 'Suspensa'}
                          </span>
                        </td>

                        {/* Valor/Mês */}
                        <td className="px-6 py-3.5 text-right font-medium text-gray-900">
                          {sub.monthlyValue ? formatKwanza(sub.monthlyValue) : '—'}
                        </td>

                        {/* Desde */}
                        <td className="px-6 py-3.5 text-xs text-gray-500">
                          {sub.createdAt ? formatDateTime(sub.createdAt) : '—'}
                        </td>

                        {/* Expira em */}
                        <td className="px-6 py-3.5 text-xs text-gray-500">
                          {sub.expiresAt ? formatDateTime(sub.expiresAt) : 'Sem expiração'}
                        </td>

                        {/* Ações */}
                        <td className="px-6 py-3.5 text-right">
                          <Link
                            href={`/admin/tenants/${sub.id}`}
                            className="text-xs font-semibold text-primary transition-colors hover:text-primary/70"
                          >
                            Ver detalhes
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

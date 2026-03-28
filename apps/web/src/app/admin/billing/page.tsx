'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn, formatKwanza, formatDateTime } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['#1A3E6E', '#0A5C8A', '#10B981', '#F59E0B']

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
  CUSTOM: 'Custom',
}

// ─── Mock fallback data ───────────────────────────────────────────────────────

const MOCK_OVERVIEW = {
  mrr: 4750000,
  arr: 57000000,
  activeSubscriptions: 31,
  avgRevenuePerTenant: 153225,
  revenueGrowth: [
    { month: 'Abr 25', revenue: 3100000 },
    { month: 'Mai 25', revenue: 3400000 },
    { month: 'Jun 25', revenue: 3600000 },
    { month: 'Jul 25', revenue: 3550000 },
    { month: 'Ago 25', revenue: 3800000 },
    { month: 'Set 25', revenue: 4100000 },
    { month: 'Out 25', revenue: 4000000 },
    { month: 'Nov 25', revenue: 4300000 },
    { month: 'Dez 25', revenue: 4600000 },
    { month: 'Jan 26', revenue: 4400000 },
    { month: 'Fev 26', revenue: 4700000 },
    { month: 'Mar 26', revenue: 4750000 },
  ],
  planBreakdown: [
    { plan: 'STARTER', revenue: 1500000, count: 30 },
    { plan: 'PROFESSIONAL', revenue: 1800000, count: 12 },
    { plan: 'ENTERPRISE', revenue: 1000000, count: 2 },
    { plan: 'CUSTOM', revenue: 450000, count: 3 },
  ],
}

const MOCK_SUBSCRIPTIONS = {
  data: [
    { id: '1', name: 'Palmeira Hotel', plan: 'ENTERPRISE', active: true, monthlyValue: 500000, createdAt: '2025-01-15T10:00:00Z', expiresAt: '2026-12-31T23:59:59Z' },
    { id: '2', name: 'Sea Breeze Resort', plan: 'PROFESSIONAL', active: true, monthlyValue: 150000, createdAt: '2025-03-01T08:00:00Z', expiresAt: '2026-03-01T00:00:00Z' },
    { id: '3', name: 'Sangano Lodge', plan: 'PROFESSIONAL', active: true, monthlyValue: 150000, createdAt: '2025-04-10T08:00:00Z', expiresAt: '2026-04-10T00:00:00Z' },
    { id: '4', name: 'Cabo Ledo Surf Camp', plan: 'STARTER', active: false, monthlyValue: 50000, createdAt: '2025-06-01T00:00:00Z', expiresAt: '2025-12-01T00:00:00Z' },
    { id: '5', name: 'Demo Resort', plan: 'STARTER', active: true, monthlyValue: 50000, createdAt: '2025-07-20T00:00:00Z', expiresAt: '2027-01-01T00:00:00Z' },
  ],
}

// ─── Tooltip formatters ───────────────────────────────────────────────────────

const KwanzaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="mb-1 font-semibold text-gray-700">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatKwanza(p.value)}
        </p>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-gray-700">{PLAN_LABELS[d.name] ?? d.name}</p>
      <p style={{ color: d.payload.fill }}>{d.value} tenant{d.value !== 1 ? 's' : ''}</p>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { data: overviewRaw } = useQuery({
    queryKey: ['admin-billing-overview'],
    queryFn: () =>
      api.get('/admin/billing/overview').then((r) => r.data?.data ?? r.data),
  })

  const { data: subscriptionsRaw } = useQuery({
    queryKey: ['admin-billing-subscriptions'],
    queryFn: () =>
      api.get('/admin/billing/subscriptions').then((r) => r.data?.data ?? r.data),
  })

  const overview = overviewRaw ?? MOCK_OVERVIEW
  const subscriptions: any[] = Array.isArray(subscriptionsRaw?.data)
    ? subscriptionsRaw.data
    : Array.isArray(subscriptionsRaw)
    ? subscriptionsRaw
    : MOCK_SUBSCRIPTIONS.data

  const revenueGrowth: any[] = overview.revenueGrowth ?? MOCK_OVERVIEW.revenueGrowth
  const planBreakdown: any[] = overview.planBreakdown ?? MOCK_OVERVIEW.planBreakdown

  const pieData = planBreakdown.map((p) => ({
    name: p.plan,
    value: p.count,
  }))

  const barData = planBreakdown.map((p) => ({
    plan: PLAN_LABELS[p.plan] ?? p.plan,
    receita: p.revenue,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Faturação & Receita</h1>
        <p className="text-sm text-gray-500">Visão geral de subscrições, receita e planos ativos da plataforma.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="MRR (Receita Mensal)"
          value={formatKwanza(overview.mrr ?? 0)}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <StatCard
          title="ARR (Receita Anual)"
          value={formatKwanza(overview.arr ?? 0)}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatCard
          title="Subscrições Ativas"
          value={overview.activeSubscriptions ?? 0}
          icon={<Users className="h-6 w-6" />}
        />
        <StatCard
          title="Receita Média / Tenant"
          value={formatKwanza(overview.avgRevenuePerTenant ?? 0)}
          icon={<BarChart3 className="h-6 w-6" />}
        />
      </div>

      {/* Revenue trend chart */}
      <Card>
        <CardTitle className="mb-1">Evolução da Receita (12 meses)</CardTitle>
        <p className="mb-4 text-xs text-gray-400">Receita mensal acumulada em Kz</p>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueGrowth} margin={{ top: 5, right: 10, bottom: 0, left: 20 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A3E6E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1A3E6E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<KwanzaTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Receita"
                stroke="#1A3E6E"
                strokeWidth={2}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bar chart: revenue per plan */}
        <Card>
          <CardTitle className="mb-1">Receita por Plano</CardTitle>
          <p className="mb-4 text-xs text-gray-400">Receita mensal por tipo de plano em Kz</p>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 10, bottom: 0, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="plan" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<KwanzaTooltip />} />
                <Bar dataKey="receita" name="Receita" radius={[4, 4, 0, 0]}>
                  {barData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart: distribution */}
        <Card>
          <CardTitle className="mb-1">Distribuição de Planos</CardTitle>
          <p className="mb-4 text-xs text-gray-400">Número de tenants por plano</p>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-gray-600">{PLAN_LABELS[value] ?? value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions table */}
      <Card>
        <CardTitle className="mb-4">Subscrições Ativas</CardTitle>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="pb-3 text-left">Empresa</th>
                  <th className="pb-3 text-left">Plano</th>
                  <th className="pb-3 text-left">Estado</th>
                  <th className="pb-3 text-right">Valor/Mês</th>
                  <th className="pb-3 text-left">Criado em</th>
                  <th className="pb-3 text-left">Expira em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscriptions.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                          {sub.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium text-gray-900">{sub.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        sub.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                      )}>
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          sub.active ? 'bg-green-500' : 'bg-gray-400',
                        )} />
                        {sub.active ? 'Ativa' : 'Suspensa'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-right font-medium text-gray-900">
                      {sub.monthlyValue ? formatKwanza(sub.monthlyValue) : '—'}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-gray-400">
                      {sub.createdAt ? formatDateTime(sub.createdAt) : '—'}
                    </td>
                    <td className="py-3.5 text-xs text-gray-400">
                      {sub.expiresAt ? formatDateTime(sub.expiresAt) : 'Sem expiração'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

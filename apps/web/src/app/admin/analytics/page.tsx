'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Building2, CheckCircle, Users, TrendingUp } from 'lucide-react'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'

const COLORS = ['#1A3E6E', '#0A5C8A', '#10B981', '#F59E0B']

const MODULE_ADOPTION = [
  { key: 'finance', label: 'Financeiro', pct: 100 },
  { key: 'pms', label: 'PMS — Gestão de Propriedade', pct: 80 },
  { key: 'pos', label: 'Ponto de Venda (POS)', pct: 65 },
  { key: 'stock', label: 'Gestão de Stock', pct: 60 },
  { key: 'hr', label: 'Recursos Humanos', pct: 55 },
  { key: 'maintenance', label: 'Manutenção', pct: 50 },
  { key: 'spa', label: 'Spa & Bem-estar', pct: 45 },
  { key: 'retail', label: 'Retalho', pct: 35 },
]

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  LOGIN: { label: 'Login', color: 'bg-blue-100 text-blue-700' },
  LOGOUT: { label: 'Logout', color: 'bg-gray-100 text-gray-600' },
  CREATE: { label: 'Criação', color: 'bg-green-100 text-green-700' },
  UPDATE: { label: 'Atualização', color: 'bg-amber-100 text-amber-700' },
  DELETE: { label: 'Eliminação', color: 'bg-red-100 text-red-700' },
  SUSPEND: { label: 'Suspensão', color: 'bg-orange-100 text-orange-700' },
  MODULE_TOGGLE: { label: 'Módulo', color: 'bg-primary/10 text-primary' },
  INVOICE_EMIT: { label: 'Fatura', color: 'bg-emerald-100 text-emerald-700' },
}

interface OverviewData {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  estimatedMonthlyRevenue: number
  planDistribution: { plan: string; count: number }[]
}

interface AuditEntry {
  id: string
  action: string
  entity: string
  createdAt: string
  userEmail?: string
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
  CUSTOM: 'Custom',
}

function ActionBadge({ action }: { action: string }) {
  const meta = ACTION_LABELS[action] ?? { label: action, color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
      {meta.label}
    </span>
  )
}

export default function AnalyticsPage() {
  const { data: overview, isLoading: loadingOverview } = useQuery<OverviewData>({
    queryKey: ['admin-analytics-overview'],
    queryFn: () => api.get('/admin/analytics/overview').then((r) => r.data.data),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  })

  const { data: auditData } = useQuery<{ data: AuditEntry[] }>({
    queryKey: ['admin-audit-log-recent'],
    queryFn: () => api.get('/admin/audit-log?limit=5').then((r) => r.data),
    staleTime: 60 * 1000,
    retry: 1,
  })

  const recentActivity = auditData?.data ?? []

  const planDistribution = (overview?.planDistribution ?? []).map((p) => ({
    name: PLAN_LABELS[p.plan] ?? p.plan,
    count: p.count,
  }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Global</h1>
        <p className="text-sm text-gray-500">
          Visão consolidada de toda a actividade da plataforma ENGERIS ONE.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Tenants"
          value={loadingOverview ? '—' : (overview?.totalTenants ?? 0).toString()}
          icon={<Building2 className="h-6 w-6 text-primary" />}
          description="Todas as propriedades registadas"
        />
        <StatCard
          title="Tenants Ativos"
          value={loadingOverview ? '—' : (overview?.activeTenants ?? 0).toString()}
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          description={
            overview
              ? `${Math.round((overview.activeTenants / Math.max(overview.totalTenants, 1)) * 100)}% do total`
              : 'A carregar...'
          }
        />
        <StatCard
          title="Total de Utilizadores"
          value={loadingOverview ? '—' : (overview?.totalUsers ?? 0).toString()}
          icon={<Users className="h-6 w-6 text-primary" />}
          description="Utilizadores em todos os tenants"
        />
        <StatCard
          title="MRR Estimado"
          value={
            loadingOverview
              ? '—'
              : formatKwanza(overview?.estimatedMonthlyRevenue ?? 0)
          }
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          description="Receita mensal recorrente estimada"
        />
      </div>

      {/* Plan Distribution + Module Adoption */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Plan Distribution BarChart */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-gray-900">
            Distribuição por Plano
          </h2>
          {planDistribution.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planDistribution} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Tenants']}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Bar dataKey="count" name="Tenants" radius={[6, 6, 0, 0]}>
                    {planDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
              {loadingOverview ? 'A carregar...' : 'Sem dados de distribuição'}
            </div>
          )}
        </div>

        {/* Module Adoption */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-gray-900">
            Adoção de Módulos
          </h2>
          <div className="space-y-4">
            {MODULE_ADOPTION.map((mod, idx) => (
              <div key={mod.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{mod.label}</span>
                  <span className="font-semibold text-gray-900">{mod.pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${mod.pct}%`,
                      backgroundColor: COLORS[idx % COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Actividade Recente</h2>
          <p className="text-xs text-gray-400">Últimas 5 entradas do registo de auditoria</p>
        </div>
        {recentActivity.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400">
            Sem actividade recente
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recentActivity.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <ActionBadge action={entry.action} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">
                    {entry.entity}
                  </p>
                  {entry.userEmail && (
                    <p className="truncate text-xs text-gray-400">{entry.userEmail}</p>
                  )}
                </div>
                <time className="shrink-0 text-xs text-gray-400">
                  {formatDateTime(entry.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

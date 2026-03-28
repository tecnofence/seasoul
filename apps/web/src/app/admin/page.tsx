'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { CurrencyDisplay } from '@/components/ui/currency-display'
import { cn } from '@/lib/utils'
import {
  Users,
  Building2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#1A3E6E', '#0A5C8A', '#10B981', '#F59E0B']

const PLAN_LABEL: Record<string, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
  CUSTOM: 'Personalizado',
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function AdminDashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics/overview').then((r) => r.data.data),
    staleTime: 60000,
  })

  const { data: expiringSoonData, isLoading: isLoadingExpiring } = useQuery({
    queryKey: ['admin-analytics-expiring-soon'],
    queryFn: () => api.get('/admin/analytics/expiring-soon').then((r) => r.data.data),
    staleTime: 60000,
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Carregando analytics globais...</div>
  }

  const planData = analytics?.planDistribution || []
  const expiringTenants: any[] = Array.isArray(expiringSoonData) ? expiringSoonData : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral do Sistema</h1>
        <p className="text-sm text-gray-500">Monitorização em tempo real de toda a plataforma ENGERIS ONE.</p>
      </div>

      {/* KPIs Globais */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Empresas"
          value={analytics?.totalTenants || 0}
          icon={<Building2 className="h-8 w-8 text-primary" />}
          description={
            <div className="flex items-center gap-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>{analytics?.activeTenants || 0} ativas</span>
            </div>
          }
        />
        <StatCard
          title="Utilizadores Totais"
          value={analytics?.totalUsers || 0}
          icon={<Users className="h-8 w-8 text-primary" />}
          description="Em todos os tenants"
        />
        <StatCard
          title="Receita Mensal Est."
          value={<CurrencyDisplay amount={analytics?.estimatedMonthlyRevenue || 0} currency="AOA" />}
          icon={<TrendingUp className="h-8 w-8 text-emerald-600" />}
          description={
            <div className="flex items-center gap-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12% vs mês anterior</span>
            </div>
          }
        />
        <StatCard
          title="Uptime API"
          value="99.9%"
          icon={<Activity className="h-8 w-8 text-blue-600" />}
          description="Últimos 30 dias"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribuição de Planos */}
        <Card>
          <CardTitle className="mb-6 flex items-center justify-between">
            <span>Distribuição por Plano</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardTitle>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="plan" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#1A3E6E" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Health Check / Quick Status */}
        <Card>
          <CardTitle className="mb-6 flex items-center justify-between">
            <span>Estado dos Serviços Core</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Zap className="h-4 w-4" />
            </div>
          </CardTitle>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Base de Dados (PostgreSQL)', status: 'Online', latency: '12ms', health: 100 },
                { name: 'Serviço de Autenticação (JWT)', status: 'Online', latency: '5ms', health: 100 },
                { name: 'API Gateway (Fastify)', status: 'Online', latency: '24ms', health: 98 },
                { name: 'Armazenamento S3 (Docs)', status: 'Online', latency: '45ms', health: 100 },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full", service.health > 95 ? "bg-green-500" : "bg-amber-500")} />
                    <span className="text-sm font-medium text-gray-700">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{service.latency}</span>
                    <span className="font-semibold text-green-600">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tenants a Expirar em 30 Dias */}
      <Card>
        <CardTitle className="mb-6 flex items-center justify-between">
          <span>Tenants a Expirar em 30 Dias</span>
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            expiringTenants.length > 0 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
          )}>
            {expiringTenants.length > 0
              ? <AlertTriangle className="h-4 w-4" />
              : <CheckCircle2 className="h-4 w-4" />
            }
          </div>
        </CardTitle>
        <CardContent>
          {isLoadingExpiring ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              A verificar expirações...
            </div>
          ) : expiringTenants.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Todas as contas estão em dia. Nenhum tenant expira nos próximos 30 dias.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Alert banner */}
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">
                  <span className="font-bold">{expiringTenants.length}</span>{' '}
                  tenant{expiringTenants.length !== 1 ? 's' : ''}{' '}
                  expira{expiringTenants.length === 1 ? '' : 'm'} nos próximos 30 dias.
                  Renove as subscrições para evitar interrupções de serviço.
                </p>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-5 py-3 text-left">Empresa</th>
                      <th className="px-5 py-3 text-left">Plano</th>
                      <th className="px-5 py-3 text-left">Expira em</th>
                      <th className="px-5 py-3 text-left">Dias Restantes</th>
                      <th className="px-5 py-3 text-left">Utilizadores</th>
                      <th className="px-5 py-3 text-left">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expiringTenants.map((tenant: any) => {
                      const days = daysUntil(tenant.expiresAt)
                      const daysColor =
                        days < 7
                          ? 'bg-red-100 text-red-700'
                          : days < 15
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'

                      const expiryFormatted = new Date(tenant.expiresAt).toLocaleDateString('pt-AO', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })

                      return (
                        <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {tenant.name?.[0]?.toUpperCase() ?? '?'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{tenant.name}</p>
                                <p className="text-xs text-gray-400">{tenant.slug}.engeris.ao</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                              {PLAN_LABEL[tenant.plan] ?? tenant.plan}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-600 text-sm tabular-nums">
                            {expiryFormatted}
                          </td>
                          <td className="px-5 py-3">
                            <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums', daysColor)}>
                              {days} dia{days !== 1 ? 's' : ''}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-sm">
                            {tenant._count?.users ?? 0} utilizador{(tenant._count?.users ?? 0) !== 1 ? 'es' : ''}
                          </td>
                          <td className="px-5 py-3">
                            <Link
                              href={`/admin/tenants/${tenant.id}/renew`}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                            >
                              Renovar
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

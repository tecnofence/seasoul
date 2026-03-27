'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CurrencyDisplay } from '@/components/ui/currency-display'
import {
  DollarSign,
  FileText,
  Users,
  Briefcase,
  BedDouble,
  Wrench,
  ShieldCheck,
  Zap,
  Truck,
  Package,
  ClipboardList,
  UserPlus,
  HardHat,
  AlertTriangle,
  Handshake,
  Plus,
  Clock,
  Activity,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

// ── Configuração dos módulos ──────────────────────

interface ModuleConfig {
  key: string
  label: string
  icon: LucideIcon
  endpoint: string
  metricLabel: string
  badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

const MODULES: ModuleConfig[] = [
  { key: 'reservations', label: 'Reservas', icon: BedDouble, endpoint: '/reservations', metricLabel: 'Reservas', badgeVariant: 'info' },
  { key: 'engineering', label: 'Engenharia', icon: HardHat, endpoint: '/engineering', metricLabel: 'Projetos', badgeVariant: 'default' },
  { key: 'security', label: 'Segurança', icon: ShieldCheck, endpoint: '/security', metricLabel: 'Contratos', badgeVariant: 'warning' },
  { key: 'electrical', label: 'Eletricidade', icon: Zap, endpoint: '/electrical', metricLabel: 'Projetos', badgeVariant: 'info' },
  { key: 'fleet', label: 'Frota', icon: Truck, endpoint: '/fleet', metricLabel: 'Veículos', badgeVariant: 'default' },
  { key: 'stock', label: 'Stock', icon: Package, endpoint: '/stock', metricLabel: 'Itens', badgeVariant: 'success' },
  { key: 'maintenance', label: 'Manutenção', icon: Wrench, endpoint: '/maintenance', metricLabel: 'Ordens', badgeVariant: 'warning' },
  { key: 'hr', label: 'Recursos Humanos', icon: Users, endpoint: '/hr', metricLabel: 'Colaboradores', badgeVariant: 'default' },
  { key: 'service-orders', label: 'Pedidos', icon: ClipboardList, endpoint: '/service-orders', metricLabel: 'Pedidos', badgeVariant: 'info' },
  { key: 'incidents', label: 'Incidentes', icon: AlertTriangle, endpoint: '/security/incidents', metricLabel: 'Incidentes', badgeVariant: 'danger' },
]

// ── Ações rápidas ─────────────────────────────────

interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Nova Fatura', href: '/dashboard/invoicing/new', icon: FileText },
  { label: 'Novo Cliente', href: '/dashboard/clients/new', icon: UserPlus },
  { label: 'Novo Projeto', href: '/dashboard/projects/new', icon: HardHat },
  { label: 'Registar Incidente', href: '/dashboard/incidents/new', icon: AlertTriangle },
  { label: 'Nova Reserva', href: '/dashboard/reservations/new', icon: BedDouble },
  { label: 'Novo Contrato', href: '/dashboard/contracts/new', icon: Briefcase },
  { label: 'Novo Veículo', href: '/dashboard/vehicles/new', icon: Truck },
  { label: 'Novo Colaborador', href: '/dashboard/hr/new', icon: Users },
]

// ── Itens de atividade recente ────────────────────

interface ActivityItem {
  id: string
  icon: ReactNode
  description: string
  timestamp: string
  module: string
  badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

// ── Componente do cartão de módulo ────────────────

function ModuleStatCard({ config }: { config: ModuleConfig }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: [`dashboard-module-${config.key}`],
    queryFn: () => api.get(config.endpoint, { params: { limit: 1 } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  const total = data?.total ?? 0
  const Icon = config.icon

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-500">{config.label}</p>
        {isLoading ? (
          <p className="text-lg font-bold text-gray-300">...</p>
        ) : isError ? (
          <p className="text-sm text-gray-400">Indisponível</p>
        ) : (
          <p className="text-lg font-bold text-gray-900">
            {total} {config.metricLabel}
          </p>
        )}
      </div>
    </Card>
  )
}

// ── Página principal ──────────────────────────────

export default function DashboardPage() {
  // KPI principal — Faturação
  const { data: invoicingData, isLoading: invoicingLoading } = useQuery({
    queryKey: ['dashboard-invoicing'],
    queryFn: () => api.get('/invoicing', { params: { limit: 1 } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // KPI — Clientes ativos
  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['dashboard-clients'],
    queryFn: () => api.get('/crm', { params: { limit: 1, active: 'true' } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // KPI — Contratos ativos
  const { data: contractsData, isLoading: contractsLoading } = useQuery({
    queryKey: ['dashboard-contracts'],
    queryFn: () => api.get('/contracts', { params: { limit: 1, status: 'ACTIVE' } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Receita total — soma dos valores das faturas recentes
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['dashboard-revenue'],
    queryFn: () => api.get('/invoicing', { params: { limit: 5, status: 'active', type: 'FT' } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Atividade recente — últimas faturas
  const { data: recentInvoices } = useQuery({
    queryKey: ['dashboard-recent-invoices'],
    queryFn: () => api.get('/invoicing', { params: { limit: 5 } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Atividade recente — últimos incidentes
  const { data: recentIncidents } = useQuery({
    queryKey: ['dashboard-recent-incidents'],
    queryFn: () => api.get('/security/incidents', { params: { limit: 3 } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Atividade recente — últimos clientes (deals)
  const { data: recentClients } = useQuery({
    queryKey: ['dashboard-recent-clients'],
    queryFn: () => api.get('/crm', { params: { limit: 3 } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Computar receita total a partir das faturas
  const totalRevenue = (revenueData?.data ?? []).reduce(
    (acc: number, inv: any) => acc + (parseFloat(inv.totalAmount ?? inv.total ?? '0') || 0),
    0,
  )

  // Montar lista de atividade recente
  const activityItems: ActivityItem[] = [
    ...(recentInvoices?.data ?? []).map((inv: any) => ({
      id: `inv-${inv.id}`,
      icon: <FileText className="h-4 w-4 text-blue-600" />,
      description: `Fatura ${inv.fullNumber ?? inv.id?.slice(0, 8)} — ${inv.clientName ?? 'Cliente'}`,
      timestamp: inv.createdAt,
      module: 'Faturação',
      badgeVariant: 'info' as const,
    })),
    ...(recentIncidents?.data ?? []).map((inc: any) => ({
      id: `inc-${inc.id}`,
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      description: `Incidente: ${inc.title ?? inc.description?.slice(0, 50) ?? 'Sem descrição'}`,
      timestamp: inc.createdAt,
      module: 'Segurança',
      badgeVariant: 'danger' as const,
    })),
    ...(recentClients?.data ?? []).map((cli: any) => ({
      id: `cli-${cli.id}`,
      icon: <Handshake className="h-4 w-4 text-green-600" />,
      description: `Cliente: ${cli.name ?? 'Sem nome'}`,
      timestamp: cli.createdAt,
      module: 'CRM',
      badgeVariant: 'success' as const,
    })),
  ]
    .filter(item => item.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Painel de Controlo</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Visão geral do sistema</span>
        </div>
      </div>

      {/* ── KPIs Principais ────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receita Total"
          value={revenueLoading ? '...' : formatKwanza(totalRevenue)}
          icon={<DollarSign className="h-8 w-8" />}
        />
        <StatCard
          title="Faturas Emitidas"
          value={invoicingLoading ? '...' : (invoicingData?.total ?? 0)}
          icon={<FileText className="h-8 w-8" />}
        />
        <StatCard
          title="Clientes Ativos"
          value={clientsLoading ? '...' : (clientsData?.total ?? 0)}
          icon={<Users className="h-8 w-8" />}
        />
        <StatCard
          title="Contratos Ativos"
          value={contractsLoading ? '...' : (contractsData?.total ?? 0)}
          icon={<Briefcase className="h-8 w-8" />}
        />
      </div>

      {/* ── Estatísticas por Módulo ─────────────── */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Módulos Ativos</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {MODULES.map(mod => (
            <ModuleStatCard key={mod.key} config={mod} />
          ))}
        </div>
      </div>

      {/* ── Atividade Recente + Ações Rápidas ──── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Atividade Recente */}
        <Card className="lg:col-span-2">
          <CardTitle className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            Atividade Recente
          </CardTitle>
          <CardContent>
            {activityItems.length > 0 ? (
              <div className="space-y-3">
                {activityItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={item.badgeVariant}>{item.module}</Badge>
                        <span className="text-xs text-gray-400">
                          {item.timestamp ? formatDateTime(item.timestamp) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Sem atividade recente</p>
            )}
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardTitle className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-gray-400" />
            Ações Rápidas
          </CardTitle>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_ACTIONS.map(action => {
                const ActionIcon = action.icon
                return (
                  <Link key={action.href} href={action.href}>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-left">
                      <ActionIcon className="h-4 w-4 shrink-0 text-primary" />
                      {action.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

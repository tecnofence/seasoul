'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  BedDouble,
  DollarSign,
  Wrench,
  Users,
  CalendarDays,
  UserCheck,
  ShoppingCart,
  Sparkles,
  Package,
  ConciergeBell,
  Calculator,
  ShoppingBag,
  Clock,
  Plus,
  Activity,
  type LucideIcon,
} from 'lucide-react'

// ── Tipos internos ────────────────────────────────

interface ModuleCard {
  key: string
  label: string
  icon: LucideIcon
  href: string
  endpoint: string
}

interface QuickAction {
  label: string
  href: string
  icon: LucideIcon
}

interface ActivityItem {
  id: string
  icon: ReactNode
  description: string
  timestamp: string
  module: string
  badgeVariant: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

// ── Configuração de módulos ───────────────────────

const MODULE_CARDS: ModuleCard[] = [
  { key: 'reservations', label: 'Reservas',  icon: CalendarDays,  href: '/dashboard/reservations', endpoint: '/reservations' },
  { key: 'guests',       label: 'Hóspedes',  icon: UserCheck,     href: '/dashboard/guests',        endpoint: '/guest/list'   },
  { key: 'pos',          label: 'F&B / POS', icon: ShoppingCart,  href: '/dashboard/pos',           endpoint: '/pos/orders'   },
  { key: 'spa',          label: 'Spa',        icon: Sparkles,      href: '/dashboard/spa',           endpoint: '/spa/bookings' },
  { key: 'stock',        label: 'Stock',      icon: Package,       href: '/dashboard/stock',         endpoint: '/stock'        },
  { key: 'hr',           label: 'RH',         icon: Users,         href: '/dashboard/hr',            endpoint: '/hr'           },
]

// ── Ações rápidas ─────────────────────────────────

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Nova Reserva',       href: '/dashboard/reservations/new',   icon: CalendarDays  },
  { label: 'Novo Hóspede',       href: '/dashboard/guests/new',         icon: UserCheck     },
  { label: 'Lançamento Contab.', href: '/dashboard/accounting/new',     icon: Calculator    },
  { label: 'Ticket Manutenção',  href: '/dashboard/maintenance/new',    icon: Wrench        },
  { label: 'Nova Venda',         href: '/dashboard/retail/new',         icon: ShoppingBag   },
  { label: 'Reserva Spa',        href: '/dashboard/spa/bookings/new',   icon: Sparkles      },
]

// ── Componente: cartão de módulo ──────────────────

function ModuleTile({ mod }: { mod: ModuleCard }) {
  const { data, isLoading } = useQuery({
    queryKey: [`dashboard-module-${mod.key}`],
    queryFn: () => api.get(mod.endpoint, { params: { limit: 1 } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  const total: number = data?.total ?? 0
  const Icon = mod.icon

  return (
    <Link href={mod.href}>
      <Card className="group cursor-pointer p-4 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-gray-500">{mod.label}</p>
            {isLoading ? (
              <p className="text-sm font-bold text-gray-300">...</p>
            ) : (
              <p className="text-lg font-bold text-gray-900">{total}</p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

// ── Página principal ──────────────────────────────

export default function DashboardPage() {
  // Hóspedes in-house
  const { data: checkedInData, isLoading: checkedInLoading } = useQuery({
    queryKey: ['dashboard-checked-in'],
    queryFn: () =>
      api.get('/reservations', { params: { limit: 10, status: 'CHECKED_IN' } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Receita do mês — lançamentos contabilísticos de receita
  const { data: accountingData, isLoading: accountingLoading } = useQuery({
    queryKey: ['dashboard-accounting-revenue'],
    queryFn: () =>
      api.get('/accounting/entries', { params: { limit: 200, tipo: 'RECEITA' } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Manutenção aberta
  const { data: maintenanceData, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['dashboard-maintenance-open'],
    queryFn: () =>
      api.get('/maintenance', { params: { limit: 1, status: 'OPEN' } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Total de colaboradores
  const { data: hrData, isLoading: hrLoading } = useQuery({
    queryKey: ['dashboard-hr-total'],
    queryFn: () => api.get('/hr', { params: { limit: 1 } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Atividade recente — reservas
  const { data: recentReservations } = useQuery({
    queryKey: ['dashboard-recent-reservations'],
    queryFn: () => api.get('/reservations', { params: { limit: 5 } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Atividade recente — pedidos de quarto
  const { data: recentServiceOrders } = useQuery({
    queryKey: ['dashboard-recent-service-orders'],
    queryFn: () => api.get('/service-orders', { params: { limit: 5 } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // Atividade recente — reservas de spa
  const { data: recentSpaBookings } = useQuery({
    queryKey: ['dashboard-recent-spa'],
    queryFn: () => api.get('/spa/bookings', { params: { limit: 5 } }).then(r => r.data),
    staleTime: 60000,
    retry: 1,
  })

  // ── Cálculos derivados ────────────────────────

  const checkedInTotal: number = checkedInData?.total ?? 0

  const monthRevenue: number = (accountingData?.data ?? []).reduce(
    (acc: number, entry: any) => acc + (parseFloat(entry.valor ?? entry.amount ?? '0') || 0),
    0,
  )

  const openMaintenanceTotal: number = maintenanceData?.total ?? 0
  const hrTotal: number = hrData?.total ?? 0

  // ── Feed de atividade ────────────────────────

  const activityItems: ActivityItem[] = [
    ...(recentReservations?.data ?? []).map((r: any) => ({
      id: `res-${r.id}`,
      icon: <BedDouble className="h-4 w-4 text-blue-600" />,
      description: `Reserva: ${r.guestName ?? 'Hóspede'} — ${r.checkIn ? new Date(r.checkIn).toLocaleDateString('pt-PT') : ''}`,
      timestamp: r.createdAt ?? '',
      module: 'Reservas',
      badgeVariant: 'info' as const,
    })),
    ...(recentServiceOrders?.data ?? []).map((o: any) => ({
      id: `svc-${o.id}`,
      icon: <ConciergeBell className="h-4 w-4 text-amber-600" />,
      description: `Pedido: ${o.type ?? o.description?.slice(0, 40) ?? 'Sem descrição'}`,
      timestamp: o.createdAt ?? '',
      module: 'Serviços',
      badgeVariant: 'warning' as const,
    })),
    ...(recentSpaBookings?.data ?? []).map((s: any) => ({
      id: `spa-${s.id}`,
      icon: <Sparkles className="h-4 w-4 text-purple-600" />,
      description: `Spa: ${s.serviceName ?? s.guestName ?? 'Reserva'}`,
      timestamp: s.createdAt ?? '',
      module: 'Spa',
      badgeVariant: 'default' as const,
    })),
  ]
    .filter(item => item.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  // ── Data actual ──────────────────────────────

  const todayLabel = new Date().toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6">

      {/* ── Cabeçalho ─────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel do Resort</h1>
          <p className="text-sm text-gray-500">Sea and Soul Resorts — Angola</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm">
          <Activity className="h-4 w-4 text-primary" />
          <span className="capitalize">{todayLabel}</span>
        </div>
      </div>

      {/* ── KPIs principais ───────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Hóspedes In-House"
          value={checkedInLoading ? '...' : checkedInTotal}
          icon={<BedDouble className="h-8 w-8" />}
          description="Quartos ocupados hoje"
        />
        <StatCard
          title="Receita do Mês"
          value={accountingLoading ? '...' : formatKwanza(monthRevenue)}
          icon={<DollarSign className="h-8 w-8" />}
          description="Lançamentos este mês"
        />
        <StatCard
          title="Manutenção Aberta"
          value={maintenanceLoading ? '...' : openMaintenanceTotal}
          icon={<Wrench className="h-8 w-8" />}
          description={
            openMaintenanceTotal > 0 ? (
              <span className="text-amber-600">Tickets por resolver</span>
            ) : (
              'Tickets por resolver'
            )
          }
        />
        <StatCard
          title="Equipa Ativa"
          value={hrLoading ? '...' : hrTotal}
          icon={<Users className="h-8 w-8" />}
          description="Colaboradores"
        />
      </div>

      {/* ── Módulos do Resort ─────────────────── */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Módulos do Resort</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {MODULE_CARDS.map(mod => (
            <ModuleTile key={mod.key} mod={mod} />
          ))}
        </div>
      </div>

      {/* ── Atividade recente + Ações rápidas ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Atividade Recente */}
        <Card className="lg:col-span-2">
          <CardTitle className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-400" />
            Atividade Recente
          </CardTitle>
          <CardContent>
            {activityItems.length > 0 ? (
              <div className="space-y-2">
                {activityItems.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {item.description}
                      </p>
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
              <p className="py-8 text-center text-sm text-gray-400">
                Sem atividade recente
              </p>
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
                    <Button variant="ghost" className="w-full justify-start gap-2 text-left text-gray-700">
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

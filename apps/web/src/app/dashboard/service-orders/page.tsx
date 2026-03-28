'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Clock, CheckCircle2, AlertCircle, Timer, Plus } from 'lucide-react'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const TYPE_EMOJI: Record<string, string> = {
  FOOD: '🍽️',
  CLEANING: '🧹',
  MAINTENANCE: '🔧',
  AMENITIES: '🛁',
  OTHER: '📋',
  // legacy/fallback
  ROOM_SERVICE: '🍽️',
  HOUSEKEEPING: '🧹',
  SPA: '🛁',
  RESTAURANT: '🍽️',
}

const TYPE_LABEL: Record<string, string> = {
  FOOD: 'Alimentação',
  CLEANING: 'Limpeza',
  MAINTENANCE: 'Manutenção',
  AMENITIES: 'Amenidades',
  OTHER: 'Outro',
  ROOM_SERVICE: 'Room Service',
  HOUSEKEEPING: 'Housekeeping',
  SPA: 'SPA',
  RESTAURANT: 'Restaurante',
}

const PRIORITY_TABS = [
  { value: '', label: 'Todos' },
  { value: 'URGENT', label: 'Urgente' },
  { value: 'NORMAL', label: 'Normal' },
]

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em Progresso' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora mesmo'
  if (mins < 60) return `há ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  return `há ${Math.floor(hrs / 24)}d`
}

function avgResponseMinutes(orders: any[]): string {
  const completed = orders.filter(
    (o) => o.status === 'COMPLETED' && o.createdAt && o.updatedAt,
  )
  if (!completed.length) return '—'
  const avg =
    completed.reduce((acc, o) => {
      return acc + (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime())
    }, 0) /
    completed.length /
    60_000
  return `${Math.round(avg)} min`
}

// ─── Order Card ──────────────────────────────────────────────────────────────

function OrderCard({ order, onAccept, onComplete }: {
  order: any
  onAccept: (id: string) => void
  onComplete: (id: string) => void
}) {
  const isUrgent = order.priority === 'URGENT'
  const roomNumber = order.room?.number ?? order.reservation?.room?.number ?? order.roomNumber ?? null

  return (
    <Card className="flex flex-col gap-3 p-4 transition-shadow hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Priority dot */}
          <span
            className={`mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
              isUrgent ? 'bg-red-500 animate-pulse' : 'bg-gray-300'
            }`}
            title={isUrgent ? 'Urgente' : 'Normal'}
          />
          {/* Type emoji + label */}
          <span className="text-lg leading-none" aria-hidden="true">
            {TYPE_EMOJI[order.type] ?? '📋'}
          </span>
          <span className="truncate text-sm font-semibold text-gray-800">
            {TYPE_LABEL[order.type] ?? order.type}
          </span>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {/* Room badge */}
          {roomNumber && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              Quarto {roomNumber}
            </span>
          )}
          <Badge variant={STATUS_VARIANT[order.status] ?? 'default'}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Badge>
        </div>
      </div>

      {/* Description */}
      {order.description && (
        <p className="line-clamp-2 text-sm text-gray-600">{order.description}</p>
      )}

      {/* Footer row */}
      <div className="flex items-end justify-between gap-2 border-t border-gray-100 pt-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-gray-500">
            {order.requestedBy ?? order.guest?.name ?? order.reservation?.guestName ?? '—'}
          </p>
          <p className="text-xs text-gray-400">{timeAgo(order.createdAt)}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {order.status === 'PENDING' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAccept(order.id)}
              className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary"
            >
              Aceitar
            </Button>
          )}
          {order.status === 'IN_PROGRESS' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => onComplete(order.id)}
            >
              Concluir
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ServiceOrdersPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  // Fetch all for stats (unfiltered)
  const { data: allData } = useQuery({
    queryKey: ['service-orders-all'],
    queryFn: () =>
      api.get('/service-orders', { params: { limit: 100 } }).then((r) => r.data),
  })

  // Fetch filtered list
  const { data, isLoading } = useQuery({
    queryKey: ['service-orders', statusFilter, priorityFilter],
    queryFn: () =>
      api
        .get('/service-orders', {
          params: {
            limit: 50,
            status: statusFilter || undefined,
            priority: priorityFilter || undefined,
          },
        })
        .then((r) => r.data),
  })

  const allOrders: any[] = allData?.data ?? []
  const orders: any[] = data?.data ?? []

  // Stats (computed from full list)
  const stats = useMemo(() => {
    const today = new Date().toDateString()
    return {
      pending: allOrders.filter((o) => o.status === 'PENDING').length,
      inProgress: allOrders.filter((o) => o.status === 'IN_PROGRESS').length,
      completedToday: allOrders.filter(
        (o) => o.status === 'COMPLETED' && new Date(o.updatedAt).toDateString() === today,
      ).length,
      avgResponse: avgResponseMinutes(allOrders),
    }
  }, [allOrders])

  // Mutations
  const patchStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/service-orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-orders'] })
      queryClient.invalidateQueries({ queryKey: ['service-orders-all'] })
    },
  })

  const handleAccept = (id: string) => patchStatus.mutate({ id, status: 'IN_PROGRESS' })
  const handleComplete = (id: string) => patchStatus.mutate({ id, status: 'COMPLETED' })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
        <Link href="/dashboard/service-orders/new">
          <Button>
            <Plus size={16} className="mr-1.5" />
            Nova Ordem
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Pendentes"
          value={stats.pending}
          icon={<Clock size={22} />}
          className="border-l-4 border-l-yellow-400"
        />
        <StatCard
          title="Em Curso"
          value={stats.inProgress}
          icon={<AlertCircle size={22} />}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Concluídos Hoje"
          value={stats.completedToday}
          icon={<CheckCircle2 size={22} />}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="Tempo Médio"
          value={stats.avgResponse}
          icon={<Timer size={22} />}
          className="border-l-4 border-l-primary"
          description="tempo médio de resposta"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Priority */}
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-gray-500 mr-1">Prioridade:</span>
          {PRIORITY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setPriorityFilter(tab.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                priorityFilter === tab.value
                  ? tab.value === 'URGENT'
                    ? 'bg-red-600 text-white'
                    : 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.value === 'URGENT' && (
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current align-middle" />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status */}
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-gray-500 mr-1">Estado:</span>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-gray-500">
          {orders.length} ordem{orders.length !== 1 ? 's' : ''} encontrada
          {orders.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {/* Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              onAccept={handleAccept}
              onComplete={handleComplete}
            />
          ))}

          {orders.length === 0 && (
            <div className="col-span-full flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-400">
              Nenhuma ordem de serviço encontrada.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

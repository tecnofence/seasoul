'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  MapPin,
  User,
  ChevronDown,
} from 'lucide-react'

// --- Types ---
type Priority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'
type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED'
type MaintenanceType = 'PLUMBING' | 'ELECTRICAL' | 'AC' | 'FURNITURE' | 'OTHER'

interface Ticket {
  id: string
  title: string
  description: string
  priority: Priority
  status: Status
  type: MaintenanceType
  location?: string
  room?: { number: string }
  reportedBy?: { name: string }
  assignedTo?: { name: string }
  createdAt: string
}

interface StatsData {
  open: number
  inProgress: number
  resolvedThisMonth: number
  urgent: number
}

// --- Constants ---
const PRIORITY_TABS: { key: '' | Priority; label: string }[] = [
  { key: '', label: 'Todos' },
  { key: 'URGENT', label: 'Urgente' },
  { key: 'HIGH', label: 'Alto' },
  { key: 'NORMAL', label: 'Normal' },
  { key: 'LOW', label: 'Baixo' },
]

const STATUS_OPTIONS: { key: '' | Status; label: string }[] = [
  { key: '', label: 'Todos os estados' },
  { key: 'OPEN', label: 'Aberto' },
  { key: 'IN_PROGRESS', label: 'Em Progresso' },
  { key: 'RESOLVED', label: 'Resolvido' },
  { key: 'CANCELLED', label: 'Cancelado' },
]

const PRIORITY_STYLES: Record<Priority, { badge: string; dot: string }> = {
  URGENT: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
  HIGH: {
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  NORMAL: {
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  LOW: {
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-400',
  },
}

const PRIORITY_LABELS: Record<Priority, string> = {
  URGENT: 'Urgente',
  HIGH: 'Alto',
  NORMAL: 'Normal',
  LOW: 'Baixo',
}

const STATUS_STYLES: Record<Status, string> = {
  OPEN: 'bg-amber-100 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-200',
  RESOLVED: 'bg-green-100 text-green-700 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
}

const STATUS_LABELS: Record<Status, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Progresso',
  RESOLVED: 'Resolvido',
  CANCELLED: 'Cancelado',
}

const TYPE_ICONS: Record<MaintenanceType, string> = {
  PLUMBING: '💧',
  ELECTRICAL: '⚡',
  AC: '❄️',
  FURNITURE: '🪑',
  OTHER: '🔧',
}

const TYPE_LABELS: Record<MaintenanceType, string> = {
  PLUMBING: 'Canalização',
  ELECTRICAL: 'Elétrica',
  AC: 'Ar Condicionado',
  FURNITURE: 'Mobiliário',
  OTHER: 'Outro',
}

export default function MaintenancePage() {
  const queryClient = useQueryClient()
  const [priority, setPriority] = useState<'' | Priority>('')
  const [status, setStatus] = useState<'' | Status>('')

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', priority, status],
    queryFn: () =>
      api
        .get('/maintenance', {
          params: {
            limit: 50,
            priority: priority || undefined,
            status: status || undefined,
          },
        })
        .then((r) => r.data),
  })

  const { data: statsData } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: () => api.get('/maintenance/stats').then((r) => r.data),
  })

  const assignMutation = useMutation({
    mutationFn: (ticketId: string) =>
      api.patch(`/maintenance/${ticketId}`, { status: 'IN_PROGRESS' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
  })

  const resolveMutation = useMutation({
    mutationFn: (ticketId: string) =>
      api.patch(`/maintenance/${ticketId}`, { status: 'RESOLVED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-stats'] })
    },
  })

  const tickets: Ticket[] = data?.data ?? []
  const stats: StatsData = statsData?.data ?? {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manutenção</h1>
          <p className="mt-1 text-sm text-gray-500">Gestão de tickets e ordens de trabalho</p>
        </div>
        <Link href="/dashboard/maintenance/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Ticket
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Abertos"
          value={stats.open ?? '—'}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Em Progresso"
          value={stats.inProgress ?? '—'}
          icon={<Wrench className="h-5 w-5" />}
        />
        <StatCard
          title="Concluídos este Mês"
          value={stats.resolvedThisMonth ?? '—'}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          title="Urgentes"
          value={stats.urgent ?? '—'}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Priority chip tabs */}
        <div className="flex flex-wrap gap-2">
          {PRIORITY_TABS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPriority(p.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                priority === p.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.key === 'URGENT' && (
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
              )}
              {p.label}
            </button>
          ))}
        </div>

        {/* Status select */}
        <div className="relative sm:ml-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as '' | Status)}
            className="h-9 appearance-none rounded-md border border-gray-200 bg-white pl-3 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Tickets list */}
      {isLoading ? (
        <Card className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                  <div className="h-3 w-3/4 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="flex h-40 items-center justify-center">
          <div className="text-center">
            <Wrench className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Nenhum ticket encontrado</p>
          </div>
        </Card>
      ) : (
        <Card className="divide-y divide-gray-100 p-0 overflow-hidden">
          {tickets.map((ticket) => {
            const pStyle = PRIORITY_STYLES[ticket.priority] ?? PRIORITY_STYLES.NORMAL
            const sStyle = STATUS_STYLES[ticket.status] ?? STATUS_STYLES.OPEN
            const typeIcon = TYPE_ICONS[ticket.type] ?? '🔧'
            const typeLabel = TYPE_LABELS[ticket.type] ?? ticket.type

            return (
              <div
                key={ticket.id}
                className="flex flex-col gap-3 p-4 hover:bg-gray-50 sm:flex-row sm:items-center"
              >
                {/* Type icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
                  {typeIcon}
                </div>

                {/* Main info */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">{ticket.title}</span>
                    {/* Priority badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${pStyle.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${pStyle.dot}`} />
                      {PRIORITY_LABELS[ticket.priority]}
                    </span>
                    {/* Status badge */}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${sStyle}`}
                    >
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>

                  {/* Description */}
                  {ticket.description && (
                    <p className="mt-0.5 truncate text-sm text-gray-500">{ticket.description}</p>
                  )}

                  {/* Meta row */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <span className="text-base leading-none">{typeIcon}</span>
                      {typeLabel}
                    </span>
                    {(ticket.location || ticket.room) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {ticket.location ?? `Quarto ${ticket.room?.number}`}
                      </span>
                    )}
                    {ticket.reportedBy && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {ticket.reportedBy.name}
                      </span>
                    )}
                    <span>{formatDateTime(ticket.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-2">
                  {ticket.status === 'OPEN' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => assignMutation.mutate(ticket.id)}
                      disabled={assignMutation.isPending}
                    >
                      Assumir
                    </Button>
                  )}
                  {ticket.status === 'IN_PROGRESS' && (
                    <Button
                      size="sm"
                      onClick={() => resolveMutation.mutate(ticket.id)}
                      disabled={resolveMutation.isPending}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                      Resolver
                    </Button>
                  )}
                  {(ticket.status === 'RESOLVED' || ticket.status === 'CANCELLED') && (
                    <span className="flex h-8 items-center text-xs text-gray-400">Encerrado</span>
                  )}
                </div>
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

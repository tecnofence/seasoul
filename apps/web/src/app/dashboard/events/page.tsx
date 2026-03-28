'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import {
  CalendarDays,
  Plus,
  Users,
  TrendingUp,
  MapPin,
  ChevronRight,
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  PLANNED: 'Planeado',
  CONFIRMED: 'Confirmado',
  ONGOING: 'Em Curso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  PLANNED: 'warning',
  CONFIRMED: 'info',
  ONGOING: 'success',
  COMPLETED: 'default',
  CANCELLED: 'danger',
}

const CATEGORY_DISPLAY: Record<string, { label: string; colorClass: string; dotClass: string }> = {
  CONFERENCE: {
    label: 'Conferência',
    colorClass: 'bg-primary/10 text-primary',
    dotClass: 'bg-primary',
  },
  WEDDING: {
    label: 'Casamento',
    colorClass: 'bg-pink-100 text-pink-700',
    dotClass: 'bg-pink-500',
  },
  PARTY: {
    label: 'Festa',
    colorClass: 'bg-amber-100 text-amber-700',
    dotClass: 'bg-amber-500',
  },
  GALA: {
    label: 'Gala',
    colorClass: 'bg-purple-100 text-purple-700',
    dotClass: 'bg-purple-500',
  },
  CORPORATE: {
    label: 'Corporativo',
    colorClass: 'bg-primary/10 text-primary',
    dotClass: 'bg-primary',
  },
  CONCERT: {
    label: 'Concerto',
    colorClass: 'bg-green-100 text-green-700',
    dotClass: 'bg-green-500',
  },
  EXHIBITION: {
    label: 'Exposição',
    colorClass: 'bg-teal-100 text-teal-700',
    dotClass: 'bg-teal-500',
  },
  OTHER: {
    label: 'Outro',
    colorClass: 'bg-gray-100 text-gray-700',
    dotClass: 'bg-gray-400',
  },
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ─── Fallback sample data ─────────────────────────────────────────────────────

const SAMPLE_EVENTS = [
  {
    id: 'sample-1',
    name: 'Conferência Petrolífera SADC',
    category: 'CONFERENCE',
    eventType: 'CONFERENCE',
    startDate: '2026-04-15T09:00:00',
    venue: 'Salão Atlântico',
    attendees: 120,
    capacity: 150,
    status: 'CONFIRMED',
    revenue: 8500000,
  },
  {
    id: 'sample-2',
    name: 'Casamento Silva & Costa',
    category: 'WEDDING',
    eventType: 'WEDDING',
    startDate: '2026-04-20T16:00:00',
    venue: 'Jardim Tropical',
    attendees: 85,
    capacity: 100,
    status: 'CONFIRMED',
    revenue: 12000000,
  },
  {
    id: 'sample-3',
    name: 'Gala Empresarial Sonangol',
    category: 'GALA',
    eventType: 'GALA',
    startDate: '2026-05-10T19:00:00',
    venue: 'Salão Principal',
    attendees: 200,
    capacity: 250,
    status: 'PLANNED',
    revenue: 15000000,
  },
]

// ─── Calendar Strip ───────────────────────────────────────────────────────────

function CalendarStrip({ events }: { events: any[] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return d
  })

  function countEventsOnDay(day: Date) {
    return events.filter((e: any) => {
      const raw = e.startDate ?? e.date ?? e.startAt
      if (!raw) return false
      const d = new Date(raw)
      return (
        d.getDate() === day.getDate() &&
        d.getMonth() === day.getMonth() &&
        d.getFullYear() === day.getFullYear()
      )
    }).length
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <Card>
      <CardTitle className="mb-4">Próximos 7 Dias</CardTitle>
      <CardContent>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((day, i) => {
            const count = countEventsOnDay(day)
            const isToday = day.getTime() === today.getTime()
            return (
              <div
                key={i}
                className={`flex min-w-[64px] flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-center transition-colors ${
                  isToday
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="text-xs font-medium text-gray-500">
                  {WEEKDAY_LABELS[day.getDay()]}
                </span>
                <span
                  className={`text-lg font-bold ${isToday ? 'text-primary' : 'text-gray-800'}`}
                >
                  {day.getDate()}
                </span>
                <span className="text-xs text-gray-400">{MONTH_LABELS[day.getMonth()]}</span>
                {count > 0 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {count}
                  </span>
                ) : (
                  <span className="h-5 w-5" />
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['events', statusFilter, categoryFilter],
    queryFn: () =>
      api
        .get('/events', {
          params: {
            status: statusFilter || undefined,
            eventType: categoryFilter || undefined,
            category: categoryFilter || undefined,
            limit: 50,
          },
        })
        .then((r) => r.data),
  })

  const rawEvents: any[] = data?.data ?? []
  const events = rawEvents.length > 0 ? rawEvents : SAMPLE_EVENTS

  // ── Filtered events (client-side when using sample data)
  const filteredEvents = useMemo(() => {
    let list = events
    if (statusFilter) list = list.filter((e: any) => e.status === statusFilter)
    if (categoryFilter)
      list = list.filter(
        (e: any) =>
          (e.category ?? e.eventType ?? '').toUpperCase() === categoryFilter,
      )
    return list
  }, [events, statusFilter, categoryFilter])

  // ── Stats
  const now = new Date()
  const thisMonthEvents = events.filter((e: any) => {
    const raw = e.startDate ?? e.date ?? e.startAt
    if (!raw) return false
    const d = new Date(raw)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const totalRevenue = events
    .filter((e: any) => e.status !== 'CANCELLED')
    .reduce((sum: number, e: any) => sum + parseFloat(e.revenue ?? e.totalRevenue ?? 0), 0)

  const totalCapacityConfirmed = events
    .filter((e: any) => e.status === 'CONFIRMED' || e.status === 'ONGOING')
    .reduce((sum: number, e: any) => sum + (e.attendees ?? e.confirmedAttendees ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos & Conferências</h1>
          <p className="text-sm text-gray-500">Gestão de eventos e espaços do resort</p>
        </div>
        <Button onClick={() => router.push('/dashboard/events/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Eventos"
          value={events.length}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          title="Este Mês"
          value={thisMonthEvents.length}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          title="Receita Eventos"
          value={formatKwanza(totalRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Participantes Confirmados"
          value={totalCapacityConfirmed}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* ── Calendar strip ── */}
      <CalendarStrip events={events} />

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          className="rounded-md border bg-white px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border bg-white px-3 py-2 text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_DISPLAY).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        {(statusFilter || categoryFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setCategoryFilter('') }}
            className="text-sm text-gray-500 hover:text-gray-800"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* ── Events list ── */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center text-gray-400">
          A carregar eventos...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Nenhum evento encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredEvents.map((e: any) => {
            const rawCat = (e.category ?? e.eventType ?? 'OTHER').toUpperCase()
            const cat = CATEGORY_DISPLAY[rawCat] ?? CATEGORY_DISPLAY.OTHER
            const rawDate = e.startDate ?? e.date ?? e.startAt
            const eventDate = rawDate ? new Date(rawDate) : null

            return (
              <div
                key={e.id}
                className="flex gap-4 rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Date badge */}
                <div className="flex shrink-0 flex-col items-center justify-start">
                  <div className="flex w-14 flex-col items-center rounded-lg bg-primary/10 px-2 py-2 text-center">
                    <span className="text-xs font-medium uppercase text-primary">
                      {eventDate ? MONTH_LABELS[eventDate.getMonth()] : '—'}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {eventDate ? eventDate.getDate() : '—'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{e.name ?? e.title}</h3>
                    <Badge variant={STATUS_VARIANT[e.status] ?? 'default'}>
                      {STATUS_LABEL[e.status] ?? e.status}
                    </Badge>
                  </div>

                  <div className="mb-2 flex flex-wrap gap-3 text-xs text-gray-500">
                    {(e.venue ?? e.location) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {e.venue ?? e.location}
                      </span>
                    )}
                    {eventDate && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDateTime(eventDate)}
                      </span>
                    )}
                    {(e.attendees !== undefined || e.capacity !== undefined) && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {e.attendees ?? 0} / {e.capacity ?? '—'} participantes
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.colorClass}`}
                      >
                        {cat.label}
                      </span>
                      {(e.revenue ?? e.totalRevenue) ? (
                        <span className="text-sm font-semibold text-gray-900">
                          {formatKwanza(e.revenue ?? e.totalRevenue ?? 0)}
                        </span>
                      ) : null}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/events/${e.id}`)}
                    >
                      Gerir
                      <ChevronRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

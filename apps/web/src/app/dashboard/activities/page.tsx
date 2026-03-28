'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import {
  Activity,
  Plus,
  Clock,
  Users,
  TrendingUp,
  CalendarCheck,
  BookOpen,
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_FILTER_LABELS: Record<string, string> = {
  '': 'Todos',
  AQUATIC: 'Aquático',
  LAND: 'Terrestre',
  CULTURAL: 'Cultural',
  WELLNESS: 'Bem-estar',
}

const CATEGORY_DISPLAY: Record<string, { label: string; className: string }> = {
  AQUATIC: { label: 'Aquático', className: 'bg-cyan-100 text-cyan-700' },
  LAND: { label: 'Terrestre', className: 'bg-green-100 text-green-700' },
  CULTURAL: { label: 'Cultural', className: 'bg-purple-100 text-purple-700' },
  WELLNESS: { label: 'Bem-estar', className: 'bg-pink-100 text-pink-700' },
  ADVENTURE: { label: 'Aventura', className: 'bg-orange-100 text-orange-700' },
  NATURE: { label: 'Natureza', className: 'bg-emerald-100 text-emerald-700' },
  SPORT: { label: 'Desporto', className: 'bg-blue-100 text-blue-700' },
  GASTRONOMY: { label: 'Gastronomia', className: 'bg-amber-100 text-amber-700' },
  OTHER: { label: 'Outro', className: 'bg-gray-100 text-gray-700' },
}

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  ONGOING: 'Em Curso',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'Não Compareceu',
}

const BOOKING_STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  ONGOING: 'success',
  COMPLETED: 'default',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
}

// ─── Fallback sample data ─────────────────────────────────────────────────────

const SAMPLE_ACTIVITIES = [
  { id: 'sample-1', name: 'Aulas de Surf', category: 'AQUATIC', price: 15000, duration: 90, maxParticipants: 8, description: 'Aprenda a surfar nas ondas do Atlântico com instrutores certificados.' },
  { id: 'sample-2', name: 'Snorkeling Tour', category: 'AQUATIC', price: 12000, duration: 120, maxParticipants: 6, description: 'Explore a vida marinha costeira com equipamento profissional.' },
  { id: 'sample-3', name: 'Visita à Aldeia Cultural', category: 'CULTURAL', price: 8000, duration: 180, maxParticipants: 15, description: 'Conheça a cultura e tradições locais de Angola.' },
  { id: 'sample-4', name: 'Yoga na Praia', category: 'WELLNESS', price: 5000, duration: 60, maxParticipants: 12, description: 'Sessão relaxante de yoga ao nascer do sol na praia.' },
  { id: 'sample-5', name: 'Safari de ATV na Praia', category: 'LAND', price: 25000, duration: 150, maxParticipants: 4, description: 'Aventura em ATV pelos cenários selvagens da costa angolana.' },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ActivitiesPage() {
  const router = useRouter()
  const [categoryFilter, setCategoryFilter] = useState('')

  // ── Activities fetch
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: () => api.get('/activities', { params: { limit: 50 } }).then((r) => r.data),
  })

  // ── Bookings fetch
  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['activity-bookings'],
    queryFn: () => api.get('/activities/bookings', { params: { limit: 20 } }).then((r) => r.data),
  })

  const rawActivities: any[] = activitiesData?.data ?? []
  const activities = rawActivities.length > 0 ? rawActivities : SAMPLE_ACTIVITIES
  const bookings: any[] = bookingsData?.data ?? []

  // ── Filtered activities
  const filteredActivities = useMemo(() => {
    if (!categoryFilter) return activities
    return activities.filter(
      (a: any) => (a.category ?? '').toUpperCase() === categoryFilter,
    )
  }, [activities, categoryFilter])

  // ── Stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const bookingsToday = bookings.filter((b: any) => {
    const d = b.scheduledAt ? new Date(b.scheduledAt) : null
    return d && d >= today && d < tomorrow
  }).length

  const currentMonth = new Date()
  const monthRevenue = bookings
    .filter((b: any) => {
      const d = b.scheduledAt ? new Date(b.scheduledAt) : null
      return (
        d &&
        d.getMonth() === currentMonth.getMonth() &&
        d.getFullYear() === currentMonth.getFullYear() &&
        b.status !== 'CANCELLED'
      )
    })
    .reduce((sum: number, b: any) => sum + parseFloat(b.total ?? b.totalAmount ?? 0), 0)

  const totalParticipants = bookings
    .filter((b: any) => b.status !== 'CANCELLED')
    .reduce((sum: number, b: any) => sum + (b.participants ?? b.numberOfParticipants ?? 1), 0)

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atividades & Tours</h1>
          <p className="text-sm text-gray-500">Gestão do catálogo e reservas de atividades</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/dashboard/activities/bookings/new')}>
            <BookOpen className="mr-2 h-4 w-4" />
            Nova Reserva
          </Button>
          <Button onClick={() => router.push('/dashboard/activities/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Atividade
          </Button>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Atividades"
          value={activities.length}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Reservas Hoje"
          value={bookingsToday}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Receita do Mês"
          value={formatKwanza(monthRevenue)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          title="Nº Participantes"
          value={totalParticipants}
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      {/* ── Activity catalog ── */}
      <div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Catálogo de Atividades</h2>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_FILTER_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  categoryFilter === key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {activitiesLoading ? (
          <div className="flex h-40 items-center justify-center text-gray-400">
            A carregar atividades...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map((a: any) => {
              const cat = CATEGORY_DISPLAY[a.category?.toUpperCase()] ?? {
                label: a.category ?? 'Outro',
                className: 'bg-gray-100 text-gray-700',
              }
              return (
                <div
                  key={a.id}
                  className="flex flex-col rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{a.name}</h3>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cat.className}`}
                        >
                          {cat.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {a.description && (
                    <p className="mb-3 line-clamp-2 text-xs text-gray-500">{a.description}</p>
                  )}

                  <div className="mt-auto flex items-center gap-4 text-sm">
                    <span className="font-semibold text-gray-900">{formatKwanza(a.price)}</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-3.5 w-3.5" />
                      {a.duration} min
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      {a.maxParticipants ?? a.capacity}
                    </span>
                  </div>

                  <div className="mt-3 border-t pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/dashboard/activities/${a.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              )
            })}

            {filteredActivities.length === 0 && (
              <div className="col-span-full rounded-lg border bg-white p-12 text-center">
                <Activity className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">Nenhuma atividade nesta categoria</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Upcoming bookings table ── */}
      <Card className="p-0">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <CardTitle>Próximas Reservas</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/activities/bookings')}
            className="text-xs text-primary"
          >
            Ver todas
          </Button>
        </div>

        {bookingsLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-400">
            A carregar reservas...
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-gray-400">
            <p className="text-sm">Nenhuma reserva registada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Atividade</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Hóspede</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Data / Hora</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Participantes</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((b: any) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {b.activity?.name ?? b.activityName ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {b.guest?.name ?? b.guestName ?? '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {b.scheduledAt ? formatDateTime(b.scheduledAt) : '—'}
                    </td>
                    <td className="px-6 py-3 text-center text-gray-600">
                      {b.participants ?? b.numberOfParticipants ?? 1}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {formatKwanza(b.total ?? b.totalAmount ?? 0)}
                    </td>
                    <td className="px-6 py-3">
                      <Badge variant={BOOKING_STATUS_VARIANT[b.status] ?? 'default'}>
                        {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

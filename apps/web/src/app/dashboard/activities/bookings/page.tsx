'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatCard } from '@/components/ui/stat-card'
import {
  BookOpen, Plus, Search, Users, TrendingUp, CalendarCheck,
  CheckCircle2, XCircle, Clock, ChevronLeft,
} from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'Em Curso',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'Não Compareceu',
}

const STATUS_VARIANT: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  IN_PROGRESS: 'success',
  COMPLETED: 'default',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
}

export default function ActivityBookingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['activity-bookings-list', search, statusFilter, page],
    queryFn: () =>
      api.get('/activities/bookings', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
          page,
          limit: 20,
        },
      }).then((r) => r.data),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/activities/bookings/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity-bookings-list'] }),
  })

  const bookings: any[] = data?.data ?? []
  const totalPages: number = data?.totalPages ?? 1
  const total: number = data?.total ?? 0

  // Stats from current data
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length
  const completed = bookings.filter((b) => b.status === 'COMPLETED').length
  const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length
  const revenue = bookings
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + parseFloat(b.totalPrice ?? b.total ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.push('/dashboard/activities')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reservas de Atividades</h1>
            <p className="text-sm text-gray-500">{total} reservas no total</p>
          </div>
        </div>
        <Button onClick={() => router.push('/dashboard/activities/bookings/new')}>
          <Plus className="mr-2 h-4 w-4" /> Nova Reserva
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Confirmadas" value={confirmed} icon={<CalendarCheck className="h-5 w-5 text-primary" />} />
        <StatCard title="Concluídas" value={completed} icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} />
        <StatCard title="Canceladas" value={cancelled} icon={<XCircle className="h-5 w-5 text-red-500" />} />
        <StatCard title="Receita (página)" value={formatKwanza(revenue)} icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Pesquisar por hóspede ou atividade..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Atividade</th>
                <th className="px-4 py-3">Hóspede / Cliente</th>
                <th className="px-4 py-3">Data Agendada</th>
                <th className="px-4 py-3 text-center">Participantes</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b: any) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-gray-900">
                        {b.activity?.name ?? b.activityName ?? '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{b.clientName ?? b.guestName ?? '—'}</p>
                    {(b.clientEmail ?? b.guestEmail) && (
                      <p className="text-xs text-gray-400">{b.clientEmail ?? b.guestEmail}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {b.date ? formatDateTime(b.date) : b.scheduledAt ? formatDateTime(b.scheduledAt) : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-600">
                      <Users className="h-3.5 w-3.5" />
                      {b.participants ?? b.numberOfParticipants ?? 1}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatKwanza(parseFloat(b.totalPrice ?? b.total ?? b.totalAmount ?? 0))}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[b.status] ?? 'default'}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {b.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => updateStatusMutation.mutate({ id: b.id, status: 'CONFIRMED' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Confirmar
                        </Button>
                      )}
                      {b.status === 'CONFIRMED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                          onClick={() => updateStatusMutation.mutate({ id: b.id, status: 'COMPLETED' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Concluir
                        </Button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(b.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-red-500 hover:bg-red-50"
                          onClick={() => updateStatusMutation.mutate({ id: b.id, status: 'CANCELLED' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {bookings.length === 0 && (
            <div className="p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhuma reserva encontrada</p>
              <Button className="mt-4" onClick={() => router.push('/dashboard/activities/bookings/new')}>
                <Plus className="mr-2 h-4 w-4" /> Criar Reserva
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Anterior</Button>
          <span className="px-2 text-sm text-gray-500">
            Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Seguinte</Button>
        </div>
      )}
    </div>
  )
}

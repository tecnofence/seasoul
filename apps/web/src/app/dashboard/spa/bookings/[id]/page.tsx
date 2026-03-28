'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, CalendarCheck, RefreshCw } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em Curso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))

export default function SpaBookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [newStatus, setNewStatus] = useState('')
  const [statusError, setStatusError] = useState('')

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: ['spa-booking', id],
    queryFn: () => api.get(`/spa/bookings/${id}`).then((r) => r.data.data ?? r.data),
    enabled: !!id,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/spa/bookings/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spa-booking', id] })
      setStatusError('')
      setNewStatus('')
    },
    onError: (err: any) => {
      setStatusError(err.response?.data?.error || 'Erro ao atualizar estado')
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !booking) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Reserva de spa não encontrada.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    )
  }

  const currentStatus: string = booking.status ?? 'PENDING'
  const statusColor = STATUS_COLORS[currentStatus] ?? 'bg-gray-100 text-gray-800'
  const statusLabel = STATUS_LABELS[currentStatus] ?? currentStatus

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/spa"
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Reserva de Spa
            </h1>
            <p className="text-sm text-gray-500">
              {booking.guestName ?? booking.clientName ?? '—'}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColor}`}
        >
          <CalendarCheck className="mr-1.5 h-4 w-4" />
          {statusLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Detalhes da reserva */}
        <Card>
          <CardTitle>Detalhes da Reserva</CardTitle>
          <CardContent>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Hóspede</dt>
                <dd className="font-medium">{booking.guestName ?? booking.clientName ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Quarto</dt>
                <dd className="font-medium">{booking.roomNumber ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Serviço</dt>
                <dd className="font-medium">
                  {booking.service?.name ?? booking.serviceName ?? '—'}
                </dd>
              </div>
              {(booking.service?.price ?? booking.price) != null && (
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Preço</dt>
                  <dd className="font-medium">
                    {formatKwanza(booking.service?.price ?? booking.price)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Data e Hora</dt>
                <dd className="font-medium">
                  {booking.date ? formatDateTime(booking.date) : '—'}
                  {!booking.date && booking.time ? booking.time : ''}
                </dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Terapeuta</dt>
                <dd className="font-medium">{booking.therapist ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                </dd>
              </div>
              {booking.notes && (
                <div>
                  <dt className="mb-1 text-gray-500">Notas</dt>
                  <dd className="whitespace-pre-wrap text-gray-700">{booking.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Atualizar estado */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Atualizar Estado
          </CardTitle>
          <CardContent>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-500">
                Estado atual:{' '}
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </p>

              {statusError && (
                <p className="rounded bg-red-50 p-3 text-sm text-red-600">{statusError}</p>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Novo Estado
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">— Selecionar estado —</option>
                  {STATUS_OPTIONS.filter((s) => s.value !== currentStatus).map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                onClick={() => {
                  if (newStatus) statusMutation.mutate(newStatus)
                }}
                disabled={!newStatus || statusMutation.isPending}
              >
                {statusMutation.isPending ? 'A atualizar...' : 'Atualizar Estado'}
              </Button>

              {statusMutation.isSuccess && (
                <p className="text-sm text-green-600">Estado atualizado com sucesso.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rodapé */}
      <div className="text-sm text-gray-400">
        {booking.createdAt && (
          <span>Criado em: {formatDateTime(booking.createdAt)}</span>
        )}
      </div>
    </div>
  )
}

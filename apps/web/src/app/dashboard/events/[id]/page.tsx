'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Calendar, MapPin, Users } from 'lucide-react'

const EVENT_TYPE_LABELS: Record<string, string> = {
  WEDDING: 'Casamento',
  CORPORATE: 'Corporativo',
  CONFERENCE: 'Conferência',
  PARTY: 'Festa',
  CONCERT: 'Concerto',
  EXHIBITION: 'Exposição',
  OTHER: 'Outro',
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  PLANNED: 'Planeado',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em Curso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_VARIANTS: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'default',
  PLANNED: 'info',
  CONFIRMED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/events/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', id] })
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar estado'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Evento não encontrado.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  const status: string = event.status || 'DRAFT'

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            <p className="text-sm text-gray-500">{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</p>
          </div>
        </div>
        <Badge variant={STATUS_VARIANTS[status] || 'default'}>
          {STATUS_LABELS[status] || status}
        </Badge>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      {/* Detalhes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Informações do Evento</CardTitle>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Tipo</dt>
                <dd className="text-sm font-medium">{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  Localização
                </dt>
                <dd className="text-sm font-medium">{event.location}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Início
                </dt>
                <dd className="text-sm font-medium">{formatDate(event.startDate)}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Fim
                </dt>
                <dd className="text-sm font-medium">{formatDate(event.endDate)}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="h-3.5 w-3.5" />
                  Capacidade
                </dt>
                <dd className="text-sm font-medium">
                  {event.registeredCount ?? 0} / {event.capacity} inscritos
                </dd>
              </div>
              {event.price != null && (
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-sm text-gray-500">Preço</dt>
                  <dd className="text-sm font-medium">{formatKwanza(event.price)}</dd>
                </div>
              )}
              {event.description && (
                <div>
                  <dt className="mb-1 text-sm text-gray-500">Descrição</dt>
                  <dd className="text-sm text-gray-700 whitespace-pre-wrap">{event.description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Ações de estado */}
        <Card>
          <CardTitle className="mb-4">Ações</CardTitle>
          <CardContent>
            <div className="space-y-3">
              {(status === 'DRAFT' || status === 'PLANNED') && (
                <Button
                  className="w-full"
                  onClick={() => statusMutation.mutate('CONFIRMED')}
                  disabled={statusMutation.isPending}
                >
                  Confirmar Evento
                </Button>
              )}
              {status === 'CONFIRMED' && (
                <Button
                  className="w-full"
                  onClick={() => statusMutation.mutate('IN_PROGRESS')}
                  disabled={statusMutation.isPending}
                >
                  Iniciar Evento
                </Button>
              )}
              {status === 'IN_PROGRESS' && (
                <Button
                  className="w-full"
                  onClick={() => statusMutation.mutate('COMPLETED')}
                  disabled={statusMutation.isPending}
                >
                  Concluir Evento
                </Button>
              )}
              {status !== 'CANCELLED' && (
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => statusMutation.mutate('CANCELLED')}
                  disabled={statusMutation.isPending}
                >
                  Cancelar Evento
                </Button>
              )}
              {status === 'CANCELLED' && (
                <p className="text-sm text-gray-500 text-center">Este evento foi cancelado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

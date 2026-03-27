'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, XCircle, PlayCircle } from 'lucide-react'

const statusLabels: Record<string, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  IN_PROGRESS: 'Em Progresso',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'Não Compareceu',
}

const statusVariants: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  SCHEDULED: 'default',
  CONFIRMED: 'default',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  NO_SHOW: 'danger',
}

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: appointment, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => api.get(`/healthcare/appointments/${id}`).then((r) => r.data.data),
  })

  const actionMutation = useMutation({
    mutationFn: (action: 'confirm' | 'complete' | 'cancel') =>
      api.patch(`/healthcare/appointments/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] })
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar consulta'),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!appointment) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Consulta não encontrada</div>
  }

  const status: string = appointment.status

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Consulta</h1>
        <Badge variant={statusVariants[status] ?? 'default'}>
          {statusLabels[status] ?? status}
        </Badge>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Detalhes da Consulta</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Paciente</dt>
                <dd className="font-medium">
                  {appointment.patient
                    ? (
                      <button
                        className="text-primary hover:underline"
                        onClick={() => router.push(`/dashboard/patients/${appointment.patient.id}`)}
                      >
                        {appointment.patient.name}
                      </button>
                    )
                    : appointment.patientId}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Médico</dt>
                <dd>{appointment.doctorName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Especialidade</dt>
                <dd>{appointment.specialty}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Data e Hora</dt>
                <dd>{formatDate(appointment.date)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Motivo</dt>
                <dd>{appointment.reason}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Custo</dt>
                <dd className="font-semibold text-primary">{formatKwanza(appointment.cost)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <Badge variant={statusVariants[status] ?? 'default'}>
                    {statusLabels[status] ?? status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            {status === 'SCHEDULED' && (
              <Button
                className="w-full"
                onClick={() => actionMutation.mutate('confirm')}
                disabled={actionMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmar
              </Button>
            )}

            {(status === 'SCHEDULED' || status === 'CONFIRMED') && (
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => actionMutation.mutate('complete')}
                disabled={actionMutation.isPending}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Marcar como Concluída
              </Button>
            )}

            {(status === 'SCHEDULED' || status === 'CONFIRMED') && (
              <Button
                className="w-full"
                variant="danger"
                onClick={() => actionMutation.mutate('cancel')}
                disabled={actionMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}

            {(status === 'COMPLETED' || status === 'CANCELLED' || status === 'NO_SHOW') && (
              <p className="text-sm text-gray-500 text-center">
                Nenhuma ação disponível para consultas {statusLabels[status]?.toLowerCase()}.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

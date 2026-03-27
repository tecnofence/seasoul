'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, ClipboardCheck, CheckCircle2, XCircle, PlayCircle } from 'lucide-react'

const RESULT_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  APPROVED: 'success',
  APPROVED_WITH_CONDITIONS: 'warning',
  REJECTED: 'danger',
}

const RESULT_LABEL: Record<string, string> = {
  APPROVED: 'Aprovado',
  APPROVED_WITH_CONDITIONS: 'Aprovado c/ Condições',
  REJECTED: 'Reprovado',
}

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em Curso',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
}

export default function InspectionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => api.get(`/electrical/inspections/${id}`).then((r) => r.data.data),
  })

  const startMutation = useMutation({
    mutationFn: () => api.patch(`/electrical/inspections/${id}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspection', id] }),
  })

  const approveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/electrical/inspections/${id}/complete`, { result: 'APPROVED' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspection', id] }),
  })

  const rejectMutation = useMutation({
    mutationFn: () =>
      api.patch(`/electrical/inspections/${id}/complete`, { result: 'REJECTED' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inspection', id] }),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!inspection) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Registo não encontrado</div>
  }

  const status = inspection.status ?? 'SCHEDULED'
  const result = inspection.result

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold flex-1">Inspeção — {inspection.clientName}</h1>
        <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
        {result && (
          <Badge variant={RESULT_VARIANT[result] ?? 'default'}>
            {RESULT_LABEL[result] ?? result}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>
            <ClipboardCheck className="mr-2 inline h-5 w-5 text-primary" />
            Detalhes da Inspeção
          </CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Cliente</dt>
                <dd className="font-medium">{inspection.clientName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Endereço</dt>
                <dd>{inspection.address ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tipo de Inspeção</dt>
                <dd className="font-medium">{inspection.inspectionType ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Data Agendada</dt>
                <dd>{inspection.scheduledDate ? formatDate(inspection.scheduledDate) : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Inspetor</dt>
                <dd>{inspection.inspectorName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
                    {STATUS_LABEL[status] ?? status}
                  </Badge>
                </dd>
              </div>
              {result && (
                <div>
                  <dt className="text-gray-500">Resultado</dt>
                  <dd>
                    <Badge variant={RESULT_VARIANT[result] ?? 'default'}>
                      {RESULT_LABEL[result] ?? result}
                    </Badge>
                  </dd>
                </div>
              )}
            </dl>

            {inspection.notes && (
              <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
                <p className="mb-1 font-medium text-gray-500">Notas</p>
                <p className="whitespace-pre-wrap text-gray-700">{inspection.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            {status === 'SCHEDULED' && (
              <Button
                className="w-full"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                {startMutation.isPending ? 'A processar...' : 'Iniciar'}
              </Button>
            )}

            {status === 'IN_PROGRESS' && (
              <>
                <Button
                  className="w-full"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {approveMutation.isPending ? 'A processar...' : 'Aprovar'}
                </Button>
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => rejectMutation.mutate()}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {rejectMutation.isPending ? 'A processar...' : 'Rejeitar'}
                </Button>
              </>
            )}

            {(status === 'COMPLETED' || status === 'CANCELLED') && (
              <p className="text-center text-sm text-gray-400">Inspeção finalizada</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

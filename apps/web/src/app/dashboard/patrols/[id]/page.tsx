'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { ArrowLeft, Route, MapPin, Clock } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em Curso',
  COMPLETED: 'Concluída',
  INTERRUPTED: 'Interrompida',
}

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'danger'> = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  INTERRUPTED: 'danger',
}

export default function PatrolDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const id = params.id as string

  const [actionError, setActionError] = useState('')

  const { data: patrol, isLoading, isError } = useQuery({
    queryKey: ['patrol', id],
    queryFn: () => api.get(`/security/patrols/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['patrol', id] })

  const actionMutation = useMutation({
    mutationFn: (action: string) =>
      api.patch(`/security/patrols/${id}/${action}`),
    onSuccess: () => {
      setActionError('')
      invalidate()
    },
    onError: (err: any) =>
      setActionError(err.response?.data?.error || 'Erro ao executar acção'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !patrol) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Ronda não encontrada.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    )
  }

  const status = patrol.status ?? 'SCHEDULED'
  const checkpoints: any[] = Array.isArray(patrol.checkpoints)
    ? patrol.checkpoints
    : []
  const isPending = actionMutation.isPending

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <Route className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">
                Ronda — {patrol.guardName}
              </h1>
              <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
                {STATUS_LABEL[status] ?? status}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              {patrol.route ?? '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === 'SCHEDULED' && (
            <Button
              onClick={() => actionMutation.mutate('start')}
              disabled={isPending}
            >
              Iniciar Ronda
            </Button>
          )}
          {status === 'IN_PROGRESS' && (
            <>
              <Button
                onClick={() => actionMutation.mutate('complete')}
                disabled={isPending}
              >
                Concluir Ronda
              </Button>
              <Button
                variant="danger"
                onClick={() => actionMutation.mutate('interrupt')}
                disabled={isPending}
              >
                Interromper
              </Button>
            </>
          )}
        </div>
      </div>

      {actionError && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{actionError}</p>
      )}

      {/* Detalhes da ronda */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Informação da Ronda</CardTitle>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Guarda</dt>
                <dd className="text-sm font-medium">{patrol.guardName}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Rota</dt>
                <dd className="text-sm font-medium">{patrol.route ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  Início Agendado
                </dt>
                <dd className="text-sm font-medium">
                  {patrol.scheduledStart
                    ? formatDateTime(patrol.scheduledStart)
                    : '—'}
                </dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  Fim Agendado
                </dt>
                <dd className="text-sm font-medium">
                  {patrol.scheduledEnd
                    ? formatDateTime(patrol.scheduledEnd)
                    : '—'}
                </dd>
              </div>
              {patrol.startedAt && (
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-sm text-gray-500">Iniciada em</dt>
                  <dd className="text-sm font-medium">
                    {formatDateTime(patrol.startedAt)}
                  </dd>
                </div>
              )}
              {patrol.completedAt && (
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-sm text-gray-500">Concluída em</dt>
                  <dd className="text-sm font-medium">
                    {formatDateTime(patrol.completedAt)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Nº de Postos</dt>
                <dd className="text-sm font-medium">
                  {typeof patrol.checkpoints === 'number'
                    ? patrol.checkpoints
                    : checkpoints.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">Estado</dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
                    {STATUS_LABEL[status] ?? status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {patrol.notes && (
          <Card>
            <CardTitle className="mb-4">Observações</CardTitle>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-gray-700">
                {patrol.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabela de checkpoints detalhados */}
      {checkpoints.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Postos de Controlo ({checkpoints.length})</CardTitle>
          </div>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkpoints.map((cp: any, index: number) => (
                  <TableRow key={cp.id ?? index}>
                    <TableCell className="text-gray-500">{index + 1}</TableCell>
                    <TableCell className="font-medium">
                      {cp.location ?? cp.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {cp.time
                        ? formatDateTime(cp.time)
                        : cp.checkedAt
                        ? formatDateTime(cp.checkedAt)
                        : '—'}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {cp.notes ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

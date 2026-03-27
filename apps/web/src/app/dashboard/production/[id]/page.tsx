'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Play, Pause, CheckCircle, XCircle, Factory } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Produção',
  PAUSED: 'Pausado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING: 'default',
  IN_PROGRESS: 'info',
  PAUSED: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

const PRIORITY_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
}

export default function ProductionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: order, isLoading } = useQuery({
    queryKey: ['manufacturing', id],
    queryFn: () => api.get(`/manufacturing/${id}`).then((r) => r.data.data),
  })

  const actionMutation = useMutation({
    mutationFn: ({ endpoint }: { endpoint: string }) =>
      api.patch(`/manufacturing/${id}/${endpoint}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing', id] })
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar ordem'),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!order) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Ordem não encontrada</div>
  }

  const isPending = order.status === 'PENDING'
  const isInProgress = order.status === 'IN_PROGRESS'
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{order.productName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={PRIORITY_VARIANT[order.priority] ?? 'default'}>
            {PRIORITY_LABEL[order.priority] ?? order.priority}
          </Badge>
          <Badge variant={STATUS_VARIANT[order.status] ?? 'default'}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Badge>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Detalhes da Ordem</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Nº Ordem</dt>
                <dd className="font-mono font-medium">{order.orderNumber}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Produto</dt>
                <dd className="font-medium">{order.productName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Quantidade</dt>
                <dd className="font-medium">
                  {order.quantity} {order.unit}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Prioridade</dt>
                <dd>
                  <Badge variant={PRIORITY_VARIANT[order.priority] ?? 'default'}>
                    {PRIORITY_LABEL[order.priority] ?? order.priority}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Início Estimado</dt>
                <dd>{order.estimatedStart ? formatDate(order.estimatedStart) : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Fim Estimado</dt>
                <dd>{order.estimatedEnd ? formatDate(order.estimatedEnd) : '—'}</dd>
              </div>
              {order.actualStart && (
                <div>
                  <dt className="text-gray-500">Início Real</dt>
                  <dd>{formatDate(order.actualStart)}</dd>
                </div>
              )}
              {order.actualEnd && (
                <div>
                  <dt className="text-gray-500">Conclusão Real</dt>
                  <dd>{formatDate(order.actualEnd)}</dd>
                </div>
              )}
            </dl>

            {order.notes && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500">Notas</h4>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            {isPending && (
              <Button
                className="w-full"
                onClick={() => {
                  if (confirm('Iniciar a produção desta ordem?')) {
                    actionMutation.mutate({ endpoint: 'start' })
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar Produção
              </Button>
            )}

            {isInProgress && (
              <>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={() => {
                    if (confirm('Pausar esta ordem de produção?')) {
                      actionMutation.mutate({ endpoint: 'pause' })
                    }
                  }}
                  disabled={actionMutation.isPending}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar
                </Button>

                <Button
                  className="w-full"
                  onClick={() => {
                    if (confirm('Marcar esta ordem como concluída?')) {
                      actionMutation.mutate({ endpoint: 'complete' })
                    }
                  }}
                  disabled={actionMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Concluir
                </Button>
              </>
            )}

            {!isCancelled && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (confirm('Tem a certeza que quer cancelar esta ordem? Esta ação não pode ser revertida.')) {
                    actionMutation.mutate({ endpoint: 'cancel' })
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/dashboard/production')}
            >
              Voltar à Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

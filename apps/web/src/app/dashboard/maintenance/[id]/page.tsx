'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Wrench, CalendarClock, CheckCircle2, XCircle } from 'lucide-react'

const PRIORITY_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'danger'> = {
  LOW: 'default',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
}

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

const STATUS_VARIANT: Record<string, 'danger' | 'warning' | 'success' | 'default'> = {
  OPEN: 'danger',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
}

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Progresso',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
}

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => api.get(`/maintenance/${id}`).then((r) => r.data.data),
  })

  const startMutation = useMutation({
    mutationFn: () => api.patch(`/maintenance/${id}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  })

  const resolveMutation = useMutation({
    mutationFn: () => api.patch(`/maintenance/${id}/resolve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  })

  const closeMutation = useMutation({
    mutationFn: () => api.patch(`/maintenance/${id}/close`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!ticket) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Registo não encontrado</div>
  }

  const priority = ticket.priority ?? 'MEDIUM'
  const status = ticket.status ?? 'OPEN'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold flex-1">{ticket.title}</h1>
        <Badge variant={PRIORITY_VARIANT[priority] ?? 'default'}>
          {PRIORITY_LABEL[priority] ?? priority}
        </Badge>
        <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>
            <Wrench className="mr-2 inline h-5 w-5 text-primary" />
            Detalhes do Pedido
          </CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Título</dt>
                <dd className="font-medium">{ticket.title}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Quarto</dt>
                <dd className="font-medium">{ticket.room?.number ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Prioridade</dt>
                <dd>
                  <Badge variant={PRIORITY_VARIANT[priority] ?? 'default'}>
                    {PRIORITY_LABEL[priority] ?? priority}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Estado</dt>
                <dd>
                  <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
                    {STATUS_LABEL[status] ?? status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">
                  <CalendarClock className="mr-1 inline h-4 w-4" />
                  Criado em
                </dt>
                <dd>{formatDateTime(ticket.createdAt)}</dd>
              </div>
              {ticket.resolvedAt && (
                <div>
                  <dt className="text-gray-500">
                    <CheckCircle2 className="mr-1 inline h-4 w-4 text-green-500" />
                    Resolvido em
                  </dt>
                  <dd>{formatDate(ticket.resolvedAt)}</dd>
                </div>
              )}
            </dl>

            {ticket.description && (
              <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
                <p className="mb-1 font-medium text-gray-500">Descrição</p>
                <p className="whitespace-pre-wrap text-gray-700">{ticket.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            {status === 'OPEN' && (
              <Button
                className="w-full"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                <Wrench className="mr-2 h-4 w-4" />
                {startMutation.isPending ? 'A processar...' : 'Atribuir / Iniciar'}
              </Button>
            )}

            {status === 'IN_PROGRESS' && (
              <Button
                className="w-full"
                onClick={() => resolveMutation.mutate()}
                disabled={resolveMutation.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {resolveMutation.isPending ? 'A processar...' : 'Marcar como Resolvido'}
              </Button>
            )}

            {status === 'RESOLVED' && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {closeMutation.isPending ? 'A processar...' : 'Fechar'}
              </Button>
            )}

            {status === 'CLOSED' && (
              <p className="text-center text-sm text-gray-400">Pedido encerrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

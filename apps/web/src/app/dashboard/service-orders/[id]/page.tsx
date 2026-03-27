'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Play, CheckCircle, XCircle } from 'lucide-react'

const statusVariant: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Curso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const typeLabel: Record<string, string> = {
  ROOM_SERVICE: 'Room Service',
  HOUSEKEEPING: 'Housekeeping',
  SPA: 'SPA',
  RESTAURANT: 'Restaurante',
  MAINTENANCE: 'Manutenção',
  OTHER: 'Outro',
}

export default function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['service-order', id],
    queryFn: () => api.get(`/service-orders/${id}`).then((r) => r.data.data),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/service-orders/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service-order', id] }),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!order) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Pedido não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Pedido de Serviço</h1>
        <Badge variant={statusVariant[order.status] ?? 'default'} className="text-sm">
          {statusLabel[order.status] ?? order.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Detalhes</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Tipo</dt>
                <dd className="font-medium">{typeLabel[order.type] ?? order.type}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Hóspede</dt>
                <dd className="font-medium">{order.reservation?.guestName ?? order.guest?.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Quarto</dt>
                <dd>#{order.reservation?.room?.number ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Telefone</dt>
                <dd>{order.guest?.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Data do Pedido</dt>
                <dd>{formatDateTime(order.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Agendado Para</dt>
                <dd>{order.scheduledAt ? formatDateTime(order.scheduledAt) : 'Imediato'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Valor Total</dt>
                <dd className="font-semibold text-primary">{formatKwanza(order.totalAmount)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Resort</dt>
                <dd>{order.resort?.name ?? '—'}</dd>
              </div>
            </dl>

            {order.notes && (
              <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
                <span className="font-medium text-gray-500">Notas: </span>{order.notes}
              </div>
            )}

            {/* Itens do pedido */}
            {order.items && (order.items as any[]).length > 0 && (
              <div className="mt-6">
                <h4 className="mb-2 text-sm font-medium text-gray-500">Itens</h4>
                <ul className="divide-y rounded border">
                  {(order.items as any[]).map((item: any, i: number) => (
                    <li key={i} className="flex items-center justify-between p-3 text-sm">
                      <span>{item.name ?? item.description ?? `Item ${i + 1}`}</span>
                      <div className="flex gap-4 text-gray-600">
                        <span>x{item.qty ?? item.quantity ?? 1}</span>
                        {item.price && <span className="font-medium">{formatKwanza(item.price)}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            {order.status === 'PENDING' && (
              <Button
                className="w-full"
                onClick={() => statusMutation.mutate('IN_PROGRESS')}
                disabled={statusMutation.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar
              </Button>
            )}

            {order.status === 'IN_PROGRESS' && (
              <Button
                className="w-full"
                onClick={() => statusMutation.mutate('COMPLETED')}
                disabled={statusMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            )}

            {!['COMPLETED', 'CANCELLED'].includes(order.status) && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (confirm('Tem a certeza que quer cancelar este pedido?')) {
                    statusMutation.mutate('CANCELLED')
                  }
                }}
                disabled={statusMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}

            {['COMPLETED', 'CANCELLED'].includes(order.status) && (
              <p className="text-center text-sm text-gray-400">Pedido finalizado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

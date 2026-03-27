'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Calendar,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
} from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PICKED_UP: 'Recolhido',
  IN_TRANSIT: 'Em Trânsito',
  DELIVERED: 'Entregue',
  RETURNED: 'Devolvido',
  CANCELLED: 'Cancelado',
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING: 'info',
  PICKED_UP: 'info',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  RETURNED: 'default',
  CANCELLED: 'danger',
}

const SHIPMENT_TYPE_LABEL: Record<string, string> = {
  STANDARD: 'Standard',
  EXPRESS: 'Expresso',
  FREIGHT: 'Carga',
  INTERNATIONAL: 'Internacional',
}

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: shipment, isLoading } = useQuery({
    queryKey: ['shipment', id],
    queryFn: () => api.get(`/logistics/${id}`).then((r) => r.data.data),
  })

  const actionMutation = useMutation({
    mutationFn: (action: string) => api.patch(`/logistics/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment', id] })
      setError('')
    },
    onError: (err: any) =>
      setError(err.response?.data?.error || 'Erro ao atualizar estado do envio'),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        A carregar...
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Envio não encontrado
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold font-mono">{shipment.trackingCode}</h1>
          <p className="text-sm text-gray-500">
            {shipment.origin} → {shipment.destination}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[shipment.status] ?? 'default'}>
          {STATUS_LABEL[shipment.status] ?? shipment.status}
        </Badge>
      </div>

      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Detalhes do Envio</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Código de Rastreio</dt>
                <dd className="font-mono font-medium">{shipment.trackingCode}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tipo de Envio</dt>
                <dd className="font-medium">
                  {SHIPMENT_TYPE_LABEL[shipment.shipmentType] ?? shipment.shipmentType}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Origem</dt>
                <dd className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {shipment.origin}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Destino</dt>
                <dd className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {shipment.destination}
                </dd>
              </div>
              {shipment.weight != null && (
                <div>
                  <dt className="text-gray-500">Peso</dt>
                  <dd className="font-medium">{shipment.weight} kg</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Entrega Prevista</dt>
                <dd className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {shipment.estimatedDelivery
                    ? formatDate(shipment.estimatedDelivery)
                    : '—'}
                </dd>
              </div>
              {shipment.actualDelivery && (
                <div>
                  <dt className="text-gray-500">Entrega Real</dt>
                  <dd className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(shipment.actualDelivery)}
                  </dd>
                </div>
              )}
            </dl>

            {shipment.notes && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500">Notas</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {shipment.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            {shipment.status === 'PENDING' && (
              <Button
                className="w-full"
                onClick={() => {
                  if (confirm('Confirmar recolha deste envio?')) {
                    actionMutation.mutate('pickup')
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <Package className="mr-2 h-4 w-4" />
                Recolher
              </Button>
            )}

            {shipment.status === 'PICKED_UP' && (
              <Button
                className="w-full"
                onClick={() => {
                  if (confirm('Marcar envio como em trânsito?')) {
                    actionMutation.mutate('transit')
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <Truck className="mr-2 h-4 w-4" />
                Em Trânsito
              </Button>
            )}

            {shipment.status === 'IN_TRANSIT' && (
              <Button
                className="w-full"
                onClick={() => {
                  if (confirm('Confirmar entrega deste envio?')) {
                    actionMutation.mutate('deliver')
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar Entregue
              </Button>
            )}

            {shipment.status !== 'CANCELLED' && shipment.status !== 'DELIVERED' && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (
                    confirm(
                      'Tem a certeza que quer cancelar este envio? Esta ação não pode ser revertida.'
                    )
                  ) {
                    actionMutation.mutate('cancel')
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
              onClick={() => router.push('/dashboard/shipments')}
            >
              Voltar à Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

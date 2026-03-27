'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Activity, Users, Clock, MapPin, Pencil, X, Check } from 'lucide-react'

const BOOKING_STATUS_VARIANT: Record<string, 'warning' | 'success' | 'danger' | 'info' | 'default'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
}

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editPrice, setEditPrice] = useState('')
  const [editMaxParticipants, setEditMaxParticipants] = useState('')

  const { data: activity, isLoading } = useQuery({
    queryKey: ['activity', id],
    queryFn: () => api.get(`/activities/${id}`).then((r) => r.data.data),
  })

  const updateMutation = useMutation({
    mutationFn: (body: { price?: number; maxParticipants?: number }) =>
      api.put(`/activities/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity', id] })
      setIsEditing(false)
    },
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!activity) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Registo não encontrado</div>
  }

  const bookings: any[] = activity.bookings ?? []

  function handleEditOpen() {
    setEditPrice(String(activity.price ?? ''))
    setEditMaxParticipants(String(activity.maxParticipants ?? ''))
    setIsEditing(true)
  }

  function handleEditSave() {
    const body: { price?: number; maxParticipants?: number } = {}
    if (editPrice !== '') body.price = Number(editPrice)
    if (editMaxParticipants !== '') body.maxParticipants = Number(editMaxParticipants)
    updateMutation.mutate(body)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold flex-1">{activity.name}</h1>
        {!isEditing && (
          <Button variant="secondary" onClick={handleEditOpen}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>
            <Activity className="mr-2 inline h-5 w-5 text-primary" />
            Detalhes da Atividade
          </CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Nome</dt>
                <dd className="font-medium">{activity.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tipo</dt>
                <dd>{activity.activityType ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">
                  <Clock className="mr-1 inline h-4 w-4" />
                  Duração
                </dt>
                <dd>{activity.duration != null ? `${activity.duration}h` : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">
                  <MapPin className="mr-1 inline h-4 w-4" />
                  Localização
                </dt>
                <dd>{activity.location ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Preço</dt>
                <dd className="font-semibold text-primary">{formatKwanza(activity.price)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">
                  <Users className="mr-1 inline h-4 w-4" />
                  Máx. Participantes
                </dt>
                <dd>{activity.maxParticipants ?? '—'}</dd>
              </div>
            </dl>

            {activity.description && (
              <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
                <p className="mb-1 font-medium text-gray-500">Descrição</p>
                <p className="whitespace-pre-wrap text-gray-700">{activity.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {isEditing ? (
          <Card>
            <CardTitle>Editar</CardTitle>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Preço (AOA)
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="Ex: 5000"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Máx. Participantes
                </label>
                <input
                  type="number"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={editMaxParticipants}
                  onChange={(e) => setEditMaxParticipants(e.target.value)}
                  placeholder="Ex: 20"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleEditSave}
                  disabled={updateMutation.isPending}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? 'A guardar...' : 'Guardar'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  disabled={updateMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardTitle>Resumo</CardTitle>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Reservas</dt>
                  <dd className="font-medium">{bookings.length}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-gray-500">Confirmadas</dt>
                  <dd className="text-green-600 font-medium">
                    {bookings.filter((b: any) => b.status === 'CONFIRMED').length}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Preço</dt>
                  <dd className="font-semibold text-primary">{formatKwanza(activity.price)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      {bookings.length > 0 && (
        <Card>
          <CardTitle>
            <Users className="mr-2 inline h-5 w-5 text-primary" />
            Reservas ({bookings.length})
          </CardTitle>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">Cliente</th>
                    <th className="pb-2 font-medium">Data</th>
                    <th className="pb-2 text-center font-medium">Participantes</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking: any, i: number) => (
                    <tr key={booking.id ?? i}>
                      <td className="py-2 font-medium">{booking.clientName ?? '—'}</td>
                      <td className="py-2">{booking.date ? formatDate(booking.date) : '—'}</td>
                      <td className="py-2 text-center">{booking.participants ?? '—'}</td>
                      <td className="py-2">
                        <Badge variant={BOOKING_STATUS_VARIANT[booking.status] ?? 'default'}>
                          {BOOKING_STATUS_LABEL[booking.status] ?? booking.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-right font-medium text-primary">
                        {formatKwanza(booking.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, LogIn, LogOut, X } from 'lucide-react'

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  CONFIRMED: 'info',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'default',
  CANCELLED: 'danger',
  NO_SHOW: 'warning',
}

const statusLabel: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Check-in',
  CHECKED_OUT: 'Check-out',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No-show',
}

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => api.get(`/reservations/${id}`).then((r) => r.data.data),
  })

  const checkInMutation = useMutation({
    mutationFn: () => api.patch(`/reservations/${id}/check-in`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservation', id] }),
  })

  const checkOutMutation = useMutation({
    mutationFn: () => api.patch(`/reservations/${id}/check-out`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservation', id] }),
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/reservations/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservation', id] }),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!reservation) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Reserva não encontrada</div>
  }

  const r = reservation

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Reserva — {r.guestName}</h1>
        <Badge variant={statusVariant[r.status] ?? 'default'} className="text-sm">
          {statusLabel[r.status] ?? r.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Detalhes</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Hóspede</dt>
                <dd className="font-medium">{r.guestName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd>{r.guestEmail}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Telefone</dt>
                <dd>{r.guestPhone}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Quarto</dt>
                <dd>#{r.room?.number} ({r.room?.type})</dd>
              </div>
              <div>
                <dt className="text-gray-500">Check-in</dt>
                <dd>{formatDateTime(r.checkIn)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Check-out</dt>
                <dd>{formatDateTime(r.checkOut)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Noites</dt>
                <dd>{r.nights}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Adultos / Crianças</dt>
                <dd>{r.adults} / {r.children}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Valor Total</dt>
                <dd className="font-semibold text-primary">{formatKwanza(r.totalAmount)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Depósito Pago</dt>
                <dd>{formatKwanza(r.depositPaid)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Resort</dt>
                <dd>{r.resort?.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Fonte</dt>
                <dd>{r.bookingSource}</dd>
              </div>
            </dl>
            {r.notes && (
              <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
                <span className="font-medium text-gray-500">Notas: </span>{r.notes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            {r.status === 'CONFIRMED' && (
              <Button
                className="w-full"
                onClick={() => checkInMutation.mutate()}
                disabled={checkInMutation.isPending}
              >
                <LogIn className="mr-2 h-4 w-4" />
                {checkInMutation.isPending ? 'A processar...' : 'Efetuar Check-in'}
              </Button>
            )}

            {r.status === 'CHECKED_IN' && (
              <Button
                className="w-full"
                onClick={() => checkOutMutation.mutate()}
                disabled={checkOutMutation.isPending}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {checkOutMutation.isPending ? 'A processar...' : 'Efetuar Check-out'}
              </Button>
            )}

            {!['CHECKED_OUT', 'CANCELLED'].includes(r.status) && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (confirm('Tem a certeza que quer cancelar esta reserva?')) {
                    cancelMutation.mutate()
                  }
                }}
                disabled={cancelMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar Reserva
              </Button>
            )}

            {['CHECKED_OUT', 'CANCELLED'].includes(r.status) && (
              <p className="text-center text-sm text-gray-400">Reserva finalizada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendas associadas */}
      {r.sales?.length > 0 && (
        <Card>
          <CardTitle>Vendas Associadas</CardTitle>
          <CardContent>
            <ul className="divide-y">
              {r.sales.map((sale: any) => (
                <li key={sale.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{formatDateTime(sale.createdAt)}</span>
                  <span className="font-medium">{formatKwanza(sale.totalAmount)}</span>
                  <Badge variant={sale.status === 'INVOICED' ? 'success' : 'warning'}>{sale.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

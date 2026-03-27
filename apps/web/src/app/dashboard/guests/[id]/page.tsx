'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'

const statusLabel: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Check-in',
  CHECKED_OUT: 'Check-out',
  CANCELLED: 'Cancelada',
}

export default function GuestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: guest, isLoading } = useQuery({
    queryKey: ['guest', id],
    queryFn: () => api.get(`/guest/admin/${id}`).then((r) => r.data.data),
  })

  if (isLoading) return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  if (!guest) return <div className="flex h-64 items-center justify-center text-gray-500">Hóspede não encontrado</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></button>
        <h1 className="text-2xl font-bold">{guest.name}</h1>
      </div>

      <Card>
        <CardTitle>Dados Pessoais</CardTitle>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-gray-500">Nome</dt><dd className="font-medium">{guest.name}</dd></div>
            <div><dt className="text-gray-500">Email</dt><dd>{guest.email}</dd></div>
            <div><dt className="text-gray-500">Telefone</dt><dd>{guest.phone ?? '—'}</dd></div>
            <div><dt className="text-gray-500">País</dt><dd>{guest.country ?? '—'}</dd></div>
            <div><dt className="text-gray-500">NIF</dt><dd>{guest.nif ?? '—'}</dd></div>
            <div><dt className="text-gray-500">Registado em</dt><dd>{formatDateTime(guest.createdAt)}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {/* Reservas do hóspede */}
      {guest.reservations?.length > 0 && (
        <Card>
          <CardTitle>Reservas</CardTitle>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Quarto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guest.reservations.map((r: any) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/reservations/${r.id}`)}>
                    <TableCell>{formatDate(r.checkIn)}</TableCell>
                    <TableCell>{formatDate(r.checkOut)}</TableCell>
                    <TableCell>#{r.room?.number ?? '—'}</TableCell>
                    <TableCell className="font-medium">{formatKwanza(r.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'CHECKED_IN' ? 'success' : r.status === 'CANCELLED' ? 'danger' : 'info'}>
                        {statusLabel[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reviews */}
      {guest.reviews?.length > 0 && (
        <Card>
          <CardTitle>Avaliações</CardTitle>
          <CardContent>
            <ul className="space-y-3">
              {guest.reviews.map((review: any) => (
                <li key={review.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.comment && <p className="mt-1 text-sm text-gray-600">{review.comment}</p>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

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

export default function ServiceOrdersPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['service-orders', page, status],
    queryFn: () =>
      api.get('/service-orders', { params: { page, limit: 20, status: status || undefined } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Pedidos de Serviço</h1>
        <div className="flex gap-2">
          {['', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((s) => (
            <Button
              key={s}
              variant={status === s ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => { setStatus(s); setPage(1) }}
            >
              {s ? statusLabel[s] : 'Todos'}
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Hóspede</TableHead>
                <TableHead>Quarto</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((order: any) => (
                <TableRow key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/service-orders/${order.id}`)}>
                  <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                  <TableCell>{typeLabel[order.type] ?? order.type}</TableCell>
                  <TableCell className="font-medium">{order.reservation?.guestName ?? order.guest?.name ?? '—'}</TableCell>
                  <TableCell>#{order.reservation?.room?.number ?? '—'}</TableCell>
                  <TableCell>{formatKwanza(order.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[order.status] ?? 'default'}>
                      {statusLabel[order.status] ?? order.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">Sem pedidos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span className="text-sm text-gray-600">Página {page} de {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>Seguinte</Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

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

export default function ReservationsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', page, search],
    queryFn: () =>
      api.get('/reservations', { params: { page, limit: 20, search: search || undefined } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reservas</h1>
        <Link href="/dashboard/reservations/new">
          <Button>Nova Reserva</Button>
        </Link>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Pesquisar por nome, email ou telefone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-md"
        />
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-gray-500">A carregar...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hóspede</TableHead>
                <TableHead>Quarto</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Noites</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((r: any) => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => window.location.href = `/dashboard/reservations/${r.id}`}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{r.guestName}</p>
                      <p className="text-xs text-gray-500">{r.guestEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{r.room?.number} ({r.room?.type})</TableCell>
                  <TableCell>{formatDate(r.checkIn)}</TableCell>
                  <TableCell>{formatDate(r.checkOut)}</TableCell>
                  <TableCell>{r.nights}</TableCell>
                  <TableCell>{formatKwanza(r.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status] ?? 'default'}>
                      {statusLabel[r.status] ?? r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    Sem reservas encontradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {page} de {data.totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Seguinte
          </Button>
        </div>
      )}
    </div>
  )
}

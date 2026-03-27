'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const statusVariant: Record<string, 'warning' | 'info' | 'success' | 'danger'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  RESOLVED: 'success',
  CLOSED: 'danger',
}

const statusLabel: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Curso',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
}

const priorityVariant: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  CRITICAL: 'danger',
  HIGH: 'warning',
  MEDIUM: 'info',
  LOW: 'default',
}

export default function MaintenancePage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['maintenance', page, status],
    queryFn: () =>
      api.get('/maintenance', { params: { page, limit: 20, status: status || undefined } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Manutenção</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/maintenance/new">
            <Button>Novo Ticket</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map((s) => (
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

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Quarto</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((ticket: any) => (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/maintenance/${ticket.id}`)}>
                  <TableCell>{formatDateTime(ticket.createdAt)}</TableCell>
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                  <TableCell>#{ticket.room?.number ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={priorityVariant[ticket.priority] ?? 'default'}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[ticket.status] ?? 'default'}>
                      {statusLabel[ticket.status] ?? ticket.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">Sem tickets</TableCell>
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

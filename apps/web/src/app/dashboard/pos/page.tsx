'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const statusVariant: Record<string, 'success' | 'warning' | 'danger'> = {
  PENDING: 'warning',
  INVOICED: 'success',
  CANCELLED: 'danger',
}

export default function PosPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['sales', page],
    queryFn: () => api.get('/pos', { params: { page, limit: 20 } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ponto de Venda</h1>
        <Link href="/dashboard/pos/new">
          <Button>Nova Venda</Button>
        </Link>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>IVA</TableHead>
                <TableHead>Fatura</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((sale: any) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
                  <TableCell>{sale.items?.length ?? 0} itens</TableCell>
                  <TableCell>{sale.paymentMethod}</TableCell>
                  <TableCell className="font-medium">{formatKwanza(sale.totalAmount)}</TableCell>
                  <TableCell>{formatKwanza(sale.taxAmount)}</TableCell>
                  <TableCell>{sale.invoiceNumber ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[sale.status] ?? 'default'}>
                      {sale.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">Sem vendas</TableCell>
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

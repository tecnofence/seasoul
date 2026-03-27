'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default function TariffsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['tariffs', page],
    queryFn: () => api.get('/tariffs', { params: { page, limit: 20 } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tarifas</h1>
        <Link href="/dashboard/tariffs/new">
          <Button>Nova Tarifa</Button>
        </Link>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resort</TableHead>
                <TableHead>Tipo de Quarto</TableHead>
                <TableHead>Válido De</TableHead>
                <TableHead>Válido Até</TableHead>
                <TableHead>Preço/Noite</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((tariff: any) => (
                <TableRow key={tariff.id}>
                  <TableCell>{tariff.resort?.name ?? '—'}</TableCell>
                  <TableCell className="font-medium">{tariff.roomType}</TableCell>
                  <TableCell>{formatDate(tariff.validFrom)}</TableCell>
                  <TableCell>{formatDate(tariff.validUntil)}</TableCell>
                  <TableCell className="font-semibold text-primary">{formatKwanza(tariff.pricePerNight)}</TableCell>
                  <TableCell>
                    <Badge variant={tariff.active ? 'success' : 'danger'}>
                      {tariff.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">Sem tarifas</TableCell>
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

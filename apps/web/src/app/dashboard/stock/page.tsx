'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default function StockPage() {
  const [page, setPage] = useState(1)
  const [lowStock, setLowStock] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['stock', page, lowStock],
    queryFn: () =>
      api.get('/stock', { params: { page, limit: 20, lowStock: lowStock || undefined } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock</h1>
        <Button
          variant={lowStock ? 'danger' : 'secondary'}
          size="sm"
          onClick={() => { setLowStock(!lowStock); setPage(1) }}
        >
          {lowStock ? 'Mostrar Todos' : 'Stock Baixo'}
        </Button>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Qty Atual</TableHead>
                <TableHead>Qty Mínima</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.department}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>{parseFloat(item.currentQty)}</TableCell>
                  <TableCell>{parseFloat(item.minQty)}</TableCell>
                  <TableCell>
                    <Badge variant={item.isLow ? 'danger' : 'success'}>
                      {item.isLow ? 'Baixo' : 'OK'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">Sem itens</TableCell>
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

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const typeLabel: Record<string, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Saída',
  BREAK_START: 'Início Pausa',
  BREAK_END: 'Fim Pausa',
}

export default function AttendancePage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', page],
    queryFn: () => api.get('/attendance', { params: { page, limit: 30 } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Assiduidade</h1>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>GPS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.employee?.name}</TableCell>
                  <TableCell>{r.employee?.department}</TableCell>
                  <TableCell>
                    <Badge variant={r.type === 'ENTRY' ? 'success' : r.type === 'EXIT' ? 'danger' : 'info'}>
                      {typeLabel[r.type] ?? r.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateTime(r.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={r.validGps ? 'success' : 'warning'}>
                      {r.validGps ? 'Válido' : 'Fora'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">Sem registos</TableCell>
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

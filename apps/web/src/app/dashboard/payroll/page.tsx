'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

export default function PayrollPage() {
  const [page, setPage] = useState(1)
  const now = new Date()
  const [month] = useState(now.getMonth() + 1)
  const [year] = useState(now.getFullYear())

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', page, month, year],
    queryFn: () =>
      api.get('/payroll', { params: { page, limit: 20, month, year } }).then((r) => r.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Salários — {String(month).padStart(2, '0')}/{year}
        </h1>
      </div>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center text-gray-500">A carregar...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Salário Base</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Faltas</TableHead>
                <TableHead>Líquido</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.data?.map((p: any) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.employee?.name}</TableCell>
                  <TableCell>{p.employee?.department}</TableCell>
                  <TableCell>{formatKwanza(p.baseSalary)}</TableCell>
                  <TableCell>{parseFloat(p.hoursWorked)}h</TableCell>
                  <TableCell>{parseFloat(p.overtimeHours)}h</TableCell>
                  <TableCell>{p.absenceDays}d</TableCell>
                  <TableCell className="font-semibold">{formatKwanza(p.netSalary)}</TableCell>
                  <TableCell>
                    <Badge variant={p.processed ? 'success' : 'warning'}>
                      {p.processed ? 'Processado' : 'Pendente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.data?.length && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    Sem folhas de salário para este período
                  </TableCell>
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

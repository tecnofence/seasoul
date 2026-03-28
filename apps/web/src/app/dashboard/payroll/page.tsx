'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Banknote, ChevronLeft, ChevronRight, Users, CheckCircle2,
  Clock, TrendingUp, FileText, Play,
} from 'lucide-react'

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function PayrollPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', page, month, year],
    queryFn: () => api.get('/payroll', { params: { page, limit: 20, month, year } }).then((r) => r.data),
  })

  const { data: summaryData } = useQuery({
    queryKey: ['payroll-summary', month, year],
    queryFn: () =>
      api.get('/payroll/summary', { params: { month, year } }).then((r) => r.data.data).catch(() => null),
  })

  const processMutation = useMutation({
    mutationFn: (id: string) => api.post(`/payroll/${id}/process`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  })

  const processAllMutation = useMutation({
    mutationFn: () => api.post('/payroll/process-all', { month, year }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll'] }),
  })

  const payroll: any[] = data?.data ?? []
  const totalPages: number = data?.totalPages ?? 1
  const totalCount: number = data?.total ?? payroll.length

  const processed = payroll.filter((p) => p.processed).length
  const pending = payroll.filter((p) => !p.processed).length
  const totalNet = payroll.reduce((sum, p) => sum + parseFloat(p.netSalary ?? 0), 0)
  const totalGross = payroll.reduce((sum, p) => sum + parseFloat(p.grossSalary ?? p.baseSalary ?? 0), 0)

  const navMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setMonth(m)
    setYear(y)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Folha de Salários</h1>
          <p className="text-sm text-gray-500">Processamento e gestão de remunerações</p>
        </div>
        <div className="flex items-center gap-2">
          {pending > 0 && (
            <Button
              variant="outline"
              onClick={() => processAllMutation.mutate()}
              disabled={processAllMutation.isPending}
            >
              <Play className="mr-2 h-4 w-4" />
              {processAllMutation.isPending ? 'A processar...' : `Processar Todos (${pending})`}
            </Button>
          )}
          <Button onClick={() => router.push('/dashboard/payroll/new')}>
            <FileText className="mr-2 h-4 w-4" /> Gerar Folha
          </Button>
        </div>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <button
          onClick={() => navMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{MONTHS[month - 1]} {year}</p>
          <p className="text-xs text-gray-400">{totalCount} registos</p>
        </div>
        <button
          onClick={() => navMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
          disabled={month === now.getMonth() + 1 && year === now.getFullYear()}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Colaboradores"
          value={totalCount}
          icon={<Users className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Processados"
          value={processed}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          description={pending > 0 ? `${pending} pendentes` : 'Todos processados'}
        />
        <StatCard
          title="Total Bruto"
          value={formatKwanza(summaryData?.totalGross ?? totalGross)}
          icon={<Banknote className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Total Líquido"
          value={formatKwanza(summaryData?.totalNet ?? totalNet)}
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          description="Após impostos e descontos"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Colaborador</th>
                <th className="px-5 py-3">Departamento</th>
                <th className="px-5 py-3 text-right">Salário Base</th>
                <th className="px-5 py-3 text-center">Horas</th>
                <th className="px-5 py-3 text-center">Overtime</th>
                <th className="px-5 py-3 text-center">Faltas</th>
                <th className="px-5 py-3 text-right">Bruto</th>
                <th className="px-5 py-3 text-right">Líquido</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payroll.map((p: any) => (
                <tr
                  key={p.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/dashboard/payroll/${p.id}`)}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(p.employee?.name ?? p.employeeName ?? '?')[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{p.employee?.name ?? p.employeeName ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {p.employee?.department ?? p.department ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">
                    {formatKwanza(parseFloat(p.baseSalary ?? 0))}
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600">
                    {parseFloat(p.hoursWorked ?? 0).toFixed(0)}h
                  </td>
                  <td className="px-5 py-3 text-center">
                    {parseFloat(p.overtimeHours ?? 0) > 0 ? (
                      <span className="text-amber-600">{parseFloat(p.overtimeHours).toFixed(1)}h</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {p.absenceDays > 0 ? (
                      <span className="text-red-600">{p.absenceDays}d</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {formatKwanza(parseFloat(p.grossSalary ?? p.baseSalary ?? 0))}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {formatKwanza(parseFloat(p.netSalary ?? 0))}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={p.processed ? 'success' : 'warning'}>
                      {p.processed ? 'Processado' : 'Pendente'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {!p.processed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-primary"
                        onClick={() => processMutation.mutate(p.id)}
                        disabled={processMutation.isPending}
                      >
                        <Play className="mr-1 h-3 w-3" /> Processar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {payroll.length === 0 && (
            <div className="p-12 text-center">
              <Banknote className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Sem registos de salários para {MONTHS[month - 1]} {year}</p>
              <Button className="mt-4" onClick={() => router.push('/dashboard/payroll/new')}>
                <FileText className="mr-2 h-4 w-4" /> Gerar Folha de Salários
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Anterior</Button>
          <span className="px-2 text-sm text-gray-500">
            Página <span className="font-medium">{page}</span> de <span className="font-medium">{totalPages}</span>
          </span>
          <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Seguinte</Button>
        </div>
      )}
    </div>
  )
}

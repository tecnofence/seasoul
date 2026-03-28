'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Banknote, Users, AlertCircle, CheckCircle2, Play } from 'lucide-react'

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function NewPayrollPage() {
  const router = useRouter()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [generated, setGenerated] = useState(false)

  const { data: employeesData } = useQuery({
    queryKey: ['hr-employees'],
    queryFn: () => api.get('/hr', { params: { limit: 100, status: 'ACTIVE' } }).then((r) => r.data),
  })

  const employees: any[] = employeesData?.data ?? []

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post('/payroll/generate', { month, year }).then((r) => r.data),
    onSuccess: () => {
      setGenerated(true)
    },
  })

  const processAllMutation = useMutation({
    mutationFn: () => api.post('/payroll/process-all', { month, year }),
    onSuccess: () => router.push('/dashboard/payroll'),
  })

  const years = [now.getFullYear(), now.getFullYear() - 1]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerar Folha de Salários</h1>
          <p className="text-sm text-gray-500">Calcule automaticamente as remunerações do período selecionado</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Config */}
        <div className="space-y-4 lg:col-span-2">
          {/* Period selection */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">Período de Processamento</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Mês</label>
                <select
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Ano</label>
                <select
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">O que será calculado</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>Salário base × dias trabalhados (baseado em assiduidade)</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>Horas extra com 50% de acréscimo</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>Desconto por faltas não justificadas</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>Cálculo de IRT Angola (tabela progressiva)</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span>Desconto INSS (3% empregado, 8% empregador)</span>
              </div>
            </div>
          </div>

          {/* Employee preview */}
          {employees.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Colaboradores Elegíveis
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {employees.length} colaboradores
                </span>
              </div>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {employees.slice(0, 10).map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(e.name ?? '?')[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900">{e.name}</p>
                        <p className="text-[10px] text-gray-400">{e.department ?? e.position}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {formatKwanza(parseFloat(e.baseSalary ?? e.salary ?? 0))}
                    </span>
                  </div>
                ))}
                {employees.length > 10 && (
                  <p className="text-center text-xs text-gray-400">
                    + {employees.length - 10} mais colaboradores
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary + Actions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">Resumo</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-3">
                <Banknote className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-xs text-gray-500">Período</p>
                  <p className="font-bold text-gray-900">{MONTHS[month - 1]} {year}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Colaboradores</span>
                <span className="font-semibold">{employees.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tipo</span>
                <span className="font-semibold">Mensal</span>
              </div>
            </div>
          </div>

          {generateMutation.isError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Erro ao gerar folha. Verifique se já existe uma folha para este período.
            </div>
          )}

          {generated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Folha gerada com sucesso! Pode agora processá-la.
              </div>
              <Button
                className="w-full"
                onClick={() => processAllMutation.mutate()}
                disabled={processAllMutation.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                {processAllMutation.isPending ? 'A processar...' : 'Processar Todos os Salários'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/payroll')}>
                Ver Folha de Salários
              </Button>
            </div>
          ) : (
            <>
              <Button
                className="w-full"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || employees.length === 0}
              >
                <Users className="mr-2 h-4 w-4" />
                {generateMutation.isPending ? 'A calcular...' : 'Gerar Folha de Salários'}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.back()}>
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

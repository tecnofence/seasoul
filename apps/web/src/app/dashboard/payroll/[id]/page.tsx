'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Banknote, User, Building2 } from 'lucide-react'

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'info' | 'danger'> = {
  PENDING: 'warning',
  PROCESSED: 'success',
  PAID: 'info',
  CANCELLED: 'danger',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSED: 'Processado',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
}

const MONTH_LABELS = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: payroll, isLoading } = useQuery({
    queryKey: ['payroll', id],
    queryFn: () => api.get(`/payroll/${id}`).then((r) => r.data.data),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!payroll) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Registo não encontrado</div>
  }

  const status = payroll.status ?? 'PENDING'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            Processamento Salarial — {payroll.employeeName ?? payroll.employee?.name}
          </h1>
          <p className="text-sm text-gray-500">
            {payroll.month ? MONTH_LABELS[payroll.month] : '—'} {payroll.year}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
          {STATUS_LABEL[status] ?? status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>
            <User className="mr-2 inline h-5 w-5 text-primary" />
            Colaborador
          </CardTitle>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Nome</dt>
                <dd className="font-medium">{payroll.employeeName ?? payroll.employee?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">
                  <Building2 className="mr-1 inline h-4 w-4" />
                  Departamento
                </dt>
                <dd>{payroll.department ?? payroll.employee?.department ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Período</dt>
                <dd>
                  {payroll.month ? MONTH_LABELS[payroll.month] : '—'} / {payroll.year}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle>
            <Banknote className="mr-2 inline h-5 w-5 text-primary" />
            Detalhes Salariais
          </CardTitle>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Salário Base</dt>
                <dd className="font-medium">{formatKwanza(payroll.baseSalary)}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Horas Extra</dt>
                <dd>{payroll.overtimeHours != null ? `${payroll.overtimeHours}h` : '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Valor Horas Extra</dt>
                <dd className="text-green-700 font-medium">
                  {payroll.overtimeValue != null ? `+ ${formatKwanza(payroll.overtimeValue)}` : '—'}
                </dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Dias de Ausência</dt>
                <dd>{payroll.absenceDays != null ? `${payroll.absenceDays} dias` : '—'}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-gray-500">Dedução por Ausência</dt>
                <dd className="text-red-600 font-medium">
                  {payroll.absenceDeduction != null ? `- ${formatKwanza(payroll.absenceDeduction)}` : '—'}
                </dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-base font-semibold text-gray-900">Salário Líquido</dt>
                <dd className="text-base font-bold text-primary">{formatKwanza(payroll.netSalary)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

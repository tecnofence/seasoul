'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  User,
  Building2,
  Banknote,
  TrendingDown,
  CreditCard,
  Calendar,
  Printer,
  CheckCircle,
} from 'lucide-react'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<string, 'warning' | 'success' | 'info' | 'danger'> = {
  PENDING: 'warning',
  PROCESSED: 'info',
  PAID: 'success',
  CANCELLED: 'danger',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSED: 'Processado',
  PAID: 'Pago',
  CANCELLED: 'Cancelado',
}

const MONTH_LABELS = [
  '',
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  BANK_TRANSFER: 'Transferência Bancária',
  CASH: 'Numerário',
  CHECK: 'Cheque',
}

// ─── Row helper ──────────────────────────────────────────────────────────────

function LineRow({
  label,
  value,
  bold = false,
  color,
  prefix,
}: {
  label: string
  value: string | null | undefined
  bold?: boolean
  color?: string
  prefix?: string
}) {
  if (value == null) return null
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
        {label}
      </span>
      <span
        className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${color ?? 'text-gray-800'}`}
      >
        {prefix}{value}
      </span>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: payroll, isLoading } = useQuery({
    queryKey: ['payroll', id],
    queryFn: () => api.get(`/payroll/${id}`).then((r) => r.data.data),
  })

  const patchPayroll = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/payroll/${id}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payroll', id] }),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        A carregar folha de pagamento...
      </div>
    )
  }

  if (!payroll) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Registo não encontrado.
      </div>
    )
  }

  const status: string = payroll.status ?? 'PENDING'
  const employeeName = payroll.employeeName ?? payroll.employee?.name ?? '—'
  const department = payroll.department ?? payroll.employee?.department ?? '—'
  const position = payroll.position ?? payroll.employee?.position ?? '—'
  const employeeId = payroll.employeeCode ?? payroll.employee?.employeeId ?? payroll.employeeId ?? '—'

  // Earnings
  const baseSalary = payroll.baseSalary != null ? parseFloat(payroll.baseSalary) : null
  const overtimeValue = payroll.overtimeValue != null ? parseFloat(payroll.overtimeValue) : null
  const allowances = payroll.allowances != null ? parseFloat(payroll.allowances) : null
  const grossSalary =
    payroll.grossSalary != null
      ? parseFloat(payroll.grossSalary)
      : (baseSalary ?? 0) + (overtimeValue ?? 0) + (allowances ?? 0)

  // Deductions
  const inssRate = 0.03
  const inssDeduction =
    payroll.inssDeduction != null
      ? parseFloat(payroll.inssDeduction)
      : baseSalary != null
      ? baseSalary * inssRate
      : null
  const irtDeduction = payroll.irtDeduction != null ? parseFloat(payroll.irtDeduction) : null
  const otherDeductions =
    payroll.otherDeductions != null ? parseFloat(payroll.otherDeductions) : null
  const absenceDeduction =
    payroll.absenceDeduction != null ? parseFloat(payroll.absenceDeduction) : null
  const totalDeductions =
    payroll.totalDeductions != null
      ? parseFloat(payroll.totalDeductions)
      : (inssDeduction ?? 0) + (irtDeduction ?? 0) + (otherDeductions ?? 0) + (absenceDeduction ?? 0)

  const netSalary =
    payroll.netSalary != null
      ? parseFloat(payroll.netSalary)
      : grossSalary - totalDeductions

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-gray-700 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="truncate text-2xl font-bold text-gray-900">
            Folha de Pagamento — {employeeName}
          </h1>
          <p className="text-sm text-gray-500">
            {payroll.month ? MONTH_LABELS[payroll.month] : '—'} / {payroll.year ?? '—'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
            {STATUS_LABEL[status] ?? status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="print:hidden"
          >
            <Printer size={14} className="mr-1.5" />
            Imprimir Recibo
          </Button>
        </div>
      </div>

      {/* ── Main 2-column layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* ── LEFT column (col-span-3) ── */}
        <div className="space-y-5 lg:col-span-3">

          {/* Employee info */}
          <Card>
            <CardHeader>
              <CardTitle>
                <User className="mr-2 inline h-5 w-5 text-primary" />
                Colaborador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-0 divide-y divide-gray-100 text-sm">
                <LineRow label="Nome completo" value={employeeName} bold />
                <LineRow label="Função / Cargo" value={position} />
                <LineRow label="Departamento" value={department} />
                <LineRow label="Nº Colaborador" value={employeeId} />
              </dl>
            </CardContent>
          </Card>

          {/* Earnings */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Banknote className="mr-2 inline h-5 w-5 text-green-600" />
                Vencimentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-0">
                <LineRow
                  label="Salário Base"
                  value={baseSalary != null ? formatKwanza(baseSalary) : null}
                />
                {overtimeValue != null && (
                  <LineRow
                    label={`Horas Extra${payroll.overtimeHours != null ? ` (${payroll.overtimeHours}h)` : ''}`}
                    value={formatKwanza(overtimeValue)}
                    color="text-green-700"
                    prefix="+ "
                  />
                )}
                {allowances != null && allowances > 0 && (
                  <LineRow
                    label="Subsídios"
                    value={formatKwanza(allowances)}
                    color="text-green-700"
                    prefix="+ "
                  />
                )}
                {/* Individual allowance breakdown if available */}
                {Array.isArray(payroll.allowanceItems) &&
                  payroll.allowanceItems.map((item: { label: string; amount: number }, i: number) => (
                    <div key={i} className="flex justify-between border-b border-gray-100 py-2 pl-4 last:border-0">
                      <span className="text-xs text-gray-400">{item.label}</span>
                      <span className="text-xs text-green-700">+ {formatKwanza(item.amount)}</span>
                    </div>
                  ))}
                <div className="flex items-center justify-between border-t-2 border-gray-200 pt-3 mt-2">
                  <span className="font-semibold text-gray-900">TOTAL BRUTO</span>
                  <span className="font-bold text-gray-900">{formatKwanza(grossSalary)}</span>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <CardTitle>
                <TrendingDown className="mr-2 inline h-5 w-5 text-red-500" />
                Deduções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-0">
                {inssDeduction != null && (
                  <LineRow
                    label="INSS (3%)"
                    value={formatKwanza(inssDeduction)}
                    color="text-red-600"
                    prefix="- "
                  />
                )}
                {irtDeduction != null && (
                  <LineRow
                    label="IRT"
                    value={formatKwanza(irtDeduction)}
                    color="text-red-600"
                    prefix="- "
                  />
                )}
                {absenceDeduction != null && absenceDeduction > 0 && (
                  <LineRow
                    label={`Desconto por Faltas${payroll.absenceDays != null ? ` (${payroll.absenceDays}d)` : ''}`}
                    value={formatKwanza(absenceDeduction)}
                    color="text-red-600"
                    prefix="- "
                  />
                )}
                {otherDeductions != null && otherDeductions > 0 && (
                  <LineRow
                    label="Outras Deduções"
                    value={formatKwanza(otherDeductions)}
                    color="text-red-600"
                    prefix="- "
                  />
                )}
                <div className="flex items-center justify-between border-t-2 border-gray-200 pt-3 mt-2">
                  <span className="font-semibold text-gray-900">TOTAL DEDUÇÕES</span>
                  <span className="font-bold text-red-600">- {formatKwanza(totalDeductions)}</span>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Net salary — prominent */}
          <div className="rounded-xl bg-primary/10 px-6 py-5 flex items-center justify-between border border-primary/20">
            <div>
              <p className="text-sm font-medium text-primary/70">SALÁRIO LÍQUIDO</p>
              <p className="text-xs text-primary/50 mt-0.5">
                {payroll.month ? MONTH_LABELS[payroll.month] : '—'} / {payroll.year}
              </p>
            </div>
            <p className="text-3xl font-extrabold text-primary">
              {formatKwanza(netSalary)}
            </p>
          </div>
        </div>

        {/* ── RIGHT column (col-span-2) ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Processing card */}
          <Card>
            <CardHeader>
              <CardTitle>
                <CheckCircle className="mr-2 inline h-5 w-5 text-primary" />
                Processamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status === 'PENDING' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Esta folha ainda não foi processada. Reveja os valores antes de confirmar.
                  </p>
                  <Button
                    className="w-full"
                    onClick={() => patchPayroll.mutate({ processed: true })}
                    disabled={patchPayroll.isPending}
                  >
                    {patchPayroll.isPending ? 'A processar...' : 'Processar Pagamento'}
                  </Button>
                </div>
              )}

              {status === 'PROCESSED' && (
                <div className="space-y-3">
                  <div className="rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-700">
                    Pagamento processado. Aguarda confirmação de pagamento.
                  </div>
                  <Button
                    className="w-full"
                    onClick={() =>
                      patchPayroll.mutate({ paid: true, paidAt: new Date().toISOString() })
                    }
                    disabled={patchPayroll.isPending}
                  >
                    {patchPayroll.isPending ? 'A registar...' : 'Marcar como Pago'}
                  </Button>
                </div>
              )}

              {status === 'PAID' && (
                <div className="rounded-md bg-green-50 border border-green-200 px-4 py-4 text-center">
                  <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                  <p className="font-semibold text-green-800">Pagamento Confirmado</p>
                  {payroll.paidAt && (
                    <p className="mt-1 text-xs text-green-600">
                      {formatDateTime(payroll.paidAt)}
                    </p>
                  )}
                </div>
              )}

              {status === 'CANCELLED' && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  Esta folha de pagamento foi cancelada.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment method */}
          {payroll.paymentMethod && (
            <Card>
              <CardHeader>
                <CardTitle>
                  <CreditCard className="mr-2 inline h-5 w-5 text-primary" />
                  Método de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-gray-800">
                  {PAYMENT_METHOD_LABEL[payroll.paymentMethod] ?? payroll.paymentMethod}
                </p>
                {payroll.bankAccount && (
                  <p className="mt-1 text-xs text-gray-400">
                    Conta: {payroll.bankAccount}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reference period */}
          <Card>
            <CardHeader>
              <CardTitle>
                <Calendar className="mr-2 inline h-5 w-5 text-primary" />
                Período de Referência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-0 text-sm">
                {payroll.periodStart && (
                  <LineRow label="Início" value={formatDateTime(payroll.periodStart)} />
                )}
                {payroll.periodEnd && (
                  <LineRow label="Fim" value={formatDateTime(payroll.periodEnd)} />
                )}
                {payroll.workingDays != null && (
                  <LineRow label="Dias Úteis" value={`${payroll.workingDays} dias`} />
                )}
                {payroll.hoursWorked != null && (
                  <LineRow label="Horas Trabalhadas" value={`${parseFloat(payroll.hoursWorked)}h`} />
                )}
                {payroll.overtimeHours != null && (
                  <LineRow label="Horas Extra" value={`${payroll.overtimeHours}h`} />
                )}
                {payroll.absenceDays != null && (
                  <LineRow
                    label="Faltas"
                    value={`${payroll.absenceDays} dia${payroll.absenceDays !== 1 ? 's' : ''}`}
                    color={payroll.absenceDays > 0 ? 'text-red-600' : 'text-gray-800'}
                  />
                )}
              </dl>

              {!payroll.periodStart && !payroll.periodEnd && payroll.workingDays == null && (
                <p className="text-xs text-gray-400">
                  Período:{' '}
                  {payroll.month ? MONTH_LABELS[payroll.month] : '—'} / {payroll.year}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

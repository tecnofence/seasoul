'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  RefreshCw,
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'

// ─── Constants ────────────────────────────────────────────────────────────────

const PLANS = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'] as const
type Plan = typeof PLANS[number]

const PLAN_LABEL: Record<Plan, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
  CUSTOM: 'Personalizado',
}

const PLAN_PRICE_AOA: Record<Plan, number> = {
  STARTER: 50000,
  PROFESSIONAL: 150000,
  ENTERPRISE: 500000,
  CUSTOM: 1000000,
}

const DURATIONS = [
  { value: 1, label: '1 mês' },
  { value: 3, label: '3 meses' },
  { value: 6, label: '6 meses' },
  { value: 12, label: '12 meses' },
]

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Transferência Bancária' },
  { value: 'MULTICAIXA', label: 'Multicaixa' },
  { value: 'CASH', label: 'Dinheiro' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function formatDatePT(date: Date): string {
  return date.toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrencyAOA(amount: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function RenewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [duration, setDuration] = useState<number>(1)
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER')
  const [notes, setNotes] = useState<string>('')
  const [paymentConfirmed, setPaymentConfirmed] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Fetch tenant data
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['admin-tenant', id],
    queryFn: () => api.get(`/admin/tenants/${id}`).then((r) => r.data?.data ?? r.data),
    enabled: !!id,
  })

  // Once tenant loads, pre-select the current plan (only once)
  React.useEffect(() => {
    if (tenant && selectedPlan === null) {
      setSelectedPlan((tenant.plan as Plan) ?? 'STARTER')
    }
  }, [tenant, selectedPlan])

  const effectivePlan: Plan = selectedPlan ?? (tenant?.plan as Plan) ?? 'STARTER'

  const newExpiryDate = useMemo(() => {
    const base = new Date()
    return addMonths(base, duration)
  }, [duration])

  const totalPrice = useMemo(() => {
    if (effectivePlan === 'CUSTOM') return null
    return PLAN_PRICE_AOA[effectivePlan] * duration
  }, [effectivePlan, duration])

  const renewMutation = useMutation({
    mutationFn: () =>
      api.patch(`/admin/tenants/${id}`, {
        plan: effectivePlan,
        expiresAt: newExpiryDate.toISOString(),
        active: true,
      }),
    onSuccess: () => {
      setSuccessMessage('Subscrição renovada com sucesso!')
      setTimeout(() => {
        router.push(`/admin/tenants/${id}`)
      }, 1500)
    },
    onError: (err: any) => {
      setErrorMessage(
        err?.response?.data?.message || 'Ocorreu um erro ao renovar a subscrição. Tente novamente.'
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    if (!paymentConfirmed) return
    renewMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-gray-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
        A carregar dados do tenant...
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500 text-sm">
        Empresa não encontrada.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href={`/admin/tenants/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para {tenant.name}
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Renovar Subscrição
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {tenant.name} — {tenant.slug}.engeris.ao
        </p>
      </div>

      {/* Current plan info card */}
      <Card>
        <CardTitle className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <CreditCard className="h-4 w-4" />
          Subscrição Atual
        </CardTitle>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Plano</p>
              <p className="mt-0.5 text-lg font-bold text-primary">
                {PLAN_LABEL[tenant.plan as Plan] ?? tenant.plan}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Expira em</p>
              <p className="mt-0.5 font-medium text-gray-800">
                {tenant.expiresAt ? formatDatePT(new Date(tenant.expiresAt)) : 'Sem data definida'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Estado</p>
              <span className={cn(
                'mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
                tenant.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
              )}>
                {tenant.active ? 'Ativa' : 'Suspensa'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success message */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error message */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      )}

      {/* Renewal form */}
      <Card>
        <CardTitle className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <RefreshCw className="h-4 w-4" />
          Detalhes da Renovação
        </CardTitle>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Plan selector */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Plano
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PLANS.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      'rounded-xl border-2 p-3 text-center transition-all',
                      effectivePlan === plan
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-primary/40 hover:bg-primary/5',
                    )}
                  >
                    <p className="text-xs font-bold uppercase tracking-wide">
                      {PLAN_LABEL[plan]}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400">
                      {plan === 'CUSTOM'
                        ? 'Personalizado'
                        : `${formatCurrencyAOA(PLAN_PRICE_AOA[plan])}/mês`}
                    </p>
                    {plan === tenant.plan && (
                      <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                        Atual
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Duração
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setDuration(d.value)}
                    className={cn(
                      'rounded-xl border-2 py-2.5 text-sm font-medium transition-all',
                      duration === d.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-primary/40',
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary row: new expiry + price */}
            <div className="grid grid-cols-1 gap-4 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Nova Data de Expiração
                </p>
                <div className="mt-1 flex items-center gap-1.5 text-gray-800">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold tabular-nums">{formatDatePT(newExpiryDate)}</span>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  Calculado a partir de hoje + {duration} {duration === 1 ? 'mês' : 'meses'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Valor Total
                </p>
                {totalPrice !== null ? (
                  <>
                    <p className="mt-1 text-xl font-bold text-primary tabular-nums">
                      {formatCurrencyAOA(totalPrice)}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatCurrencyAOA(PLAN_PRICE_AOA[effectivePlan])} × {duration} {duration === 1 ? 'mês' : 'meses'}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-medium text-gray-500 italic">
                    Valor a negociar (plano personalizado)
                  </p>
                )}
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Método de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reference / notes */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Referência / Notas
                <span className="ml-1 text-xs font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Ref. transferência #123456 ou notas adicionais"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm placeholder-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Payment confirmation checkbox */}
            <label className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors',
              paymentConfirmed
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-primary/40',
            )}>
              <input
                type="checkbox"
                checked={paymentConfirmed}
                onChange={(e) => setPaymentConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Confirmo que o pagamento foi recebido
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Ao marcar esta opção confirmo que o pagamento referente à renovação foi verificado
                  e registado nos sistemas da ENGERIS.
                </p>
              </div>
            </label>

            {/* Submit */}
            <div className="flex items-center gap-4 pt-2">
              <Button
                type="submit"
                disabled={!paymentConfirmed || renewMutation.isPending}
                className={cn(!paymentConfirmed && 'cursor-not-allowed opacity-50')}
              >
                {renewMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    A renovar...
                  </span>
                ) : (
                  'Confirmar Renovação'
                )}
              </Button>
              <Link
                href={`/admin/tenants/${id}`}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

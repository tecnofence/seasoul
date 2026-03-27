'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Radio, Plus } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Activa', SUSPENDED: 'Suspensa', CANCELLED: 'Cancelada', PENDING: 'Pendente', EXPIRED: 'Expirada' }
const STATUS_COLOR: Record<string, string> = { ACTIVE: 'bg-green-100 text-green-700', SUSPENDED: 'bg-amber-100 text-amber-700', CANCELLED: 'bg-red-100 text-red-700', PENDING: 'bg-blue-100 text-blue-700', EXPIRED: 'bg-gray-100 text-gray-700' }
const TYPE_LABEL: Record<string, string> = { MOBILE: 'Móvel', FIXED: 'Fixo', INTERNET: 'Internet', TV: 'TV', BUNDLE: 'Pacote' }

export default function TelecomPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['telecom', statusFilter, typeFilter],
    queryFn: () => api.get('/telecom', { params: { status: statusFilter || undefined, planType: typeFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const subscriptions = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Telecomunicações — Subscrições</h1>
        <Button onClick={() => router.push('/dashboard/telecom/new')}><Plus className="mr-2 h-4 w-4" /> Nova Subscrição</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Plano</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Valor Mensal</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subscriptions.map((s: any) => (
                <tr key={s.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/telecom/${s.id}`)}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{s.clientName ?? s.client?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{s.planName ?? s.plan?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{TYPE_LABEL[s.planType] ?? s.planType ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{s.monthlyValue ? formatKwanza(s.monthlyValue) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[s.status] ?? ''}`}>{STATUS_LABEL[s.status] ?? s.status}</span>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Nenhuma subscrição registada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

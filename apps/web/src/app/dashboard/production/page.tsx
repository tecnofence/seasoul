'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Factory, Plus } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { DRAFT: 'Rascunho', PLANNED: 'Planeada', IN_PROGRESS: 'Em Produção', COMPLETED: 'Concluída', ON_HOLD: 'Suspensa', CANCELLED: 'Cancelada' }
const STATUS_COLOR: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-700', PLANNED: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-purple-100 text-purple-700', COMPLETED: 'bg-green-100 text-green-700', ON_HOLD: 'bg-amber-100 text-amber-700', CANCELLED: 'bg-red-100 text-red-700' }
const PRIORITY_LABEL: Record<string, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente' }
const PRIORITY_COLOR: Record<string, string> = { LOW: 'bg-gray-100 text-gray-700', MEDIUM: 'bg-blue-100 text-blue-700', HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700' }

export default function ProductionPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['production', statusFilter, priorityFilter],
    queryFn: () => api.get('/manufacturing', { params: { status: statusFilter || undefined, priority: priorityFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const orders = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Produção — Ordens</h1>
        <Button onClick={() => router.push('/dashboard/production/new')}><Plus className="mr-2 h-4 w-4" /> Nova Ordem</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">Todas as prioridades</option>
          {Object.entries(PRIORITY_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">N.º Ordem</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Produto</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Quantidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Prioridade</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((o: any) => (
                <tr key={o.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/production/${o.id}`)}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm">{o.orderNumber ?? o.number}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{o.productName ?? o.product?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{o.quantity?.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[o.priority] ?? ''}`}>{PRIORITY_LABEL[o.priority] ?? o.priority}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[o.status] ?? ''}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Nenhuma ordem de produção registada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

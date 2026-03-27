'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Truck, Plus, Search } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { PENDING: 'Pendente', PICKED_UP: 'Recolhido', IN_TRANSIT: 'Em Trânsito', DELIVERED: 'Entregue', RETURNED: 'Devolvido', CANCELLED: 'Cancelado' }
const STATUS_COLOR: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', PICKED_UP: 'bg-blue-100 text-blue-700', IN_TRANSIT: 'bg-purple-100 text-purple-700', DELIVERED: 'bg-green-100 text-green-700', RETURNED: 'bg-orange-100 text-orange-700', CANCELLED: 'bg-red-100 text-red-700' }
const TYPE_LABEL: Record<string, string> = { STANDARD: 'Standard', EXPRESS: 'Expresso', FREIGHT: 'Carga', INTERNATIONAL: 'Internacional' }

export default function ShipmentsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['shipments', search, statusFilter],
    queryFn: () => api.get('/logistics', { params: { search: search || undefined, status: statusFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const shipments = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Logística — Envios</h1>
        <Button onClick={() => router.push('/dashboard/shipments/new')}><Plus className="mr-2 h-4 w-4" /> Novo Envio</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Pesquisar código de rastreio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Origem</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Destino</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shipments.map((s: any) => (
                <tr key={s.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/shipments/${s.id}`)}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm">{s.trackingCode}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{s.origin}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{s.destination}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{TYPE_LABEL[s.type] ?? s.type}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[s.status] ?? ''}`}>{STATUS_LABEL[s.status] ?? s.status}</span>
                  </td>
                </tr>
              ))}
              {shipments.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Nenhum envio registado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

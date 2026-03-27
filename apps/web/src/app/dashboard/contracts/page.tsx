'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileCheck, Plus, Search, AlertTriangle } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { DRAFT: 'Rascunho', ACTIVE: 'Ativo', SUSPENDED: 'Suspenso', EXPIRED: 'Expirado', CANCELLED: 'Cancelado' }
const STATUS_COLOR: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-700', ACTIVE: 'bg-green-100 text-green-700', SUSPENDED: 'bg-amber-100 text-amber-700', EXPIRED: 'bg-red-100 text-red-700', CANCELLED: 'bg-red-100 text-red-700' }

export default function ContractsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', search, statusFilter],
    queryFn: () => api.get('/contracts', { params: { search: search || undefined, status: statusFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const { data: expiringData } = useQuery({
    queryKey: ['contracts-expiring'],
    queryFn: () => api.get('/contracts/expiring').then((r) => r.data),
  })

  const contracts = data?.data ?? []
  const expiring = expiringData?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contratos</h1>
        <Button onClick={() => router.push('/dashboard/contracts/new')}><Plus className="mr-2 h-4 w-4" /> Novo Contrato</Button>
      </div>

      {expiring.length > 0 && (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">{expiring.length} contrato(s) a expirar nos próximos 30 dias</h3>
          </div>
          <ul className="mt-2 space-y-1">
            {expiring.slice(0, 5).map((c: any) => (
              <li key={c.id} className="text-sm text-amber-700">
                {c.clientName} — {c.title} (expira {new Date(c.endDate).toLocaleDateString('pt-AO')})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Fim</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contracts.map((c: any) => (
                <tr key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/contracts/${c.id}`)}>
                  <td className="px-4 py-3 font-medium">{c.clientName}</td>
                  <td className="px-4 py-3">{c.title}</td>
                  <td className="px-4 py-3 text-gray-500">{c.contractType}</td>
                  <td className="px-4 py-3">{c.monthlyValue ? `${formatKwanza(Number(c.monthlyValue))}/mês` : c.totalValue ? formatKwanza(Number(c.totalValue)) : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.endDate ? new Date(c.endDate).toLocaleDateString('pt-AO') : 'Indeterminado'}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.status] ?? ''}`}>{STATUS_LABEL[c.status] ?? c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {contracts.length === 0 && (
            <div className="p-12 text-center">
              <FileCheck className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhum contrato encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

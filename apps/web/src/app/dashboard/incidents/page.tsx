'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Plus, Search } from 'lucide-react'

const SEVERITY_COLOR: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700', MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700', CRITICAL: 'bg-red-100 text-red-700',
}
const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Aberto', INVESTIGATING: 'Em Investigação', IN_PROGRESS: 'Em Curso', RESOLVED: 'Resolvido', CLOSED: 'Fechado',
}

export default function IncidentsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', search, statusFilter],
    queryFn: () => api.get('/security/incidents', {
      params: { search: search || undefined, status: statusFilter || undefined, limit: 50 },
    }).then((r) => r.data),
  })

  const incidents = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Segurança — Incidentes</h1>
        <Button onClick={() => router.push('/dashboard/incidents/new')}>
          <Plus className="mr-2 h-4 w-4" /> Registar Incidente
        </Button>
      </div>

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
                <th className="px-4 py-3">Severidade</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Local</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {incidents.map((inc: any) => (
                <tr key={inc.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/incidents/${inc.id}`)}>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_COLOR[inc.severity] ?? ''}`}>{inc.severity}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{inc.title}</td>
                  <td className="px-4 py-3 text-gray-500">{inc.type?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-500">{inc.location || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(inc.createdAt).toLocaleDateString('pt-AO')}</td>
                  <td className="px-4 py-3 text-gray-500">{STATUS_LABEL[inc.status] ?? inc.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {incidents.length === 0 && (
            <div className="p-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhum incidente registado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

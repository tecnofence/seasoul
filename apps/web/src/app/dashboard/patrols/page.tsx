'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Route, MapPin, Clock, CheckCircle, Plus } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { SCHEDULED: 'Agendada', IN_PROGRESS: 'Em Curso', COMPLETED: 'Concluída', INTERRUPTED: 'Interrompida' }
const STATUS_COLOR: Record<string, string> = { SCHEDULED: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-amber-100 text-amber-700', COMPLETED: 'bg-green-100 text-green-700', INTERRUPTED: 'bg-red-100 text-red-700' }

export default function PatrolsPage() {
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['patrols', statusFilter],
    queryFn: () => api.get('/security/patrols', { params: { status: statusFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const patrols = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Segurança — Rondas</h1>
        <Button onClick={() => router.push('/dashboard/patrols/new')}>
          <Plus className="mr-2 h-4 w-4" /> Nova Ronda
        </Button>
        <div className="flex gap-2">
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <button key={k} onClick={() => setStatusFilter(statusFilter === k ? '' : k)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === k ? STATUS_COLOR[k] : 'bg-gray-100 text-gray-600'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patrols.map((p: any) => {
            const checkpoints = Array.isArray(p.checkpoints) ? p.checkpoints : []
            return (
              <div key={p.id} className="cursor-pointer rounded-lg border bg-white p-5 shadow-sm hover:shadow-md transition-shadow" onClick={() => router.push(`/dashboard/patrols/${p.id}`)}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{p.guardName}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status] ?? ''}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
                {p.route && <p className="mb-2 text-sm text-gray-500">Rota: {p.route}</p>}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(p.startedAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{checkpoints.length} checkpoints</span>
                  {p.status === 'COMPLETED' && <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-4 w-4" />Concluída</span>}
                </div>
                <p className="mt-2 text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString('pt-AO')}</p>
              </div>
            )
          })}
          {patrols.length === 0 && (
            <div className="col-span-full rounded-lg border bg-white p-12 text-center">
              <Route className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhuma ronda registada</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

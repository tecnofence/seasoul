'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, Plus, Search } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { PLANNING: 'Planeamento', APPROVED: 'Aprovado', IN_PROGRESS: 'Em Curso', ON_HOLD: 'Suspenso', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' }
const STATUS_COLOR: Record<string, string> = { PLANNING: 'bg-blue-100 text-blue-700', APPROVED: 'bg-indigo-100 text-indigo-700', IN_PROGRESS: 'bg-amber-100 text-amber-700', ON_HOLD: 'bg-gray-100 text-gray-700', COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' }
const TYPE_LABEL: Record<string, string> = { NEW_INSTALLATION: 'Nova Instalação', RENOVATION: 'Renovação', EXPANSION: 'Ampliação', MAINTENANCE: 'Manutenção', EMERGENCY: 'Emergência' }
const VOLTAGE_LABEL: Record<string, string> = { LOW: 'Baixa Tensão', MEDIUM: 'Média Tensão', HIGH: 'Alta Tensão' }

export default function ElectricalProjectsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['electrical-projects', search, statusFilter],
    queryFn: () => api.get('/electrical', { params: { search: search || undefined, status: statusFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const projects = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Eletricidade — Projetos</h1>
        <Button onClick={() => router.push('/dashboard/electrical-projects/new')}><Plus className="mr-2 h-4 w-4" /> Novo Projeto</Button>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p: any) => (
            <div key={p.id} className="cursor-pointer rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md" onClick={() => router.push(`/dashboard/electrical-projects/${p.id}`)}>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.clientName}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status] ?? ''}`}>{STATUS_LABEL[p.status] ?? p.status}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span className="rounded bg-yellow-100 px-2 py-0.5 text-yellow-800"><Zap className="mr-1 inline h-3 w-3" />{VOLTAGE_LABEL[p.voltageLevel] ?? p.voltageLevel}</span>
                <span className="rounded bg-gray-100 px-2 py-0.5">{TYPE_LABEL[p.projectType] ?? p.projectType}</span>
                {p.budget && <span>{formatKwanza(Number(p.budget))}</span>}
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="col-span-full rounded-lg border bg-white p-12 text-center">
              <Zap className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhum projeto elétrico encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

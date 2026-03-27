'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Activity, Plus, Search, Clock, Users } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Ativa', INACTIVE: 'Inativa', SUSPENDED: 'Suspensa' }
const STATUS_COLOR: Record<string, string> = { ACTIVE: 'bg-green-100 text-green-700', INACTIVE: 'bg-gray-100 text-gray-700', SUSPENDED: 'bg-amber-100 text-amber-700' }

const CATEGORY_LABEL: Record<string, string> = { ADVENTURE: 'Aventura', AQUATIC: 'Aquático', NATURE: 'Natureza', CULTURAL: 'Cultural', SPORT: 'Desporto', WELLNESS: 'Bem-Estar', GASTRONOMY: 'Gastronomia', OTHER: 'Outro' }
const CATEGORY_COLOR: Record<string, string> = { ADVENTURE: 'bg-orange-100 text-orange-700', AQUATIC: 'bg-cyan-100 text-cyan-700', NATURE: 'bg-emerald-100 text-emerald-700', CULTURAL: 'bg-violet-100 text-violet-700', SPORT: 'bg-blue-100 text-blue-700', WELLNESS: 'bg-pink-100 text-pink-700', GASTRONOMY: 'bg-amber-100 text-amber-700', OTHER: 'bg-gray-100 text-gray-700' }

const DIFFICULTY_LABEL: Record<string, string> = { EASY: 'Fácil', MODERATE: 'Moderado', HARD: 'Difícil', EXTREME: 'Extremo' }
const DIFFICULTY_COLOR: Record<string, string> = { EASY: 'bg-green-100 text-green-700', MODERATE: 'bg-yellow-100 text-yellow-700', HARD: 'bg-orange-100 text-orange-700', EXTREME: 'bg-red-100 text-red-700' }

export default function ActivitiesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['activities', search, statusFilter, categoryFilter],
    queryFn: () => api.get('/activities', { params: { search: search || undefined, status: statusFilter || undefined, category: categoryFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const activities = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
        <Button onClick={() => router.push('/dashboard/activities/new')}><Plus className="mr-2 h-4 w-4" /> Nova Atividade</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Pesquisar atividade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">Todas as categorias</option>
          {Object.entries(CATEGORY_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((a: any) => (
            <div key={a.id} className="cursor-pointer rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md" onClick={() => router.push(`/dashboard/activities/${a.id}`)}>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold">{a.name}</h3>
                    <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLOR[a.category] ?? 'bg-gray-100 text-gray-700'}`}>{CATEGORY_LABEL[a.category] ?? a.category}</span>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[a.status] ?? ''}`}>{STATUS_LABEL[a.status] ?? a.status}</span>
              </div>
              <div className="mb-3 flex items-center gap-4 text-sm text-gray-500">
                <span className="font-medium text-gray-900">{formatKwanza(a.price)}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{a.duration} min</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />Máx. {a.maxParticipants}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DIFFICULTY_COLOR[a.difficulty] ?? ''}`}>{DIFFICULTY_LABEL[a.difficulty] ?? a.difficulty}</span>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="col-span-full rounded-lg border bg-white p-12 text-center">
              <Activity className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhuma atividade registada</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

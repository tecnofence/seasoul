'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CalendarDays, Plus, Users } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { DRAFT: 'Rascunho', PLANNED: 'Planeado', CONFIRMED: 'Confirmado', IN_PROGRESS: 'Em Curso', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' }
const STATUS_COLOR: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-700', PLANNED: 'bg-blue-100 text-blue-700', CONFIRMED: 'bg-indigo-100 text-indigo-700', IN_PROGRESS: 'bg-purple-100 text-purple-700', COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' }
const TYPE_LABEL: Record<string, string> = { WEDDING: 'Casamento', CORPORATE: 'Corporativo', CONFERENCE: 'Conferência', PARTY: 'Festa', CONCERT: 'Concerto', EXHIBITION: 'Exposição', OTHER: 'Outro' }

export default function EventsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['events', statusFilter, typeFilter],
    queryFn: () => api.get('/events', { params: { status: statusFilter || undefined, eventType: typeFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const events = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        <Button onClick={() => router.push('/dashboard/events/new')}><Plus className="mr-2 h-4 w-4" /> Novo Evento</Button>
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e: any) => (
            <div key={e.id} className="cursor-pointer rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md" onClick={() => router.push(`/dashboard/events/${e.id}`)}>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><CalendarDays className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold">{e.name ?? e.title}</h3>
                    <p className="text-sm text-gray-500">{TYPE_LABEL[e.eventType] ?? e.eventType}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[e.status] ?? ''}`}>{STATUS_LABEL[e.status] ?? e.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{e.date ? formatDate(e.date) : '—'}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.capacity ?? '—'} lugares</span>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <div className="col-span-full rounded-lg border bg-white p-12 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhum evento registado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

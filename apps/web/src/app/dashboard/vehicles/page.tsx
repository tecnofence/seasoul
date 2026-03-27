'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Car, Plus, Search, Fuel, Gauge } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { AVAILABLE: 'Disponível', IN_USE: 'Em Uso', MAINTENANCE: 'Manutenção', DECOMMISSIONED: 'Abatido' }
const STATUS_COLOR: Record<string, string> = { AVAILABLE: 'bg-green-100 text-green-700', IN_USE: 'bg-blue-100 text-blue-700', MAINTENANCE: 'bg-amber-100 text-amber-700', DECOMMISSIONED: 'bg-gray-100 text-gray-700' }
const TYPE_LABEL: Record<string, string> = { CAR: 'Ligeiro', VAN: 'Carrinha', TRUCK: 'Camião', MOTORCYCLE: 'Mota', BUS: 'Autocarro', EQUIPMENT: 'Equipamento' }

export default function VehiclesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', search, statusFilter],
    queryFn: () => api.get('/fleet', { params: { search: search || undefined, status: statusFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const vehicles = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Frotas — Veículos</h1>
        <Button onClick={() => router.push('/dashboard/vehicles/new')}><Plus className="mr-2 h-4 w-4" /> Novo Veículo</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Pesquisar matrícula ou marca..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v: any) => (
            <div key={v.id} className="cursor-pointer rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md" onClick={() => router.push(`/dashboard/vehicles/${v.id}`)}>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Car className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold">{v.brand} {v.model}</h3>
                    <p className="font-mono text-sm text-gray-500">{v.plate}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[v.status] ?? ''}`}>{STATUS_LABEL[v.status] ?? v.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="rounded bg-gray-100 px-2 py-0.5">{TYPE_LABEL[v.type] ?? v.type}</span>
                <span className="flex items-center gap-1"><Fuel className="h-3 w-3" />{v.fuelType}</span>
                <span className="flex items-center gap-1"><Gauge className="h-3 w-3" />{v.mileage?.toLocaleString()} km</span>
              </div>
            </div>
          ))}
          {vehicles.length === 0 && (
            <div className="col-span-full rounded-lg border bg-white p-12 text-center">
              <Car className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhum veículo registado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

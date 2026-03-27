'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Building2, Plus, Maximize, MapPin } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { AVAILABLE: 'Disponível', SOLD: 'Vendido', RENTED: 'Arrendado', RESERVED: 'Reservado', UNDER_CONSTRUCTION: 'Em Construção' }
const STATUS_COLOR: Record<string, string> = { AVAILABLE: 'bg-green-100 text-green-700', SOLD: 'bg-blue-100 text-blue-700', RENTED: 'bg-purple-100 text-purple-700', RESERVED: 'bg-amber-100 text-amber-700', UNDER_CONSTRUCTION: 'bg-gray-100 text-gray-700' }
const PURPOSE_LABEL: Record<string, string> = { SALE: 'Venda', RENT: 'Arrendamento' }
const TYPE_LABEL: Record<string, string> = { APARTMENT: 'Apartamento', HOUSE: 'Moradia', LAND: 'Terreno', COMMERCIAL: 'Comercial', WAREHOUSE: 'Armazém', OFFICE: 'Escritório' }

export default function PropertiesPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [purposeFilter, setPurposeFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['properties', statusFilter, purposeFilter, typeFilter],
    queryFn: () => api.get('/real-estate', { params: { status: statusFilter || undefined, purpose: purposeFilter || undefined, propertyType: typeFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const properties = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Imobiliário</h1>
        <Button onClick={() => router.push('/dashboard/properties/new')}><Plus className="mr-2 h-4 w-4" /> Novo Imóvel</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select className="rounded-md border px-3 py-2 text-sm" value={purposeFilter} onChange={(e) => setPurposeFilter(e.target.value)}>
          <option value="">Todas as finalidades</option>
          {Object.entries(PURPOSE_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p: any) => (
            <div key={p.id} className="cursor-pointer rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md" onClick={() => router.push(`/dashboard/properties/${p.id}`)}>
              <div className="flex h-40 items-center justify-center rounded-t-lg bg-gray-100">
                <Building2 className="h-12 w-12 text-gray-300" />
              </div>
              <div className="p-5">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{p.title ?? p.name}</h3>
                    <p className="text-sm text-gray-500">{TYPE_LABEL[p.propertyType] ?? p.propertyType}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status] ?? ''}`}>{STATUS_LABEL[p.status] ?? p.status}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Maximize className="h-3 w-3" />{p.area} m²</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.location ?? '—'}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-primary">{formatKwanza(p.price)}</p>
              </div>
            </div>
          ))}
          {properties.length === 0 && (
            <div className="col-span-full rounded-lg border bg-white p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhum imóvel registado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

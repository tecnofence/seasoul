'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { BedDouble, CheckCircle, Wrench, Sparkles, Building2, Users } from 'lucide-react'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  AVAILABLE: 'success',
  OCCUPIED: 'info',
  MAINTENANCE: 'danger',
  CLEANING: 'warning',
}

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Disponível',
  OCCUPIED: 'Ocupado',
  MAINTENANCE: 'Manutenção',
  CLEANING: 'Limpeza',
}

const TYPE_LABEL: Record<string, string> = {
  STANDARD: 'Standard',
  DELUXE: 'Deluxe',
  SUITE: 'Suite',
  VILLA: 'Villa',
}

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'OCCUPIED', label: 'Ocupado' },
  { value: 'CLEANING', label: 'Limpeza' },
  { value: 'MAINTENANCE', label: 'Manutenção' },
]

const TYPE_TABS = [
  { value: '', label: 'Todos' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'DELUXE', label: 'Deluxe' },
  { value: 'SUITE', label: 'Suite' },
  { value: 'VILLA', label: 'Villa' },
]

export default function RoomsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Fetch full room list for stats (always unfiltered)
  const { data: allData, isLoading } = useQuery({
    queryKey: ['rooms-all'],
    queryFn: () => api.get('/rooms', { params: { limit: 100 } }).then((r) => r.data),
  })

  // Fetch filtered results when filters are active
  const { data: filteredData, isLoading: isFiltering } = useQuery({
    queryKey: ['rooms', statusFilter, typeFilter],
    queryFn: () =>
      api
        .get('/rooms', {
          params: {
            limit: 100,
            status: statusFilter || undefined,
            type: typeFilter || undefined,
          },
        })
        .then((r) => r.data),
    enabled: !!(statusFilter || typeFilter),
  })

  const allRooms: any[] = allData?.data ?? []
  const displayRooms: any[] =
    statusFilter || typeFilter ? (filteredData?.data ?? []) : allRooms

  const stats = useMemo(() => {
    const total = allRooms.length
    const occupied = allRooms.filter((r) => r.status === 'OCCUPIED').length
    const available = allRooms.filter((r) => r.status === 'AVAILABLE').length
    const maintenance = allRooms.filter(
      (r) => r.status === 'MAINTENANCE' || r.status === 'CLEANING',
    ).length
    return { total, occupied, available, maintenance }
  }, [allRooms])

  const loading = isLoading || isFiltering

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quartos</h1>
        <Link href="/dashboard/rooms/new">
          <Button>Novo Quarto</Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Quartos"
          value={stats.total}
          icon={<BedDouble size={22} />}
          className="border-l-4 border-l-primary"
        />
        <StatCard
          title="Ocupados Hoje"
          value={stats.occupied}
          icon={<Building2 size={22} />}
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          title="Disponíveis"
          value={stats.available}
          icon={<CheckCircle size={22} />}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="Manutenção / Limpeza"
          value={stats.maintenance}
          icon={<Wrench size={22} />}
          className="border-l-4 border-l-yellow-500"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-gray-500 mr-1">Estado:</span>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type tabs */}
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-gray-500 mr-1">Tipo:</span>
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                typeFilter === tab.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Room count */}
      {!loading && (
        <p className="text-sm text-gray-500">
          {displayRooms.length} quarto{displayRooms.length !== 1 ? 's' : ''} encontrado
          {displayRooms.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      )}

      {/* Room cards grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayRooms.map((room: any) => (
            <Card
              key={room.id}
              className="group flex cursor-pointer flex-col justify-between p-5 transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20"
              onClick={() => (window.location.href = `/dashboard/rooms/${room.id}`)}
            >
              {/* Top row: number + status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                    #{room.number}
                  </h3>
                  <p className="mt-0.5 text-xs text-gray-400">Piso {room.floor ?? '—'}</p>
                </div>
                <Badge variant={STATUS_VARIANT[room.status] ?? 'default'}>
                  {STATUS_LABEL[room.status] ?? room.status}
                </Badge>
              </div>

              {/* Room type badge */}
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  <BedDouble size={12} />
                  {TYPE_LABEL[room.type] ?? room.type ?? '—'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                  <Users size={12} />
                  {room.capacity ?? '—'} pax
                </span>
              </div>

              {/* Amenities preview */}
              {Array.isArray(room.amenities) && room.amenities.length > 0 && (
                <p className="mt-2 truncate text-xs text-gray-400">
                  {room.amenities.slice(0, 3).join(' · ')}
                  {room.amenities.length > 3 && ' …'}
                </p>
              )}

              {/* Price */}
              <div className="mt-4 flex items-end justify-between border-t border-gray-100 pt-3">
                <p className="text-base font-semibold text-primary">
                  {formatKwanza(room.pricePerNight)}
                  <span className="ml-1 text-xs font-normal text-gray-400">/noite</span>
                </p>
                {room.status === 'CLEANING' && (
                  <Sparkles size={14} className="text-yellow-500" />
                )}
                {room.status === 'MAINTENANCE' && (
                  <Wrench size={14} className="text-red-400" />
                )}
              </div>
            </Card>
          ))}

          {displayRooms.length === 0 && (
            <div className="col-span-full flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 text-gray-400">
              Nenhum quarto encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

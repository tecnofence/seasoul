'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import {
  Plus,
  BedDouble,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Pencil,
  CalendarDays,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tariff {
  id: string
  name: string
  roomType: string
  season?: string
  pricePerNight: number
  minStay?: number
  validFrom: string
  validUntil?: string
  active: boolean
  resort?: { name: string }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_TYPE_LABEL: Record<string, string> = {
  STANDARD: 'Standard',
  SUPERIOR: 'Superior',
  DELUXE: 'Deluxe',
  SUITE: 'Suite',
  VILLA: 'Villa',
  BUNGALOW: 'Bungalow',
  FAMILY: 'Família',
}

const SEASON_OPTIONS = [
  { value: '', label: 'Todas as temporadas' },
  { value: 'current', label: 'Actuais' },
  { value: 'upcoming', label: 'Futuras' },
  { value: 'past', label: 'Passadas' },
]

function getSeasonStatus(tariff: Tariff): 'current' | 'upcoming' | 'past' {
  const now = new Date()
  const from = new Date(tariff.validFrom)
  const until = tariff.validUntil ? new Date(tariff.validUntil) : null
  if (from > now) return 'upcoming'
  if (until && until < now) return 'past'
  return 'current'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TariffsPage() {
  const [roomTypeFilter, setRoomTypeFilter] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')

  const params: Record<string, string> = { limit: '50' }
  if (roomTypeFilter) params.roomType = roomTypeFilter

  const { data, isLoading } = useQuery({
    queryKey: ['tariffs', roomTypeFilter],
    queryFn: () => api.get('/tariffs', { params }).then((r) => r.data),
  })

  const allTariffs: Tariff[] = data?.data ?? []

  // ── Derived stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const prices = allTariffs.map((t) => Number(t.pricePerNight))
    const active = allTariffs.filter((t) => t.active).length
    const minPrice = prices.length ? Math.min(...prices) : 0
    const maxPrice = prices.length ? Math.max(...prices) : 0
    return { total: allTariffs.length, active, minPrice, maxPrice }
  }, [allTariffs])

  // ── Client-side season filter ────────────────────────────────────────────────
  const tariffs = useMemo(() => {
    if (!seasonFilter) return allTariffs
    return allTariffs.filter((t) => getSeasonStatus(t) === seasonFilter)
  }, [allTariffs, seasonFilter])

  // ── Unique room types for filter select ─────────────────────────────────────
  const roomTypes = useMemo(
    () => [...new Set(allTariffs.map((t) => t.roomType))].sort(),
    [allTariffs],
  )

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarifas</h1>
          <p className="mt-0.5 text-sm text-gray-500">Preços por tipo de quarto e temporada</p>
        </div>
        <Link href="/dashboard/tariffs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nova Tarifa
          </Button>
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Tarifas"
          value={isLoading ? '—' : stats.total}
          icon={<CalendarDays className="h-6 w-6" />}
        />
        <StatCard
          title="Activas"
          value={isLoading ? '—' : stats.active}
          icon={<CheckCircle className="h-6 w-6" />}
        />
        <StatCard
          title="Tarifa Mínima"
          value={isLoading ? '—' : formatKwanza(stats.minPrice)}
          icon={<TrendingDown className="h-6 w-6" />}
        />
        <StatCard
          title="Tarifa Máxima"
          value={isLoading ? '—' : formatKwanza(stats.maxPrice)}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={roomTypeFilter}
          onChange={(e) => setRoomTypeFilter(e.target.value)}
        >
          <option value="">Todos os tipos de quarto</option>
          {roomTypes.map((rt) => (
            <option key={rt} value={rt}>
              {ROOM_TYPE_LABEL[rt] ?? rt}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(e.target.value)}
        >
          {SEASON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <span className="text-sm">A carregar tarifas...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">Nome</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Tipo de Quarto</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Temporada / Período</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    Preço / Noite
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">
                    Min. Estada
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-center font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tariffs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <BedDouble className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-3 text-sm text-gray-500">Sem tarifas encontradas</p>
                      <p className="text-xs text-gray-400">
                        Tente ajustar os filtros ou crie uma nova tarifa
                      </p>
                    </td>
                  </tr>
                )}
                {tariffs.map((tariff) => {
                  const seasonStatus = getSeasonStatus(tariff)
                  return (
                    <tr key={tariff.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {tariff.name}
                        {tariff.resort && (
                          <span className="ml-1.5 text-xs text-gray-400">
                            · {tariff.resort.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {ROOM_TYPE_LABEL[tariff.roomType] ?? tariff.roomType}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {tariff.season && (
                            <span className="text-xs font-medium text-gray-700">
                              {tariff.season}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(tariff.validFrom)}
                            {tariff.validUntil ? ` → ${formatDate(tariff.validUntil)}` : ' →  ∞'}
                          </span>
                          <span
                            className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium ${
                              seasonStatus === 'current'
                                ? 'bg-green-100 text-green-700'
                                : seasonStatus === 'upcoming'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {seasonStatus === 'current'
                              ? 'Actual'
                              : seasonStatus === 'upcoming'
                                ? 'Futura'
                                : 'Passada'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-primary">
                          {formatKwanza(tariff.pricePerNight)}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">/ noite</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700">
                        {tariff.minStay ? `${tariff.minStay} nts` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={tariff.active ? 'success' : 'danger'}>
                          {tariff.active ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <Link href={`/dashboard/tariffs/${tariff.id}`}>
                          <Button variant="ghost" size="icon" title="Editar tarifa">
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!isLoading && tariffs.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          A mostrar {tariffs.length} tarifa{tariffs.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

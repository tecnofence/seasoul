'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Eye, Plus, LogIn, BedDouble } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ReservationStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'PENDING'

interface Reservation {
  id: string
  guestName: string
  guestEmail?: string
  room?: { number: string; type: string }
  checkIn: string
  checkOut: string
  nights?: number
  totalAmount: number
  status: ReservationStatus
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<ReservationStatus, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  CONFIRMED: 'info',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'default',
  CANCELLED: 'danger',
  NO_SHOW: 'warning',
  PENDING: 'warning',
}

const STATUS_LABEL: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Check-in',
  CHECKED_OUT: 'Check-out',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No-show',
  PENDING: 'Pendente',
}

// status chips config
const STATUS_CHIPS: Array<{
  key: string
  label: string
  color: string
  activeColor: string
}> = [
  { key: '', label: 'Total', color: 'bg-gray-100 text-gray-700', activeColor: 'bg-gray-700 text-white' },
  { key: 'CONFIRMED', label: 'Confirmadas', color: 'bg-primary/10 text-primary', activeColor: 'bg-primary text-white' },
  { key: 'CHECKED_IN', label: 'In-House', color: 'bg-green-100 text-green-700', activeColor: 'bg-green-600 text-white' },
  { key: 'CHECKED_OUT', label: 'Check-out Hoje', color: 'bg-amber-100 text-amber-700', activeColor: 'bg-amber-500 text-white' },
  { key: 'CANCELLED', label: 'Canceladas', color: 'bg-red-100 text-red-700', activeColor: 'bg-red-600 text-white' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn)
  const b = new Date(checkOut)
  const diff = b.getTime() - a.getTime()
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)))
}

function isCheckOutToday(checkOut: string): boolean {
  const d = new Date(checkOut)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', page, search, statusFilter, dateFrom, dateTo],
    queryFn: () =>
      api.get('/reservations', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter || undefined,
          checkInFrom: dateFrom || undefined,
          checkInTo: dateTo || undefined,
        },
      }).then((r) => r.data),
  })

  const reservations: Reservation[] = data?.data ?? []
  const totalPages: number = data?.totalPages ?? 1

  // ── Status summary chips (count from current page + totals from meta if available) ──
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { '': reservations.length }
    reservations.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1
      if (isCheckOutToday(r.checkOut) && r.status === 'CHECKED_IN') {
        counts['CHECKED_OUT'] = (counts['CHECKED_OUT'] ?? 0) + 1
      }
    })
    // prefer server-provided totals when available
    if (data?.statusSummary) {
      return data.statusSummary as Record<string, number>
    }
    return counts
  }, [reservations, data])

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="mt-0.5 text-sm text-gray-500">Gestão de reservas e hóspedes do resort</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/reservations/checkin">
            <Button variant="outline">
              <LogIn className="mr-2 h-4 w-4" /> Check-in Rápido
            </Button>
          </Link>
          <Link href="/dashboard/reservations/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nova Reserva
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Status summary chips ── */}
      <div className="flex flex-wrap gap-2">
        {STATUS_CHIPS.map((chip) => {
          const count = chip.key === ''
            ? (data?.total ?? reservations.length)
            : (statusCounts[chip.key] ?? 0)
          const isActive = statusFilter === chip.key
          return (
            <button
              key={chip.key}
              onClick={() => { setStatusFilter(chip.key); setPage(1) }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? chip.activeColor : chip.color
              } hover:opacity-90`}
            >
              {chip.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                isActive
                  ? 'bg-white/20 text-inherit'
                  : 'bg-white/70 text-gray-700'
              }`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Pesquisar por nome ou quarto..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        >
          <option value="">Todos os estados</option>
          <option value="PENDING">Pendente</option>
          <option value="CONFIRMED">Confirmada</option>
          <option value="CHECKED_IN">Check-in</option>
          <option value="CHECKED_OUT">Check-out</option>
          <option value="CANCELLED">Cancelada</option>
          <option value="NO_SHOW">No-show</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            title="Check-in de"
          />
          <span className="text-xs text-gray-400">até</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            title="Check-in até"
          />
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="p-0">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <span className="text-sm">A carregar reservas...</span>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hóspede</TableHead>
                <TableHead>Quarto</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead className="text-center">Noites</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations.map((r) => {
                const nights = r.nights ?? nightsBetween(r.checkIn, r.checkOut)
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{r.guestName}</p>
                        {r.guestEmail && (
                          <p className="text-xs text-gray-400">{r.guestEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.room ? (
                        <div>
                          <p className="font-medium text-gray-900">{r.room.number}</p>
                          <p className="text-xs text-gray-400">{r.room.type}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {formatDate(r.checkIn)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {formatDate(r.checkOut)}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                        {nights}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatKwanza(r.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status] ?? 'default'}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/reservations/${r.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
              {!reservations.length && (
                <TableRow>
                  <TableCell colSpan={8} className="py-16 text-center">
                    <BedDouble className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500">Sem reservas encontradas</p>
                    <p className="text-xs text-gray-400">Tente ajustar os filtros ou crie uma nova reserva</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="px-2 text-sm text-gray-600">
            Página <span className="font-medium">{page}</span> de{' '}
            <span className="font-medium">{totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Seguinte
          </Button>
        </div>
      )}
    </div>
  )
}

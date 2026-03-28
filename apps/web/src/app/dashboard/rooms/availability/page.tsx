'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// ─── Types ───────────────────────────────────────────────────────────────────

type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING'
type ReservationStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW' | 'PENDING'

interface Room {
  id: string
  number: string
  type: string
  floor?: number
  status: RoomStatus
}

interface Reservation {
  id: string
  roomId: string
  guestName: string
  checkIn: string
  checkOut: string
  status: ReservationStatus
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ROOM_TYPE_LABEL: Record<string, string> = {
  STANDARD: 'STD',
  DELUXE: 'DLX',
  SUITE: 'STE',
  VILLA: 'VLA',
}

const ROOM_TYPE_COLOR: Record<string, string> = {
  STANDARD: 'bg-gray-100 text-gray-700',
  DELUXE: 'bg-primary/10 text-primary',
  SUITE: 'bg-purple-100 text-purple-700',
  VILLA: 'bg-teal-100 text-teal-700',
}

const STATUS_EXCLUDED = new Set(['CANCELLED', 'NO_SHOW', 'CHECKED_OUT'])

const WEEKDAYS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns Monday of the week containing `date` */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' }).format(date)
}

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('pt-PT', { month: 'long', year: 'numeric' }).format(date)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/** For a given room and calendar date, return the overlapping reservation (if any) */
function getReservationForCell(
  roomId: string,
  date: Date,
  reservations: Reservation[],
): Reservation | null {
  const dateStart = new Date(date)
  dateStart.setHours(0, 0, 0, 0)
  const dateEnd = new Date(date)
  dateEnd.setHours(23, 59, 59, 999)

  return (
    reservations.find((r) => {
      if (r.roomId !== roomId) return false
      if (STATUS_EXCLUDED.has(r.status)) return false
      const checkIn = new Date(r.checkIn)
      const checkOut = new Date(r.checkOut)
      return checkIn <= dateEnd && checkOut > dateStart
    }) ?? null
  )
}

/** Cell visual style based on room + reservation state */
type CellState = 'available' | 'confirmed' | 'checkedin' | 'maintenance' | 'cleaning' | 'checkout'

function getCellState(room: Room, res: Reservation | null, date: Date): CellState {
  if (res) {
    if (res.status === 'CONFIRMED') return 'confirmed'
    if (res.status === 'CHECKED_IN') {
      // Last day of stay — show checkout style
      const out = new Date(res.checkOut)
      out.setHours(0, 0, 0, 0)
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      if (isSameDay(out, d)) return 'checkout'
      return 'checkedin'
    }
  }
  if (room.status === 'MAINTENANCE') return 'maintenance'
  if (room.status === 'CLEANING') return 'cleaning'
  return 'available'
}

const CELL_STYLES: Record<CellState, string> = {
  available: 'bg-green-50 hover:bg-green-100',
  confirmed: 'bg-primary/20 hover:bg-primary/30 cursor-pointer',
  checkedin: 'bg-green-500/20 hover:bg-green-500/30 cursor-pointer',
  checkout: 'bg-amber-100 hover:bg-amber-200 cursor-pointer',
  maintenance: 'bg-red-100 hover:bg-red-200',
  cleaning: 'bg-yellow-100 hover:bg-yellow-200',
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipData {
  reservation: Reservation
  rect: DOMRect
}

function CellTooltip({ data }: { data: TooltipData }) {
  const { reservation, rect } = data
  const style: React.CSSProperties = {
    position: 'fixed',
    top: rect.bottom + 8,
    left: Math.min(rect.left, window.innerWidth - 240),
    zIndex: 50,
    width: 220,
  }
  return (
    <div
      style={style}
      className="rounded-lg border border-gray-200 bg-white p-3 shadow-xl text-sm"
    >
      <p className="font-semibold text-gray-900">{reservation.guestName}</p>
      <p className="text-xs text-gray-500 mt-0.5">
        Check-in: {formatShortDate(new Date(reservation.checkIn))} &nbsp;→&nbsp;
        Check-out: {formatShortDate(new Date(reservation.checkOut))}
      </p>
      <div className="mt-1.5 flex items-center gap-1">
        <span className={`inline-flex h-5 items-center rounded-full px-2 text-xs font-medium ${
          reservation.status === 'CHECKED_IN'
            ? 'bg-green-100 text-green-700'
            : 'bg-primary/10 text-primary'
        }`}>
          {reservation.status === 'CHECKED_IN' ? 'In-House' : 'Confirmada'}
        </span>
      </div>
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { color: 'bg-green-50 border border-green-200', label: 'Disponível' },
    { color: 'bg-primary/20', label: 'Reservado (Confirmado)' },
    { color: 'bg-green-500/20', label: 'Ocupado (In-House)' },
    { color: 'bg-amber-100', label: 'Saída hoje' },
    { color: 'bg-red-100', label: 'Manutenção' },
    { color: 'bg-yellow-100', label: 'Limpeza' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`h-4 w-4 rounded ${item.color}`} />
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RoomAvailabilityPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // ── Fetches ────────────────────────────────────────────────────────────────

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['rooms-availability'],
    queryFn: () => api.get('/rooms', { params: { limit: 100 } }).then((r) => r.data),
    retry: false,
  })

  const checkInFrom = weekDays[0].toISOString().split('T')[0]
  const checkInTo = addDays(weekDays[6], 1).toISOString().split('T')[0]

  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['reservations-week', checkInFrom, checkInTo],
    queryFn: () =>
      api.get('/reservations', { params: { limit: 200 } }).then((r) => r.data),
    retry: false,
  })

  const rooms: Room[] = useMemo(() => roomsData?.data ?? [], [roomsData])
  const reservations: Reservation[] = useMemo(() => resData?.data ?? [], [resData])
  const isLoading = roomsLoading || resLoading

  // ── Navigation ─────────────────────────────────────────────────────────────

  function prevWeek() { setWeekStart((w) => addDays(w, -7)) }
  function nextWeek() { setWeekStart((w) => addDays(w, 7)) }
  function goToday() { setWeekStart(getWeekStart(new Date())) }

  // ── Tooltip dismiss on outside click ──────────────────────────────────────

  useEffect(() => {
    function handleClick() { setTooltip(null) }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disponibilidade de Quartos</h1>
          <p className="mt-0.5 text-sm text-gray-500 capitalize">
            {formatMonthYear(weekDays[0])}
            {weekDays[0].getMonth() !== weekDays[6].getMonth() &&
              ` – ${formatMonthYear(weekDays[6])}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-gray-200 bg-white">
            <button
              onClick={prevWeek}
              className="flex h-9 w-9 items-center justify-center rounded-l-md hover:bg-gray-50 text-gray-600"
              title="Semana Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={goToday}
              className="flex h-9 items-center gap-1.5 border-x border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Hoje
            </button>
            <button
              onClick={nextWeek}
              className="flex h-9 w-9 items-center justify-center rounded-r-md hover:bg-gray-50 text-gray-600"
              title="Próxima Semana"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <Link href="/dashboard/reservations/new">
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nova Reserva
            </Button>
          </Link>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-sm">A carregar disponibilidade...</span>
          </div>
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            {/* Header row: room label + 7 days */}
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="sticky left-0 z-10 w-36 bg-gray-50 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 border-r border-gray-200">
                  Quarto
                </th>
                {weekDays.map((day, i) => {
                  const isToday = isSameDay(day, today)
                  return (
                    <th
                      key={i}
                      className={`w-24 px-2 py-2.5 text-center text-xs font-semibold ${
                        isToday
                          ? 'bg-primary text-white'
                          : 'text-gray-600'
                      }`}
                    >
                      <div>{WEEKDAYS_PT[i]}</div>
                      <div className={`text-base font-bold leading-tight ${isToday ? 'text-white' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                      <div className={`text-xs ${isToday ? 'text-white/70' : 'text-gray-400'}`}>
                        {formatShortDate(day).split('/')[1]}/{day.getFullYear().toString().slice(2)}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>

            {/* Body: one row per room */}
            <tbody className="divide-y divide-gray-100">
              {rooms.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400">
                    Sem quartos encontrados.
                  </td>
                </tr>
              )}
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50/50">
                  {/* Room info cell */}
                  <td className="sticky left-0 z-10 border-r border-gray-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900">#{room.number}</div>
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                          ROOM_TYPE_COLOR[room.type] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ROOM_TYPE_LABEL[room.type] ?? room.type}
                      </span>
                    </div>
                    {room.floor != null && (
                      <div className="text-xs text-gray-400">Piso {room.floor}</div>
                    )}
                  </td>

                  {/* Day cells */}
                  {weekDays.map((day, i) => {
                    const res = getReservationForCell(room.id, day, reservations)
                    const state = getCellState(room, res, day)
                    const isToday = isSameDay(day, today)

                    return (
                      <td
                        key={i}
                        className={`relative p-1 text-center ${CELL_STYLES[state]} ${
                          isToday ? 'ring-1 ring-inset ring-primary/30' : ''
                        }`}
                        onClick={(e) => {
                          if (res) {
                            e.stopPropagation()
                            setTooltip((prev) =>
                              prev?.reservation.id === res.id
                                ? null
                                : { reservation: res, rect: (e.currentTarget as HTMLElement).getBoundingClientRect() },
                            )
                          }
                        }}
                      >
                        {res ? (
                          <div className="flex h-9 items-center justify-center">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                state === 'checkedin'
                                  ? 'bg-green-600 text-white'
                                  : state === 'checkout'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-primary text-white'
                              }`}
                              title={res.guestName}
                            >
                              {getInitials(res.guestName)}
                            </div>
                          </div>
                        ) : (
                          <div className="h-9" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      {!isLoading && <Legend />}

      {/* Tooltip */}
      {tooltip && <CellTooltip data={tooltip} />}
    </div>
  )
}

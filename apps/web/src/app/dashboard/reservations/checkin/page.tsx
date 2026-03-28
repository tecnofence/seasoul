'use client'

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import {
  LogIn,
  LogOut,
  CheckCircle,
  Users,
  BedDouble,
  Home,
  Check,
} from 'lucide-react'
import api from '@/lib/api'
import { formatDate, formatDateTime } from '@/lib/utils'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

// ─── Types ───────────────────────────────────────────────────────────────────

type ReservationStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW' | 'PENDING'

interface Reservation {
  id: string
  guestName: string
  room?: { number: string; type: string }
  checkIn: string
  checkOut: string
  totalAmount: number
  status: ReservationStatus
  balance?: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

const MOCK_ARRIVALS: Reservation[] = [
  {
    id: 'mock-1',
    guestName: 'Carlos Mendonça',
    room: { number: '101', type: 'DELUXE' },
    checkIn: TODAY,
    checkOut: new Date(Date.now() + 3 * 86400000).toISOString(),
    totalAmount: 150000,
    status: 'CONFIRMED',
  },
  {
    id: 'mock-2',
    guestName: 'Ana Luísa Ferreira',
    room: { number: '204', type: 'SUITE' },
    checkIn: TODAY,
    checkOut: new Date(Date.now() + 5 * 86400000).toISOString(),
    totalAmount: 280000,
    status: 'CONFIRMED',
  },
  {
    id: 'mock-3',
    guestName: 'João Bernardo Silva',
    room: { number: '312', type: 'STANDARD' },
    checkIn: TODAY,
    checkOut: new Date(Date.now() + 2 * 86400000).toISOString(),
    totalAmount: 90000,
    status: 'CHECKED_IN',
  },
]

const MOCK_DEPARTURES: Reservation[] = [
  {
    id: 'mock-4',
    guestName: 'Maria Santos',
    room: { number: '110', type: 'DELUXE' },
    checkIn: new Date(Date.now() - 3 * 86400000).toISOString(),
    checkOut: TODAY,
    totalAmount: 180000,
    status: 'CHECKED_IN',
    balance: 0,
  },
  {
    id: 'mock-5',
    guestName: 'Pedro Neto Costa',
    room: { number: '215', type: 'STANDARD' },
    checkIn: new Date(Date.now() - 2 * 86400000).toISOString(),
    checkOut: TODAY,
    totalAmount: 95000,
    status: 'CHECKED_OUT',
    balance: 0,
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function todayLabel(): string {
  return new Intl.DateTimeFormat('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

const ROOM_TYPE_LABEL: Record<string, string> = {
  STANDARD: 'Standard',
  DELUXE: 'Deluxe',
  SUITE: 'Suite',
  VILLA: 'Villa',
}

// ─── Toast component ──────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle className="h-4 w-4" /> : null}
      {message}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CheckinPage() {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetches ────────────────────────────────────────────────────────────────

  const { data: todayData } = useQuery({
    queryKey: ['reservations-today'],
    queryFn: () =>
      api.get('/reservations/today').then((r) => r.data).catch(() => null),
    retry: false,
  })

  const { data: inHouseData } = useQuery({
    queryKey: ['reservations-inhouse'],
    queryFn: () =>
      api.get('/reservations', { params: { status: 'CHECKED_IN', limit: 100 } }).then((r) => r.data).catch(() => null),
    retry: false,
  })

  const { data: availableData } = useQuery({
    queryKey: ['rooms-available'],
    queryFn: () =>
      api.get('/rooms', { params: { status: 'AVAILABLE', limit: 1 } }).then((r) => r.data).catch(() => null),
    retry: false,
  })

  // ── Derived data (fall back to mock) ──────────────────────────────────────

  const arrivals: Reservation[] = useMemo(() => {
    if (todayData?.arrivals) return todayData.arrivals
    if (todayData?.data) {
      return todayData.data.filter(
        (r: Reservation) =>
          r.checkIn.startsWith(TODAY) && ['CONFIRMED', 'CHECKED_IN'].includes(r.status),
      )
    }
    return MOCK_ARRIVALS
  }, [todayData])

  const departures: Reservation[] = useMemo(() => {
    if (todayData?.departures) return todayData.departures
    if (todayData?.data) {
      return todayData.data.filter(
        (r: Reservation) =>
          r.checkOut.startsWith(TODAY) && ['CHECKED_IN', 'CHECKED_OUT'].includes(r.status),
      )
    }
    return MOCK_DEPARTURES
  }, [todayData])

  const arrivalsToday = arrivals.filter((r) => r.status === 'CONFIRMED').length
  const departuresToday = departures.filter((r) => r.status === 'CHECKED_IN').length
  const inHouseCount: number = inHouseData?.total ?? inHouseData?.data?.length ?? 0
  const availableCount: number = availableData?.total ?? 0

  // ── Mutation ───────────────────────────────────────────────────────────────

  const { mutate: patchReservation } = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/reservations/${id}`, body).then((r) => r.data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reservations-today'] })
      queryClient.invalidateQueries({ queryKey: ['reservations-inhouse'] })
      queryClient.invalidateQueries({ queryKey: ['rooms-available'] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      setProcessingId(null)
      const isCheckIn = 'actualCheckIn' in variables.body
      showToast(
        isCheckIn ? 'Check-in efetuado com sucesso.' : 'Check-out efetuado com sucesso.',
        'success',
      )
    },
    onError: () => {
      setProcessingId(null)
      showToast('Erro ao processar operação. Tente novamente.', 'error')
    },
  })

  function handleCheckIn(id: string) {
    setProcessingId(id)
    patchReservation({ id, body: { status: 'CHECKED_IN', actualCheckIn: new Date().toISOString() } })
  }

  function handleCheckOut(id: string) {
    setProcessingId(id)
    patchReservation({ id, body: { status: 'CHECKED_OUT', actualCheckOut: new Date().toISOString() } })
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Operações do Dia</h1>
        <p className="mt-0.5 text-sm text-gray-500">{capitalize(todayLabel())}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Chegadas Hoje"
          value={arrivalsToday}
          icon={<LogIn size={22} />}
          className="border-l-4 border-l-primary"
        />
        <StatCard
          title="Partidas Hoje"
          value={departuresToday}
          icon={<LogOut size={22} />}
          className="border-l-4 border-l-amber-500"
        />
        <StatCard
          title="Hóspedes In-House"
          value={inHouseCount}
          icon={<Users size={22} />}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="Quartos Disponíveis"
          value={availableCount}
          icon={<BedDouble size={22} />}
          className="border-l-4 border-l-sky-500"
        />
      </div>

      {/* ── Chegadas de Hoje ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LogIn className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-gray-900">Chegadas de Hoje</h2>
          <span className="inline-flex h-5 items-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
            {arrivals.length}
          </span>
        </div>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hóspede</TableHead>
                <TableHead>Quarto</TableHead>
                <TableHead>Hora Prevista</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Check-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrivals.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(r.guestName)}
                      </div>
                      <span className="font-medium text-gray-900">{r.guestName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.room ? (
                      <div>
                        <span className="font-semibold text-gray-900">#{r.room.number}</span>
                        <span className="ml-1.5 text-xs text-gray-400">
                          {ROOM_TYPE_LABEL[r.room.type] ?? r.room.type}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(r.checkIn)} 14:00
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.status === 'CHECKED_IN' ? 'success' : 'info'}>
                      {r.status === 'CHECKED_IN' ? 'Check-in' : 'Confirmada'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 'CONFIRMED' ? (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={processingId === r.id}
                        onClick={() => handleCheckIn(r.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingId === r.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <>
                            <LogIn className="mr-1.5 h-3.5 w-3.5" />
                            Fazer Check-in
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        Efetuado
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {arrivals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-gray-400">
                    <Home className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                    Sem chegadas previstas para hoje.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* ── Partidas de Hoje ── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LogOut className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">Partidas de Hoje</h2>
          <span className="inline-flex h-5 items-center rounded-full bg-amber-100 px-2 text-xs font-semibold text-amber-700">
            {departures.length}
          </span>
        </div>

        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hóspede</TableHead>
                <TableHead>Quarto</TableHead>
                <TableHead>Hora Prevista</TableHead>
                <TableHead className="text-right">Saldo Pendente</TableHead>
                <TableHead className="text-right">Check-out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departures.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-700">
                        {getInitials(r.guestName)}
                      </div>
                      <span className="font-medium text-gray-900">{r.guestName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {r.room ? (
                      <div>
                        <span className="font-semibold text-gray-900">#{r.room.number}</span>
                        <span className="ml-1.5 text-xs text-gray-400">
                          {ROOM_TYPE_LABEL[r.room.type] ?? r.room.type}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(r.checkOut)} 12:00
                  </TableCell>
                  <TableCell className="text-right">
                    {(r.balance ?? 0) > 0 ? (
                      <span className="font-semibold text-red-600">{formatKwanza(r.balance!)}</span>
                    ) : (
                      <span className="text-sm text-green-600 font-medium">Liquidado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status === 'CHECKED_IN' ? (
                      <Button
                        size="sm"
                        disabled={processingId === r.id}
                        onClick={() => handleCheckOut(r.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        {processingId === r.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <>
                            <LogOut className="mr-1.5 h-3.5 w-3.5" />
                            Fazer Check-out
                          </>
                        )}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        Efetuado
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {departures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-gray-400">
                    <LogOut className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                    Sem partidas previstas para hoje.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

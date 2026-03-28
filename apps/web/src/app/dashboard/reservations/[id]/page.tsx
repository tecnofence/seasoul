'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  LogIn,
  LogOut,
  X,
  FileText,
  Printer,
  User,
  BedDouble,
  ReceiptText,
  CheckCircle2,
  Circle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ReservationStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW'

const STATUS_VARIANT: Record<ReservationStatus, 'info' | 'success' | 'default' | 'danger' | 'warning'> = {
  CONFIRMED: 'info',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'default',
  CANCELLED: 'danger',
  NO_SHOW: 'warning',
}

const STATUS_LABEL: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Check-in Efectuado',
  CHECKED_OUT: 'Check-out Efectuado',
  CANCELLED: 'Cancelada',
  NO_SHOW: 'No-show',
}

const STATUS_COLOR: Record<ReservationStatus, string> = {
  CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
  CHECKED_IN: 'bg-green-100 text-green-800 border-green-200',
  CHECKED_OUT: 'bg-gray-100 text-gray-700 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  NO_SHOW: 'bg-amber-100 text-amber-800 border-amber-200',
}

const IVA_RATE = 0.14

function calcNights(checkIn: string, checkOut: string): number {
  const d1 = new Date(checkIn)
  const d2 = new Date(checkOut)
  return Math.max(1, Math.round((d2.getTime() - d1.getTime()) / 86_400_000))
}

// ---------------------------------------------------------------------------
// Timeline component
// ---------------------------------------------------------------------------

const TIMELINE_STEPS: { key: ReservationStatus; label: string }[] = [
  { key: 'CONFIRMED', label: 'Confirmada' },
  { key: 'CHECKED_IN', label: 'Check-in' },
  { key: 'CHECKED_OUT', label: 'Check-out' },
]

function StatusTimeline({ current }: { current: ReservationStatus }) {
  if (current === 'CANCELLED' || current === 'NO_SHOW') {
    return (
      <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${STATUS_COLOR[current]}`}>
        {STATUS_LABEL[current]}
      </div>
    )
  }

  const currentIdx = TIMELINE_STEPS.findIndex((s) => s.key === current)

  return (
    <div className="flex items-center gap-0">
      {TIMELINE_STEPS.map((step, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        return (
          <div key={step.key} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  active
                    ? 'border-primary bg-primary text-white'
                    : done
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 bg-white text-gray-300'
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
              </div>
              <span
                className={`whitespace-nowrap text-xs ${
                  active ? 'font-semibold text-primary' : done ? 'text-primary/70' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < TIMELINE_STEPS.length - 1 && (
              <div
                className={`mx-1 mb-4 h-0.5 flex-1 ${idx < currentIdx ? 'bg-primary' : 'bg-gray-200'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const [notesValue, setNotesValue] = useState<string | null>(null)

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    queryFn: () => api.get(`/reservations/${id}`).then((r) => r.data.data),
  })

  // Sync notes textarea once data loads
  const notes: string = notesValue ?? reservation?.notes ?? ''

  const checkInMutation = useMutation({
    mutationFn: () =>
      api.patch(`/reservations/${id}`, {
        status: 'CHECKED_IN',
        actualCheckIn: new Date().toISOString(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservation', id] }),
  })

  const checkOutMutation = useMutation({
    mutationFn: () =>
      api.patch(`/reservations/${id}`, {
        status: 'CHECKED_OUT',
        actualCheckOut: new Date().toISOString(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservation', id] }),
  })

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.patch(`/reservations/${id}`, { status: 'CANCELLED' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservation', id] }),
  })

  const notesMutation = useMutation({
    mutationFn: (value: string) =>
      api.patch(`/reservations/${id}`, { notes: value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservation', id] }),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        A carregar reserva...
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Reserva não encontrada.
      </div>
    )
  }

  const r = reservation
  const status: ReservationStatus = r.status ?? 'CONFIRMED'

  const nights = r.nights ?? calcNights(r.checkIn, r.checkOut)
  const roomRate = parseFloat(r.roomRate ?? r.room?.pricePerNight ?? 0)
  const roomTotal = roomRate * nights
  const extras = parseFloat(r.extrasAmount ?? 0)
  const discount = parseFloat(r.discountAmount ?? 0)
  const subtotal = roomTotal + extras - discount
  const iva = subtotal * IVA_RATE
  const total = parseFloat(r.totalAmount ?? subtotal + iva)

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex flex-1 flex-wrap items-center gap-3">
          <span className="font-mono text-2xl font-bold tracking-widest text-gray-900">
            #{r.code ?? r.id?.slice(0, 8).toUpperCase()}
          </span>
          <Badge variant={STATUS_VARIANT[status] ?? 'default'} className="text-sm px-3 py-1">
            {STATUS_LABEL[status] ?? status}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/invoicing/new?reservationId=${id}`)}
          >
            <FileText className="mr-1.5 h-4 w-4" />
            Emitir Fatura
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column layout                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---- LEFT COLUMN ---- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Guest info */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Dados do Hóspede
            </CardTitle>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <InfoRow label="Nome completo" value={r.guestName} strong />
                <InfoRow label="Email" value={r.guestEmail} />
                <InfoRow label="Telefone" value={r.guestPhone} />
                <InfoRow
                  label="Documento"
                  value={
                    r.documentType && r.documentNumber
                      ? `${r.documentType} · ${r.documentNumber}`
                      : r.documentNumber ?? '—'
                  }
                />
                <InfoRow label="País" value={r.country} />
                <InfoRow label="Nacionalidade" value={r.nationality} />
              </dl>
            </CardContent>
          </Card>

          {/* Stay details */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-primary" />
              Detalhes da Estadia
            </CardTitle>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Quarto</dt>
                  <dd className="font-medium">
                    {r.room ? (
                      <Link
                        href={`/dashboard/rooms/${r.room.id}`}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        #{r.room.number} — {r.room.type ?? r.room.category}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <InfoRow label="Resort" value={r.resort?.name} />
                <div>
                  <dt className="text-gray-500">Check-in</dt>
                  <dd className="font-medium">{formatDateTime(r.checkIn)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Check-out</dt>
                  <dd className="font-medium">{formatDateTime(r.checkOut)}</dd>
                </div>
                <InfoRow label="Noites" value={String(nights)} />
                <InfoRow
                  label="Adultos / Crianças"
                  value={`${r.adults ?? 1} adultos · ${r.children ?? 0} crianças`}
                />
                <InfoRow label="Fonte de reserva" value={r.bookingSource} />
              </dl>
              {r.specialRequests && (
                <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="mb-1 font-medium">Pedidos especiais</p>
                  <p className="whitespace-pre-wrap">{r.specialRequests}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charges */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <ReceiptText className="h-5 w-5 text-primary" />
              Encargos
            </CardTitle>
            <CardContent>
              <div className="space-y-2 text-sm">
                <ChargeRow
                  label={`Quarto × ${nights} noite${nights !== 1 ? 's' : ''}`}
                  sub={roomRate > 0 ? `${formatKwanza(roomRate)}/noite` : undefined}
                  value={formatKwanza(roomTotal)}
                />
                {extras > 0 && (
                  <ChargeRow label="Extras / consumos" value={formatKwanza(extras)} />
                )}
                {discount > 0 && (
                  <ChargeRow label="Desconto" value={`− ${formatKwanza(discount)}`} negative />
                )}
                <div className="my-2 border-t border-gray-100" />
                <ChargeRow label="Subtotal (s/ IVA)" value={formatKwanza(subtotal)} />
                <ChargeRow label="IVA (14%)" value={formatKwanza(iva)} muted />
                <div className="my-2 border-t border-gray-200" />
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-base text-gray-900">Total</span>
                  <span className="text-base text-primary">{formatKwanza(total)}</span>
                </div>
                {r.depositPaid && parseFloat(r.depositPaid) > 0 && (
                  <div className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-green-800">
                    Depósito pago: <span className="font-semibold">{formatKwanza(r.depositPaid)}</span>
                    {' · '}Saldo restante:{' '}
                    <span className="font-semibold">
                      {formatKwanza(Math.max(0, total - parseFloat(r.depositPaid)))}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- RIGHT COLUMN ---- */}
        <div className="space-y-6">
          {/* Status timeline */}
          <Card>
            <CardTitle className="mb-4">Estado da Reserva</CardTitle>
            <CardContent>
              <StatusTimeline current={status} />
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardTitle className="mb-4">Ações</CardTitle>
            <CardContent className="space-y-3">
              {status === 'CONFIRMED' && (
                <Button
                  className="w-full"
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {checkInMutation.isPending ? 'A processar...' : 'Realizar Check-in'}
                </Button>
              )}

              {status === 'CHECKED_IN' && (
                <Button
                  className="w-full"
                  onClick={() => checkOutMutation.mutate()}
                  disabled={checkOutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {checkOutMutation.isPending ? 'A processar...' : 'Realizar Check-out'}
                </Button>
              )}

              {(status === 'CONFIRMED' || status === 'CHECKED_IN') && (
                <Button
                  variant="danger"
                  className="w-full"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Tem a certeza que pretende cancelar esta reserva? Esta acção não pode ser desfeita.',
                      )
                    ) {
                      cancelMutation.mutate()
                    }
                  }}
                  disabled={cancelMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  {cancelMutation.isPending ? 'A cancelar...' : 'Cancelar Reserva'}
                </Button>
              )}

              {(status === 'CHECKED_OUT' || status === 'CANCELLED' || status === 'NO_SHOW') && (
                <p className="text-center text-sm text-gray-400">Reserva finalizada.</p>
              )}

              <div className="border-t border-gray-100 pt-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/dashboard/invoicing/new?reservationId=${id}`)
                  }
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Emitir Fatura
                </Button>
              </div>

              <Button variant="ghost" className="w-full text-gray-500" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardTitle className="mb-3">Observações / Notas</CardTitle>
            <CardContent>
              <textarea
                ref={notesRef}
                className="min-h-[100px] w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                placeholder="Adicionar notas internas sobre esta reserva..."
                value={notesValue ?? r.notes ?? ''}
                onChange={(e) => setNotesValue(e.target.value)}
                onBlur={(e) => {
                  const val = e.target.value
                  if (val !== (r.notes ?? '')) {
                    notesMutation.mutate(val)
                  }
                }}
              />
              {notesMutation.isPending && (
                <p className="mt-1 text-xs text-gray-400">A guardar...</p>
              )}
              {notesMutation.isSuccess && (
                <p className="mt-1 text-xs text-green-600">Guardado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Associated sales */}
      {r.sales?.length > 0 && (
        <Card>
          <CardTitle className="mb-4">Vendas Associadas</CardTitle>
          <CardContent>
            <ul className="divide-y divide-gray-100">
              {r.sales.map((sale: any) => (
                <li
                  key={sale.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                >
                  <span className="text-gray-500">{formatDateTime(sale.createdAt)}</span>
                  <span className="font-semibold text-gray-900">{formatKwanza(sale.totalAmount)}</span>
                  <Badge variant={sale.status === 'INVOICED' ? 'success' : 'warning'}>
                    {sale.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  strong,
}: {
  label: string
  value?: string | null
  strong?: boolean
}) {
  return (
    <div>
      <dt className="text-gray-500">{label}</dt>
      <dd className={strong ? 'font-semibold text-gray-900' : 'text-gray-800'}>{value ?? '—'}</dd>
    </div>
  )
}

function ChargeRow({
  label,
  sub,
  value,
  negative,
  muted,
}: {
  label: string
  sub?: string
  value: string
  negative?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? 'text-gray-400' : 'text-gray-700'}>
        {label}
        {sub && <span className="ml-1 text-gray-400">({sub})</span>}
      </span>
      <span className={negative ? 'text-red-600' : muted ? 'text-gray-400' : 'text-gray-900'}>
        {value}
      </span>
    </div>
  )
}

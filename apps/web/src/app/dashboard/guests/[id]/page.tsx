'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import api from '@/lib/api'
import { formatKwanza, formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  User,
  Mail,
  Phone,
  Globe,
  CreditCard,
  Award,
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const RESERVATION_STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmada',
  CHECKED_IN: 'Check-in',
  CHECKED_OUT: 'Check-out',
  CANCELLED: 'Cancelada',
  PENDING: 'Pendente',
}

const RESERVATION_STATUS_VARIANT: Record<string, 'success' | 'info' | 'danger' | 'warning' | 'default'> = {
  CONFIRMED: 'info',
  CHECKED_IN: 'success',
  CHECKED_OUT: 'default',
  CANCELLED: 'danger',
  PENDING: 'warning',
}

const DOCUMENT_TYPES = [
  { value: 'PASSPORT', label: 'Passaporte' },
  { value: 'BI', label: 'Bilhete de Identidade' },
  { value: 'DRIVER_LICENSE', label: 'Carta de Condução' },
  { value: 'OTHER', label: 'Outro' },
]

// ─── Loyalty Tier ────────────────────────────────────────────────────────────

function getLoyaltyTier(totalSpent: number): { label: string; className: string; icon: string } {
  if (totalSpent >= 2_000_000) {
    return { label: 'Gold', className: 'bg-yellow-100 text-yellow-800 border border-yellow-300', icon: '🥇' }
  }
  if (totalSpent >= 500_000) {
    return { label: 'Silver', className: 'bg-gray-100 text-gray-700 border border-gray-300', icon: '🥈' }
  }
  return { label: 'Bronze', className: 'bg-amber-100 text-amber-800 border border-amber-300', icon: '🥉' }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GuestDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState(false)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const [notesSaved, setNotesSaved] = useState(false)

  // ── Guest fetch
  const { data: guest, isLoading: guestLoading } = useQuery({
    queryKey: ['guest', id],
    queryFn: () => api.get(`/guests/${id}`).then((r) => r.data.data),
  })

  // ── Reservations fetch (to compute stats)
  const { data: reservationsData } = useQuery({
    queryKey: ['guest-reservations', id],
    queryFn: () =>
      api.get('/reservations', { params: { guestId: id, limit: 100 } }).then((r) => r.data),
    enabled: !!id,
  })

  const reservations: any[] = reservationsData?.data ?? guest?.reservations ?? []

  // ── Computed stats
  const totalSpent = reservations.reduce(
    (sum: number, r: any) => sum + parseFloat(r.totalAmount ?? r.total ?? 0),
    0,
  )
  const lastVisit = reservations
    .filter((r: any) => r.checkOut)
    .sort((a: any, b: any) => new Date(b.checkOut).getTime() - new Date(a.checkOut).getTime())[0]
  const recentReservations = [...reservations]
    .sort((a: any, b: any) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime())
    .slice(0, 5)

  const tier = getLoyaltyTier(totalSpent)

  // ── Patch mutation
  const patchMutation = useMutation({
    mutationFn: (payload: Record<string, string>) => api.patch(`/guests/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest', id] })
      setEditSuccess(true)
      setEditError('')
      setTimeout(() => setEditSuccess(false), 3000)
    },
    onError: (err: any) => {
      setEditError(err.response?.data?.error || 'Erro ao guardar alterações')
    },
  })

  // ── Notes auto-save mutation
  const notesMutation = useMutation({
    mutationFn: (notes: string) => api.patch(`/guests/${id}`, { notes }),
    onSuccess: () => {
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    },
  })

  function openEdit() {
    if (guest) {
      setEditForm({
        name: guest.name ?? '',
        email: guest.email ?? '',
        phone: guest.phone ?? '',
        country: guest.country ?? '',
        nationality: guest.nationality ?? '',
        documentType: guest.documentType ?? '',
        documentNumber: guest.documentNumber ?? '',
      })
    }
    setEditOpen(true)
    setEditError('')
    setEditSuccess(false)
  }

  function handleEditChange(field: string, value: string) {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    patchMutation.mutate(editForm)
  }

  function handleNotesBlur() {
    if (notesRef.current) {
      notesMutation.mutate(notesRef.current.value)
    }
  }

  // ── Initials
  function initials(name: string) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('')
  }

  // ── Loading / not found
  if (guestLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        A carregar perfil do hóspede...
      </div>
    )
  }
  if (!guest) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
        <User className="h-12 w-12 text-gray-300" />
        <p>Hóspede não encontrado</p>
        <Link href="/dashboard/guests" className="text-sm text-primary hover:underline">
          Voltar à lista
        </Link>
      </div>
    )
  }

  const visitCount = reservations.length
  const isRecurring = visitCount > 1

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/guests"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Hóspedes
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">{guest.name}</h1>
        {isRecurring && (
          <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
            Hóspede Recorrente
          </span>
        )}
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ════ LEFT COLUMN ════ */}
        <div className="space-y-5 lg:col-span-1">
          {/* Profile card */}
          <Card>
            <div className="flex flex-col items-center gap-3 pb-4 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {initials(guest.name)}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{guest.name}</p>
                {guest.email && (
                  <p className="flex items-center justify-center gap-1 text-sm text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    {guest.email}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2 border-t pt-4 text-sm">
              {guest.phone && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {guest.phone}
                </div>
              )}
              {guest.nationality && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Globe className="h-4 w-4 text-gray-400" />
                  Nacionalidade: {guest.nationality}
                </div>
              )}
              {guest.country && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Globe className="h-4 w-4 text-gray-400" />
                  País: {guest.country}
                </div>
              )}
              {(guest.documentType || guest.documentNumber) && (
                <div className="flex items-center gap-2 text-gray-700">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  {DOCUMENT_TYPES.find((d) => d.value === guest.documentType)?.label ??
                    guest.documentType}
                  {guest.documentNumber ? `: ${guest.documentNumber}` : ''}
                </div>
              )}
            </div>
            <div className="mt-4 border-t pt-3">
              <button
                onClick={() => (editOpen ? setEditOpen(false) : openEdit())}
                className="flex w-full items-center justify-between text-sm font-medium text-primary hover:underline"
              >
                Editar dados
                {editOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </Card>

          {/* Edit form (collapsible) */}
          {editOpen && (
            <Card>
              <CardTitle className="mb-4">Editar Hóspede</CardTitle>
              <CardContent>
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  {(
                    [
                      { field: 'name', label: 'Nome', type: 'text' },
                      { field: 'email', label: 'Email', type: 'email' },
                      { field: 'phone', label: 'Telefone', type: 'tel' },
                      { field: 'country', label: 'País', type: 'text' },
                      { field: 'nationality', label: 'Nacionalidade', type: 'text' },
                    ] as const
                  ).map(({ field, label, type }) => (
                    <div key={field}>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        {label}
                      </label>
                      <input
                        type={type}
                        value={editForm[field] ?? ''}
                        onChange={(e) => handleEditChange(field, e.target.value)}
                        className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Tipo de Documento
                    </label>
                    <select
                      value={editForm.documentType ?? ''}
                      onChange={(e) => handleEditChange('documentType', e.target.value)}
                      className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="">Selecionar tipo</option>
                      {DOCUMENT_TYPES.map((d) => (
                        <option key={d.value} value={d.value}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Número do Documento
                    </label>
                    <input
                      type="text"
                      value={editForm.documentNumber ?? ''}
                      onChange={(e) => handleEditChange('documentNumber', e.target.value)}
                      className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>
                  {editError && <p className="text-xs text-red-600">{editError}</p>}
                  {editSuccess && (
                    <p className="text-xs text-green-600">Dados guardados com sucesso!</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button type="submit" size="sm" disabled={patchMutation.isPending}>
                      {patchMutation.isPending ? 'A guardar...' : 'Guardar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardTitle className="mb-3">Notas Internas</CardTitle>
            <CardContent>
              <textarea
                ref={notesRef}
                defaultValue={guest.notes ?? ''}
                onBlur={handleNotesBlur}
                rows={4}
                placeholder="Adicionar notas sobre este hóspede..."
                className="w-full resize-none rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              {notesSaved && (
                <p className="mt-1 text-xs text-green-600">Notas guardadas automaticamente</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ════ RIGHT COLUMN ════ */}
        <div className="space-y-5 lg:col-span-2">
          {/* Stats row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Nº de Estadas"
              value={visitCount}
              icon={<User className="h-5 w-5" />}
            />
            <StatCard
              title="Total Gasto"
              value={formatKwanza(totalSpent)}
              icon={<Award className="h-5 w-5" />}
            />
            <StatCard
              title="Última Visita"
              value={lastVisit ? formatDate(lastVisit.checkOut) : '—'}
            />
          </div>

          {/* Stay history */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <CardTitle>Histórico de Estadias</CardTitle>
              <span className="text-xs text-gray-400">{visitCount} reserva{visitCount !== 1 ? 's' : ''} no total</span>
            </div>
            <CardContent className="p-0">
              {recentReservations.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">Nenhuma reserva registada</p>
              ) : (
                <div className="divide-y">
                  {recentReservations.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {r.checkIn ? formatDate(r.checkIn) : '—'}
                          <span className="mx-1 text-gray-400">→</span>
                          {r.checkOut ? formatDate(r.checkOut) : '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Quarto {r.room?.number ?? r.roomNumber ?? '—'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatKwanza(r.totalAmount ?? r.total ?? 0)}
                        </span>
                        <Badge variant={RESERVATION_STATUS_VARIANT[r.status] ?? 'default'}>
                          {RESERVATION_STATUS_LABEL[r.status] ?? r.status}
                        </Badge>
                        <Link
                          href={`/dashboard/reservations/${r.id}`}
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Ver
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loyalty section */}
          <Card>
            <CardTitle className="mb-4">Programa de Fidelidade</CardTitle>
            <CardContent>
              <div className="flex items-center gap-4">
                <div
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${tier.className}`}
                >
                  <span>{tier.icon}</span>
                  <span>Nível {tier.label}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {totalSpent < 500_000 && (
                    <span>
                      Faltam {formatKwanza(500_000 - totalSpent)} para Silver
                    </span>
                  )}
                  {totalSpent >= 500_000 && totalSpent < 2_000_000 && (
                    <span>
                      Faltam {formatKwanza(2_000_000 - totalSpent)} para Gold
                    </span>
                  )}
                  {totalSpent >= 2_000_000 && (
                    <span className="text-yellow-700">Nível máximo atingido</span>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>0 AOA</span>
                  <span>Bronze → Silver: 500.000 AOA</span>
                  <span>Gold: 2.000.000 AOA</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, (totalSpent / 2_000_000) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews (if any) */}
          {guest.reviews?.length > 0 && (
            <Card>
              <CardTitle className="mb-4">Avaliações</CardTitle>
              <CardContent>
                <ul className="space-y-3">
                  {guest.reviews.map((review: any) => (
                    <li key={review.id} className="rounded-lg border bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-yellow-500">
                          {'★'.repeat(review.rating)}
                          <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

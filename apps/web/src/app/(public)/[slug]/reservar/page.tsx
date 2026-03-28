'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { CheckCircle, BedDouble, Users, Calendar, ChevronRight, Loader2, AlertCircle, Home } from 'lucide-react'
import { checkAvailability, createBooking } from '@/lib/public-api'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatKwanza(value: number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value)
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })
}

function todayString() {
  return new Date().toISOString().split('T')[0]
}

function minCheckOut(checkIn: string) {
  if (!checkIn) return todayString()
  const d = new Date(checkIn)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function calcNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0
  return Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Room {
  id: string
  name: string
  type: string
  capacity: number
  floor?: number
  pricePerNight: number
  description?: string
}

interface BookingResult {
  id: string
  guestName: string
  roomName?: string
  checkIn: string
  checkOut: string
  totalAmount: number
}

interface SearchData {
  checkIn: string
  checkOut: string
  adults: number
  children: number
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = [
  { label: 'Datas', num: 1 },
  { label: 'Quarto', num: 2 },
  { label: 'Dados', num: 3 },
]

function StepIndicator({ current }: { current: number }) {
  if (current === 4) return null
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => (
        <div key={step.num} className="flex items-center">
          {/* Circle */}
          <div className="flex flex-col items-center">
            <div
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-300',
                current === step.num
                  ? 'text-white border-[#1A3E6E] bg-[#1A3E6E]'
                  : current > step.num
                    ? 'text-white border-[#1A3E6E] bg-[#1A3E6E] opacity-70'
                    : 'text-gray-400 border-gray-300 bg-white',
              ].join(' ')}
            >
              {current > step.num ? '✓' : step.num}
            </div>
            <span
              className={[
                'mt-1 text-xs font-medium',
                current >= step.num ? 'text-[#1A3E6E]' : 'text-gray-400',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
          {/* Connector line */}
          {idx < STEPS.length - 1 && (
            <div
              className={[
                'w-16 sm:w-24 h-0.5 mb-5 mx-1 transition-colors duration-300',
                current > step.num ? 'bg-[#1A3E6E]' : 'bg-gray-200',
              ].join(' ')}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Room type badge colours
// ---------------------------------------------------------------------------

const ROOM_TYPE_COLOURS: Record<string, string> = {
  STANDARD: 'bg-gray-100 text-gray-700',
  SUPERIOR: 'bg-blue-100 text-blue-700',
  DELUXE: 'bg-indigo-100 text-indigo-700',
  SUITE: 'bg-purple-100 text-purple-700',
  VILLA: 'bg-teal-100 text-teal-700',
  BUNGALOW: 'bg-amber-100 text-amber-700',
}

function roomTypeBadge(type: string) {
  return ROOM_TYPE_COLOURS[type?.toUpperCase()] ?? 'bg-gray-100 text-gray-700'
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ReservarPage() {
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const slug = params.slug

  // Wizard state
  const [step, setStep] = useState(1)
  const [searchData, setSearchData] = useState<SearchData>({
    checkIn: searchParams.get('checkIn') ?? '',
    checkOut: searchParams.get('checkOut') ?? '',
    adults: Number(searchParams.get('adults') ?? 2),
    children: 0,
  })
  const [availableRooms, setAvailableRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reservation, setReservation] = useState<BookingResult | null>(null)

  // Guest form state
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('+244 ')
  const [paymentMethod, setPaymentMethod] = useState('MULTICAIXA')
  const [notes, setNotes] = useState('')

  // Pre-select roomId from query params after availability is loaded
  const queryRoomId = searchParams.get('roomId')

  useEffect(() => {
    if (queryRoomId && availableRooms.length > 0) {
      const room = availableRooms.find((r) => r.id === queryRoomId)
      if (room) {
        setSelectedRoom(room)
        setStep(3)
      }
    }
  }, [queryRoomId, availableRooms])

  // If searchParams have both dates, auto-run availability search on mount
  useEffect(() => {
    const ci = searchParams.get('checkIn')
    const co = searchParams.get('checkOut')
    const ad = Number(searchParams.get('adults') ?? 2)
    if (ci && co) {
      handleSearch(ci, co, ad)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleSearch(ci?: string, co?: string, ad?: number) {
    const checkIn = ci ?? searchData.checkIn
    const checkOut = co ?? searchData.checkOut
    const adults = ad ?? searchData.adults

    if (!checkIn || !checkOut) {
      setError('Por favor, selecione as datas de check-in e check-out.')
      return
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('A data de check-out deve ser posterior ao check-in.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const rooms = await checkAvailability(slug, checkIn, checkOut, adults)
      setAvailableRooms(rooms)
      setSearchData((prev) => ({ ...prev, checkIn, checkOut, adults }))
      setStep(2)
    } catch {
      setError('Erro ao verificar disponibilidade. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectRoom(room: Room) {
    setSelectedRoom(room)
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleConfirmBooking() {
    if (!selectedRoom) return

    if (!guestName.trim()) { setError('Por favor, insira o seu nome completo.'); return }
    if (!guestEmail.trim() || !guestEmail.includes('@')) { setError('Por favor, insira um email válido.'); return }
    if (!guestPhone.trim() || guestPhone === '+244 ') { setError('Por favor, insira o seu número de telefone.'); return }

    const nights = calcNights(searchData.checkIn, searchData.checkOut)
    const subtotal = selectedRoom.pricePerNight * nights
    const iva = subtotal * 0.14
    const total = subtotal + iva

    setError('')
    setLoading(true)
    try {
      const result = await createBooking(slug, {
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        roomId: selectedRoom.id,
        checkIn: searchData.checkIn,
        checkOut: searchData.checkOut,
        adults: searchData.adults,
        children: searchData.children,
        totalAmount: total,
        notes: notes.trim() || undefined,
      })
      setReservation(result)
      setStep(4)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao confirmar reserva. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const nights = calcNights(searchData.checkIn, searchData.checkOut)
  const subtotal = selectedRoom ? selectedRoom.pricePerNight * nights : 0
  const iva = subtotal * 0.14
  const total = subtotal + iva

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  function ErrorBanner() {
    if (!error) return null
    return (
      <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <span>{error}</span>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Step 1 — Search
  // ---------------------------------------------------------------------------

  function renderStep1() {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Verificar Disponibilidade</h2>
          <ErrorBanner />

          <div className="space-y-5">
            {/* Check-in */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Data de Check-in
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  min={todayString()}
                  value={searchData.checkIn}
                  onChange={(e) => {
                    const val = e.target.value
                    setSearchData((prev) => ({
                      ...prev,
                      checkIn: val,
                      checkOut: prev.checkOut && prev.checkOut <= val ? '' : prev.checkOut,
                    }))
                  }}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E] focus:border-transparent"
                />
              </div>
            </div>

            {/* Check-out */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Data de Check-out
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  min={minCheckOut(searchData.checkIn)}
                  value={searchData.checkOut}
                  onChange={(e) => setSearchData((prev) => ({ ...prev, checkOut: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E] focus:border-transparent"
                />
              </div>
            </div>

            {/* Guests row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Users className="inline h-4 w-4 mr-1 -mt-0.5" />
                  Adultos
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={searchData.adults}
                  onChange={(e) =>
                    setSearchData((prev) => ({ ...prev, adults: Math.max(1, Math.min(10, Number(e.target.value))) }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Users className="inline h-4 w-4 mr-1 -mt-0.5" />
                  Crianças
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={searchData.children}
                  onChange={(e) =>
                    setSearchData((prev) => ({ ...prev, children: Math.max(0, Math.min(10, Number(e.target.value))) }))
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E] focus:border-transparent"
                />
              </div>
            </div>

            {/* Nights preview */}
            {nights > 0 && (
              <p className="text-sm text-gray-500 text-center">
                {nights} {nights === 1 ? 'noite' : 'noites'} selecionada{nights !== 1 ? 's' : ''}
              </p>
            )}

            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1A3E6E] text-white font-semibold rounded-lg hover:bg-[#15325a] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> A verificar...</>
              ) : (
                <><Calendar className="h-5 w-5" /> Verificar Disponibilidade</>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Step 2 — Room selection
  // ---------------------------------------------------------------------------

  function renderStep2() {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quartos Disponíveis</h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(searchData.checkIn)} → {formatDate(searchData.checkOut)} &middot;{' '}
              {nights} {nights === 1 ? 'noite' : 'noites'} &middot;{' '}
              {searchData.adults} {searchData.adults === 1 ? 'adulto' : 'adultos'}
              {searchData.children > 0 && `, ${searchData.children} ${searchData.children === 1 ? 'criança' : 'crianças'}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setStep(1); setError('') }}
            className="text-sm text-[#1A3E6E] font-medium hover:underline flex items-center gap-1"
          >
            Alterar datas
          </button>
        </div>

        <ErrorBanner />

        {availableRooms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center">
            <BedDouble className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Sem disponibilidade</h3>
            <p className="text-sm text-gray-500 mb-6">
              Não há quartos disponíveis para as datas e número de hóspedes selecionados.
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A3E6E] text-white text-sm font-semibold rounded-lg hover:bg-[#15325a] transition-colors"
            >
              Tentar outras datas
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {availableRooms.map((room) => {
              const roomTotal = room.pricePerNight * nights
              const isSelected = selectedRoom?.id === room.id
              return (
                <div
                  key={room.id}
                  className={[
                    'bg-white rounded-2xl shadow overflow-hidden flex flex-col transition-all duration-200',
                    isSelected ? 'ring-2 ring-[#1A3E6E] shadow-lg' : 'hover:shadow-md',
                  ].join(' ')}
                >
                  {/* Gradient header */}
                  <div className="h-32 bg-gradient-to-br from-[#1A3E6E] to-[#0f7d7d] flex items-end p-4">
                    <div>
                      <span
                        className={[
                          'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1',
                          roomTypeBadge(room.type),
                        ].join(' ')}
                      >
                        {room.type}
                      </span>
                      <h3 className="text-white font-bold text-lg leading-tight">{room.name}</h3>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5 flex flex-col flex-1">
                    {room.description && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{room.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-gray-400" />
                        {room.capacity} {room.capacity === 1 ? 'hóspede' : 'hóspedes'}
                      </span>
                      {room.floor != null && (
                        <span className="flex items-center gap-1.5">
                          <BedDouble className="h-4 w-4 text-gray-400" />
                          Piso {room.floor}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto">
                      <div className="flex items-end justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-400">por noite</p>
                          <p className="text-base font-semibold text-gray-800">{formatKwanza(room.pricePerNight)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{nights} {nights === 1 ? 'noite' : 'noites'}</p>
                          <p className="text-lg font-bold text-[#1A3E6E]">{formatKwanza(roomTotal)}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectRoom(room)}
                        className={[
                          'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200',
                          isSelected
                            ? 'bg-[#1A3E6E] text-white'
                            : 'bg-[#1A3E6E]/10 text-[#1A3E6E] hover:bg-[#1A3E6E] hover:text-white',
                        ].join(' ')}
                      >
                        {isSelected ? (
                          <><CheckCircle className="h-4 w-4" /> Selecionado</>
                        ) : (
                          <>Selecionar <ChevronRight className="h-4 w-4" /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Step 3 — Guest details
  // ---------------------------------------------------------------------------

  function renderStep3() {
    if (!selectedRoom) return null

    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Dados do Hóspede</h2>
          <button
            type="button"
            onClick={() => { setStep(2); setError('') }}
            className="text-sm text-[#1A3E6E] font-medium hover:underline flex items-center gap-1"
          >
            Alterar quarto
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form — left/centre */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow p-6 sm:p-8">
              <ErrorBanner />

              <div className="space-y-5">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="ex. João da Silva"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E] focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="ex. joao@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E] focus:border-transparent"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Telefone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+244 923 000 000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E] focus:border-transparent"
                  />
                </div>

                {/* Método de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Método de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A3E6E] focus:border-transparent"
                  >
                    <option value="MULTICAIXA">Multicaixa Express</option>
                    <option value="CASH">Numerário (Dinheiro)</option>
                    <option value="BANK_TRANSFER">Transferência Bancária</option>
                    <option value="CARD">Cartão Bancário</option>
                  </select>
                  <p className="mt-1.5 text-xs text-gray-400">
                    O pagamento será processado no check-in.
                  </p>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notas / Pedidos especiais
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Alergias, preferências, hora de chegada prevista..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3E6E] focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1A3E6E] text-white font-semibold rounded-lg hover:bg-[#15325a] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> A confirmar reserva...</>
                ) : (
                  <><CheckCircle className="h-5 w-5" /> Confirmar Reserva</>
                )}
              </button>
            </div>
          </div>

          {/* Summary — right */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow p-6 sticky top-24">
              <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Resumo da Reserva
              </h3>

              {/* Room info */}
              <div className="mb-4">
                <div className="h-16 rounded-lg bg-gradient-to-br from-[#1A3E6E] to-[#0f7d7d] flex items-center px-4 mb-3">
                  <div>
                    <span className="text-white/70 text-xs">{selectedRoom.type}</span>
                    <p className="text-white font-semibold text-sm">{selectedRoom.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>
                    {searchData.adults} {searchData.adults === 1 ? 'adulto' : 'adultos'}
                    {searchData.children > 0 && `, ${searchData.children} ${searchData.children === 1 ? 'criança' : 'crianças'}`}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Check-in</span>
                  <span className="font-medium text-gray-800">{formatDate(searchData.checkIn)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Check-out</span>
                  <span className="font-medium text-gray-800">{formatDate(searchData.checkOut)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Noites</span>
                  <span className="font-medium text-gray-800">{nights}</span>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    {formatKwanza(selectedRoom.pricePerNight)} &times; {nights} {nights === 1 ? 'noite' : 'noites'}
                  </span>
                  <span className="text-gray-800">{formatKwanza(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IVA (14%)</span>
                  <span className="text-gray-800">{formatKwanza(iva)}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="font-bold text-gray-900">Total</span>
                <span className="text-xl font-bold text-[#1A3E6E]">{formatKwanza(total)}</span>
              </div>

              <p className="mt-3 text-xs text-gray-400 text-center">
                Pagamento efectuado no check-in.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Step 4 — Confirmation
  // ---------------------------------------------------------------------------

  function renderStep4() {
    if (!reservation) return null
    const resNights = calcNights(reservation.checkIn, reservation.checkOut)
    const resSubtotal = reservation.totalAmount / 1.14
    const resIva = reservation.totalAmount - resSubtotal

    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reserva Confirmada!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Número de Reserva:{' '}
            <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
              {reservation.id.slice(0, 8).toUpperCase()}
            </span>
          </p>

          {/* Details card */}
          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Hóspede</span>
              <span className="font-medium text-gray-800">{reservation.guestName}</span>
            </div>
            {reservation.roomName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quarto</span>
                <span className="font-medium text-gray-800">{reservation.roomName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Check-in</span>
              <span className="font-medium text-gray-800">{formatDate(reservation.checkIn)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Check-out</span>
              <span className="font-medium text-gray-800">{formatDate(reservation.checkOut)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Noites</span>
              <span className="font-medium text-gray-800">{resNights}</span>
            </div>
            <div className="pt-2 border-t border-gray-200 flex justify-between text-sm">
              <span className="text-gray-500">IVA (14%)</span>
              <span className="text-gray-700">{formatKwanza(resIva)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-lg text-[#1A3E6E]">{formatKwanza(reservation.totalAmount)}</span>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-blue-800">
              Receberá um email de confirmação em breve. Para qualquer questão, contacte-nos directamente através dos
              nossos canais de apoio ao cliente.
            </p>
          </div>

          {/* Back button */}
          <button
            type="button"
            onClick={() => router.push(`/${slug}`)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1A3E6E] text-white font-semibold rounded-lg hover:bg-[#15325a] transition-colors duration-200"
          >
            <Home className="h-4 w-4" />
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Page title */}
        {step !== 4 && (
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Fazer Reserva</h1>
            <p className="text-gray-500 text-sm sm:text-base">
              Reserve o seu quarto em poucos minutos, com confirmação imediata.
            </p>
          </div>
        )}

        {/* Step indicator */}
        <StepIndicator current={step} />

        {/* Step content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </div>
    </div>
  )
}

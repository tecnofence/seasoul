'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, CalendarPlus } from 'lucide-react'

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']

export default function NewSpaBookingPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const [guestName, setGuestName] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('09:00')
  const [therapist, setTherapist] = useState('')
  const [notes, setNotes] = useState('')

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ['spa-services-list'],
    queryFn: () => api.get('/spa/services').then((r) => r.data.data ?? r.data),
  })

  const services: any[] = Array.isArray(servicesData) ? servicesData : (servicesData?.items ?? [])

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/spa/bookings', {
        guestName: guestName || undefined,
        roomNumber: roomNumber || undefined,
        serviceId: serviceId || undefined,
        date: date ? new Date(`${date}T${time}:00`).toISOString() : undefined,
        time,
        therapist: therapist || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      router.push('/dashboard/spa')
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Erro ao criar reserva de spa')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!guestName.trim()) {
      setError('O nome do hóspede é obrigatório.')
      return
    }
    if (!date) {
      setError('A data é obrigatória.')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/spa"
          className="rounded-md p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Reserva de Spa</h1>
          <p className="text-sm text-gray-500">Preencha os dados para agendar o serviço</p>
        </div>
      </div>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-primary" />
          Dados da Reserva
        </CardTitle>
        <CardContent>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && (
              <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
            )}

            {/* Hóspede e Quarto */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Hóspede <span className="text-red-500">*</span>
                </label>
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nome do hóspede"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Quarto
                </label>
                <Input
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="Número do quarto"
                />
              </div>
            </div>

            {/* Serviço */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Serviço
              </label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={loadingServices}
              >
                <option value="">
                  {loadingServices ? 'A carregar serviços...' : '— Selecionar serviço —'}
                </option>
                {services.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.price != null ? ` — ${formatKwanza(s.price)}` : ''}
                    {s.duration ? ` (${s.duration} min)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Data <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Hora <span className="text-red-500">*</span>
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Terapeuta */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Terapeuta <span className="text-xs text-gray-400">(opcional)</span>
              </label>
              <Input
                value={therapist}
                onChange={(e) => setTherapist(e.target.value)}
                placeholder="Nome do terapeuta"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notas <span className="text-xs text-gray-400">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações ou pedidos especiais..."
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'A criar...' : 'Criar Reserva'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

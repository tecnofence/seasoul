'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sparkles, Plus, Clock, Calendar } from 'lucide-react'

const BOOKING_STATUS_LABEL: Record<string, string> = { PENDING: 'Pendente', CONFIRMED: 'Confirmada', IN_PROGRESS: 'Em Curso', COMPLETED: 'Concluída', CANCELLED: 'Cancelada', NO_SHOW: 'Não Compareceu' }
const BOOKING_STATUS_COLOR: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', CONFIRMED: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-purple-100 text-purple-700', COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700', NO_SHOW: 'bg-gray-100 text-gray-700' }

export default function SpaPage() {
  const router = useRouter()

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ['spa-services'],
    queryFn: () => api.get('/spa/services', { params: { limit: 50 } }).then((r) => r.data),
  })

  const { data: bookingsData, isLoading: loadingBookings } = useQuery({
    queryKey: ['spa-bookings'],
    queryFn: () => api.get('/spa/bookings', { params: { limit: 50 } }).then((r) => r.data),
  })

  const services = servicesData?.data ?? []
  const bookings = bookingsData?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Spa</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push('/dashboard/spa/bookings/new')}><Plus className="mr-2 h-4 w-4" /> Nova Reserva</Button>
          <Button onClick={() => router.push('/dashboard/spa/services/new')}><Plus className="mr-2 h-4 w-4" /> Novo Serviço</Button>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Serviços</h2>
        {loadingServices ? <p className="text-gray-500">A carregar...</p> : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s: any) => (
              <div key={s.id} className="cursor-pointer rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md" onClick={() => router.push(`/dashboard/spa/services/${s.id}`)}>
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Sparkles className="h-5 w-5 text-primary" /></div>
                    <h3 className="font-semibold">{s.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="font-medium text-gray-900">{formatKwanza(s.price)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration} min</span>
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <div className="col-span-full rounded-lg border bg-white p-12 text-center">
                <Sparkles className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-gray-500">Nenhum serviço registado</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-gray-800">Reservas de Hoje</h2>
        {loadingBookings ? <p className="text-gray-500">A carregar...</p> : (
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hóspede</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Serviço</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((b: any) => (
                  <tr key={b.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/spa/bookings/${b.id}`)}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{b.guestName ?? b.guest?.name ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{b.serviceName ?? b.service?.name ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">{b.dateTime ? formatDateTime(b.dateTime) : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BOOKING_STATUS_COLOR[b.status] ?? ''}`}>{BOOKING_STATUS_LABEL[b.status] ?? b.status}</span>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-500">Nenhuma reserva para hoje</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

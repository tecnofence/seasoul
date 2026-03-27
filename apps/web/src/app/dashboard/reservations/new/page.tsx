'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle } from '@/components/ui/card'

const schema = z.object({
  resortId: z.string().min(1, 'Resort obrigatório'),
  roomId: z.string().min(1, 'Quarto obrigatório'),
  guestName: z.string().min(2, 'Nome obrigatório'),
  guestEmail: z.string().email('Email inválido'),
  guestPhone: z.string().min(9, 'Telefone inválido'),
  checkIn: z.string().min(1, 'Check-in obrigatório'),
  checkOut: z.string().min(1, 'Check-out obrigatório'),
  adults: z.coerce.number().int().positive(),
  children: z.coerce.number().int().min(0).default(0),
  totalAmount: z.coerce.number().positive('Valor obrigatório'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewReservationPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { data: rooms } = useQuery({
    queryKey: ['rooms-available'],
    queryFn: () => api.get('/rooms', { params: { limit: 100, status: 'AVAILABLE' } }).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { adults: 2, children: 0 },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/reservations', {
        ...data,
        checkIn: new Date(data.checkIn).toISOString(),
        checkOut: new Date(data.checkOut).toISOString(),
      }),
    onSuccess: () => router.push('/dashboard/reservations'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar reserva'),
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Nova Reserva</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Resort</label>
              <select {...register('resortId')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="">Selecionar...</option>
                {[...new Map((rooms || []).map((r: any) => [r.resort?.id, r.resort])).values()].map((resort: any) => (
                  <option key={resort?.id} value={resort?.id}>{resort?.name}</option>
                ))}
              </select>
              {errors.resortId && <p className="text-xs text-red-500 mt-1">{errors.resortId.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Quarto</label>
              <select {...register('roomId')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="">Selecionar...</option>
                {(rooms || []).map((room: any) => (
                  <option key={room.id} value={room.id}>#{room.number} — {room.type}</option>
                ))}
              </select>
              {errors.roomId && <p className="text-xs text-red-500 mt-1">{errors.roomId.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Nome do Hóspede</label>
            <Input {...register('guestName')} placeholder="Nome completo" />
            {errors.guestName && <p className="text-xs text-red-500 mt-1">{errors.guestName.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input {...register('guestEmail')} type="email" placeholder="email@exemplo.com" />
              {errors.guestEmail && <p className="text-xs text-red-500 mt-1">{errors.guestEmail.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <Input {...register('guestPhone')} placeholder="+244 9XX XXX XXX" />
              {errors.guestPhone && <p className="text-xs text-red-500 mt-1">{errors.guestPhone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Check-in</label>
              <Input {...register('checkIn')} type="datetime-local" />
              {errors.checkIn && <p className="text-xs text-red-500 mt-1">{errors.checkIn.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Check-out</label>
              <Input {...register('checkOut')} type="datetime-local" />
              {errors.checkOut && <p className="text-xs text-red-500 mt-1">{errors.checkOut.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Adultos</label>
              <Input {...register('adults')} type="number" min={1} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Crianças</label>
              <Input {...register('children')} type="number" min={0} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Valor Total (AOA)</label>
              <Input {...register('totalAmount')} type="number" min={0} step="0.01" />
              {errors.totalAmount && <p className="text-xs text-red-500 mt-1">{errors.totalAmount.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea {...register('notes')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Observações..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Reserva'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

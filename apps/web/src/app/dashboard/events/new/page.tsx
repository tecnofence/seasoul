'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const EVENT_TYPES = [
  { value: 'WEDDING', label: 'Casamento' },
  { value: 'CORPORATE', label: 'Corporativo' },
  { value: 'CONFERENCE', label: 'Conferência' },
  { value: 'PARTY', label: 'Festa' },
  { value: 'CONCERT', label: 'Concerto' },
  { value: 'EXHIBITION', label: 'Exposição' },
  { value: 'OTHER', label: 'Outro' },
]

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  eventType: z.enum(['WEDDING', 'CORPORATE', 'CONFERENCE', 'PARTY', 'CONCERT', 'EXHIBITION', 'OTHER']),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  endDate: z.string().min(1, 'Data de fim obrigatória'),
  location: z.string().min(1, 'Localização obrigatória'),
  capacity: z.coerce.number().int().min(1, 'Capacidade obrigatória'),
  price: z.coerce.number().min(0).optional(),
  resortId: z.string().min(1, 'Resort obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function NewEventPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventType: 'CORPORATE',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/events', {
      ...data,
      price: data.price || undefined,
    }),
    onSuccess: () => router.push('/dashboard/events'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar evento'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Evento</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <Input {...register('name')} placeholder="Nome do evento" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Evento</label>
            <select
              {...register('eventType')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea
              {...register('description')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]"
              placeholder="Descrição do evento..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Início</label>
              <Input {...register('startDate')} type="datetime-local" />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Fim</label>
              <Input {...register('endDate')} type="datetime-local" />
              {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Localização</label>
            <Input {...register('location')} placeholder="Local do evento" />
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Capacidade</label>
              <Input {...register('capacity')} type="number" placeholder="100" />
              {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Preço (AOA, opcional)</label>
              <Input {...register('price')} type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Resort ID</label>
            <Input {...register('resortId')} placeholder="ID do resort" />
            {errors.resortId && <p className="text-xs text-red-500 mt-1">{errors.resortId.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Evento'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

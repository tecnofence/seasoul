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

const CATEGORIES = [
  { value: 'GENERAL', label: 'Geral' },
  { value: 'ROOM', label: 'Quarto' },
  { value: 'FOOD', label: 'Alimentação' },
  { value: 'SERVICE', label: 'Serviço' },
  { value: 'CLEANLINESS', label: 'Limpeza' },
  { value: 'FACILITIES', label: 'Instalações' },
  { value: 'LOCATION', label: 'Localização' },
]

const RATINGS = [
  { value: 1, label: '1 — Muito Mau' },
  { value: 2, label: '2 — Mau' },
  { value: 3, label: '3 — Razoável' },
  { value: 4, label: '4 — Bom' },
  { value: 5, label: '5 — Excelente' },
]

const schema = z.object({
  guestName: z.string().min(2, 'Nome do hóspede obrigatório'),
  reservationId: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(1, 'Comentário obrigatório'),
  category: z.enum(['GENERAL', 'ROOM', 'FOOD', 'SERVICE', 'CLEANLINESS', 'FACILITIES', 'LOCATION']),
})

type FormData = z.infer<typeof schema>

export default function NewReviewPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      rating: 5,
      category: 'GENERAL',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/reviews', {
      ...data,
      reservationId: data.reservationId || undefined,
    }),
    onSuccess: () => router.push('/dashboard/reviews'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao registar avaliação'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Nova Avaliação</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome do Hóspede</label>
            <Input {...register('guestName')} placeholder="Nome completo" />
            {errors.guestName && <p className="text-xs text-red-500 mt-1">{errors.guestName.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">ID da Reserva (opcional)</label>
            <Input {...register('reservationId')} placeholder="ID da reserva associada" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Classificação</label>
              <select
                {...register('rating')}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {RATINGS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              {errors.rating && <p className="text-xs text-red-500 mt-1">{errors.rating.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Categoria</label>
              <select
                {...register('category')}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Comentário</label>
            <textarea
              {...register('comment')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[100px]"
              placeholder="Escreva o comentário do hóspede..."
            />
            {errors.comment && <p className="text-xs text-red-500 mt-1">{errors.comment.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A registar...' : 'Registar Avaliação'}
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

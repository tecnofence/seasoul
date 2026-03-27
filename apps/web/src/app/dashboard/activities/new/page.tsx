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
  { value: 'ADVENTURE', label: 'Aventura' },
  { value: 'AQUATIC', label: 'Aquático' },
  { value: 'NATURE', label: 'Natureza' },
  { value: 'CULTURAL', label: 'Cultural' },
  { value: 'SPORT', label: 'Desporto' },
  { value: 'WELLNESS', label: 'Bem-Estar' },
  { value: 'GASTRONOMY', label: 'Gastronomia' },
  { value: 'OTHER', label: 'Outro' },
]

const DIFFICULTIES = [
  { value: 'EASY', label: 'Fácil' },
  { value: 'MODERATE', label: 'Moderado' },
  { value: 'HARD', label: 'Difícil' },
  { value: 'EXTREME', label: 'Extremo' },
]

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  category: z.enum(['ADVENTURE', 'AQUATIC', 'NATURE', 'CULTURAL', 'SPORT', 'WELLNESS', 'GASTRONOMY', 'OTHER']),
  description: z.string().optional(),
  location: z.string().optional(),
  duration: z.coerce.number().min(1, 'Duração obrigatória'),
  maxParticipants: z.coerce.number().min(1, 'Mínimo 1 participante'),
  minAge: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0, 'Preço obrigatório'),
  difficulty: z.enum(['EASY', 'MODERATE', 'HARD', 'EXTREME']),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewActivityPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'ADVENTURE',
      difficulty: 'MODERATE',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/activities', {
      ...data,
      minAge: data.minAge || undefined,
    }),
    onSuccess: () => router.push('/dashboard/activities'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao registar atividade'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Nova Atividade</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <Input {...register('name')} placeholder="Nome da atividade" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Categoria</label>
              <select {...register('category')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Dificuldade</label>
              <select {...register('difficulty')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea {...register('description')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Descrição da atividade..." />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Localização</label>
            <Input {...register('location')} placeholder="Local da atividade" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Duração (min)</label>
              <Input {...register('duration')} type="number" placeholder="60" />
              {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Máx. Participantes</label>
              <Input {...register('maxParticipants')} type="number" placeholder="10" />
              {errors.maxParticipants && <p className="text-xs text-red-500 mt-1">{errors.maxParticipants.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Idade Mínima</label>
              <Input {...register('minAge')} type="number" placeholder="0" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Preço</label>
            <Input {...register('price')} type="number" step="0.01" placeholder="0.00" />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea {...register('notes')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Observações adicionais..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A registar...' : 'Registar Atividade'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

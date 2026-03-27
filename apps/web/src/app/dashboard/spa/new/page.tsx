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
  { value: 'MASSAGE', label: 'Massagem' },
  { value: 'FACIAL', label: 'Facial' },
  { value: 'BODY', label: 'Corpo' },
  { value: 'NAILS', label: 'Unhas' },
  { value: 'HAIR', label: 'Cabelo' },
  { value: 'THERAPY', label: 'Terapia' },
  { value: 'OTHER', label: 'Outro' },
]

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  duration: z.coerce.number().int().min(1, 'Duração obrigatória (em minutos)'),
  price: z.coerce.number().min(0, 'Preço obrigatório'),
  category: z.enum(['MASSAGE', 'FACIAL', 'BODY', 'NAILS', 'HAIR', 'THERAPY', 'OTHER']),
})

type FormData = z.infer<typeof schema>

export default function NewSpaServicePage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'MASSAGE',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/spa/services', data),
    onSuccess: () => router.push('/dashboard/spa'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar serviço de spa'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Serviço de Spa</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <Input {...register('name')} placeholder="Nome do serviço" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
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

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea
              {...register('description')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]"
              placeholder="Descrição do serviço..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Duração (minutos)</label>
              <Input {...register('duration')} type="number" placeholder="60" />
              {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Preço (AOA)</label>
              <Input {...register('price')} type="number" step="0.01" placeholder="0.00" />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Serviço'}
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

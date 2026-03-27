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
import { Card } from '@/components/ui/card'

const schema = z.object({
  resortId: z.string().min(1, 'Resort obrigatório'),
  number: z.string().min(1, 'Número obrigatório'),
  type: z.enum(['STANDARD', 'SUPERIOR', 'SUITE', 'VILLA']),
  floor: z.coerce.number().int(),
  capacity: z.coerce.number().int().positive(),
  pricePerNight: z.coerce.number().positive('Preço obrigatório'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewRoomPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { data: rooms } = useQuery({
    queryKey: ['rooms-for-resorts'],
    queryFn: () => api.get('/rooms', { params: { limit: 1 } }).then((r) => r.data),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'STANDARD', floor: 1, capacity: 2 },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/rooms', data),
    onSuccess: () => router.push('/dashboard/rooms'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar quarto'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Quarto</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Resort ID</label>
            <Input {...register('resortId')} placeholder="ID do resort" />
            {errors.resortId && <p className="text-xs text-red-500 mt-1">{errors.resortId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Número</label>
              <Input {...register('number')} placeholder="Ex: 101" />
              {errors.number && <p className="text-xs text-red-500 mt-1">{errors.number.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select {...register('type')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="STANDARD">Standard</option>
                <option value="SUPERIOR">Superior</option>
                <option value="SUITE">Suite</option>
                <option value="VILLA">Villa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Piso</label>
              <Input {...register('floor')} type="number" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Capacidade</label>
              <Input {...register('capacity')} type="number" min={1} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Preço/Noite (AOA)</label>
              <Input {...register('pricePerNight')} type="number" min={0} step="0.01" />
              {errors.pricePerNight && <p className="text-xs text-red-500 mt-1">{errors.pricePerNight.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea {...register('description')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Descrição opcional..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Quarto'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

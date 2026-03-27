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

const schema = z.object({
  resortId: z.string().min(1, 'Resort obrigatório'),
  roomType: z.enum(['STANDARD', 'SUPERIOR', 'SUITE', 'VILLA']),
  validFrom: z.string().min(1, 'Data início obrigatória'),
  validUntil: z.string().min(1, 'Data fim obrigatória'),
  pricePerNight: z.coerce.number().positive('Preço obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function NewTariffPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { roomType: 'STANDARD' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/tariffs', {
      ...data,
      validFrom: new Date(data.validFrom).toISOString(),
      validUntil: new Date(data.validUntil).toISOString(),
    }),
    onSuccess: () => router.push('/dashboard/tariffs'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar tarifa'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Nova Tarifa</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Resort ID</label>
            <Input {...register('resortId')} placeholder="ID do resort" />
            {errors.resortId && <p className="text-xs text-red-500 mt-1">{errors.resortId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Quarto</label>
            <select {...register('roomType')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="STANDARD">Standard</option>
              <option value="SUPERIOR">Superior</option>
              <option value="SUITE">Suite</option>
              <option value="VILLA">Villa</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Válido De</label>
              <Input {...register('validFrom')} type="date" />
              {errors.validFrom && <p className="text-xs text-red-500 mt-1">{errors.validFrom.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Válido Até</label>
              <Input {...register('validUntil')} type="date" />
              {errors.validUntil && <p className="text-xs text-red-500 mt-1">{errors.validUntil.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Preço/Noite (AOA)</label>
            <Input {...register('pricePerNight')} type="number" min={0} step="0.01" />
            {errors.pricePerNight && <p className="text-xs text-red-500 mt-1">{errors.pricePerNight.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Tarifa'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

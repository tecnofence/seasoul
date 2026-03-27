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
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Nome da fazenda obrigatório'),
  location: z.string().min(2, 'Localização obrigatória'),
  totalArea: z
    .string()
    .min(1, 'Área total obrigatória')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Área deve ser um número positivo'),
  resortId: z.string().min(1, 'ID do resort obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function NewFarmPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/agriculture/farms', {
        name: data.name,
        location: data.location,
        totalArea: parseFloat(data.totalArea),
        resortId: data.resortId,
      }),
    onSuccess: () => router.push('/dashboard/farms'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar fazenda'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Nova Fazenda</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome da Fazenda</label>
            <Input {...register('name')} placeholder="Nome da fazenda" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Localização</label>
            <Input {...register('location')} placeholder="Ex: Cabo Ledo, Setor Norte" />
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Área Total (hectares)</label>
            <Input {...register('totalArea')} type="number" step="0.01" min="0.01" placeholder="0.00" />
            {errors.totalArea && <p className="text-xs text-red-500 mt-1">{errors.totalArea.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">ID do Resort</label>
            <Input {...register('resortId')} placeholder="ID do resort" />
            {errors.resortId && <p className="text-xs text-red-500 mt-1">{errors.resortId.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Fazenda'}
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

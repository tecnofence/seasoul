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

const VEHICLE_TYPES = [
  { value: 'CAR', label: 'Ligeiro' },
  { value: 'VAN', label: 'Carrinha' },
  { value: 'TRUCK', label: 'Camião' },
  { value: 'MOTORCYCLE', label: 'Mota' },
  { value: 'BUS', label: 'Autocarro' },
  { value: 'EQUIPMENT', label: 'Equipamento' },
]

const schema = z.object({
  plate: z.string().min(2, 'Matrícula obrigatória'),
  brand: z.string().min(1, 'Marca obrigatória'),
  model: z.string().min(1, 'Modelo obrigatório'),
  year: z.coerce.number().min(1900).max(2100).optional(),
  type: z.enum(['CAR', 'VAN', 'TRUCK', 'MOTORCYCLE', 'BUS', 'EQUIPMENT']),
  fuelType: z.string().optional(),
  mileage: z.coerce.number().min(0).optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewVehiclePage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'CAR',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/fleet', {
      ...data,
      year: data.year || undefined,
      mileage: data.mileage || undefined,
      insuranceExpiry: data.insuranceExpiry || undefined,
    }),
    onSuccess: () => router.push('/dashboard/vehicles'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao registar veículo'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Veículo</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Matrícula</label>
              <Input {...register('plate')} placeholder="LD-00-00-AA" />
              {errors.plate && <p className="text-xs text-red-500 mt-1">{errors.plate.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select {...register('type')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                {VEHICLE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Marca</label>
              <Input {...register('brand')} placeholder="Toyota" />
              {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Modelo</label>
              <Input {...register('model')} placeholder="Hilux" />
              {errors.model && <p className="text-xs text-red-500 mt-1">{errors.model.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Ano</label>
              <Input {...register('year')} type="number" placeholder="2024" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Combustível</label>
              <select {...register('fuelType')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="">Selecionar</option>
                <option value="DIESEL">Diesel</option>
                <option value="GASOLINE">Gasolina</option>
                <option value="ELECTRIC">Elétrico</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Quilometragem</label>
              <Input {...register('mileage')} type="number" placeholder="0" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cor</label>
              <Input {...register('color')} placeholder="Branco" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">VIN (Chassi)</label>
              <Input {...register('vin')} placeholder="Número do chassi" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Validade do Seguro</label>
              <Input {...register('insuranceExpiry')} type="date" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea {...register('notes')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Observações sobre o veículo..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A registar...' : 'Registar Veículo'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

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

const SHIPMENT_TYPES = [
  { value: 'STANDARD', label: 'Standard' },
  { value: 'EXPRESS', label: 'Expresso' },
  { value: 'FREIGHT', label: 'Carga' },
  { value: 'INTERNATIONAL', label: 'Internacional' },
]

const schema = z.object({
  trackingCode: z.string().min(2, 'Código de rastreio obrigatório'),
  origin: z.string().min(2, 'Origem obrigatória'),
  destination: z.string().min(2, 'Destino obrigatório'),
  shipmentType: z.string().min(1, 'Tipo de envio obrigatório'),
  weight: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewShipmentPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/logistics', {
        ...data,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        estimatedDelivery: data.estimatedDelivery || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => router.push('/dashboard/shipments'),
    onError: (err: any) =>
      setError(err.response?.data?.error || 'Erro ao criar envio'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Novo Envio</h1>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          {error && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Código de Rastreio</label>
            <Input {...register('trackingCode')} placeholder="Ex: SNS-2026-00123" />
            {errors.trackingCode && (
              <p className="mt-1 text-xs text-red-500">{errors.trackingCode.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Origem</label>
              <Input {...register('origin')} placeholder="Ex: Luanda" />
              {errors.origin && (
                <p className="mt-1 text-xs text-red-500">{errors.origin.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Destino</label>
              <Input {...register('destination')} placeholder="Ex: Cabo Ledo" />
              {errors.destination && (
                <p className="mt-1 text-xs text-red-500">{errors.destination.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Envio</label>
            <select
              {...register('shipmentType')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecionar tipo...</option>
              {SHIPMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.shipmentType && (
              <p className="mt-1 text-xs text-red-500">{errors.shipmentType.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Peso (kg, opcional)</label>
              <Input
                {...register('weight')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Entrega Prevista</label>
              <Input {...register('estimatedDelivery')} type="date" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas (opcional)</label>
            <textarea
              {...register('notes')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]"
              placeholder="Informações adicionais sobre o envio..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Envio'}
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

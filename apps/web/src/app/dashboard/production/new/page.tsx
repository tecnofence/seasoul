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
  orderNumber: z.string().min(1, 'Nº Ordem obrigatório'),
  productName: z.string().min(2, 'Produto obrigatório'),
  quantity: z
    .string()
    .min(1, 'Quantidade obrigatória')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Quantidade deve ser um número positivo'),
  unit: z.string().min(1, 'Unidade obrigatória'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], { required_error: 'Prioridade obrigatória' }),
  estimatedStart: z.string().min(1, 'Data de início estimada obrigatória'),
  estimatedEnd: z.string().min(1, 'Data de fim estimada obrigatória'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export default function NewProductionPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      unit: 'unidades',
      priority: 'MEDIUM',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/manufacturing', {
        orderNumber: data.orderNumber,
        productName: data.productName,
        quantity: parseFloat(data.quantity),
        unit: data.unit,
        priority: data.priority,
        estimatedStart: data.estimatedStart,
        estimatedEnd: data.estimatedEnd,
        notes: data.notes || undefined,
      }),
    onSuccess: () => router.push('/dashboard/production'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar ordem de produção'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Nova Ordem de Produção</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nº Ordem</label>
            <Input {...register('orderNumber')} placeholder="Ex: ORD-2026-001" />
            {errors.orderNumber && <p className="text-xs text-red-500 mt-1">{errors.orderNumber.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Produto</label>
            <Input {...register('productName')} placeholder="Nome do produto a fabricar" />
            {errors.productName && <p className="text-xs text-red-500 mt-1">{errors.productName.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Quantidade</label>
              <Input {...register('quantity')} type="number" step="0.01" min="0.01" placeholder="0" />
              {errors.quantity && <p className="text-xs text-red-500 mt-1">{errors.quantity.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Unidade</label>
              <Input {...register('unit')} placeholder="unidades" />
              {errors.unit && <p className="text-xs text-red-500 mt-1">{errors.unit.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Prioridade</label>
            <select
              {...register('priority')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {errors.priority && <p className="text-xs text-red-500 mt-1">{errors.priority.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Início Estimado</label>
              <Input {...register('estimatedStart')} type="datetime-local" />
              {errors.estimatedStart && <p className="text-xs text-red-500 mt-1">{errors.estimatedStart.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fim Estimado</label>
              <Input {...register('estimatedEnd')} type="datetime-local" />
              {errors.estimatedEnd && <p className="text-xs text-red-500 mt-1">{errors.estimatedEnd.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea
              {...register('notes')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]"
              placeholder="Notas ou observações adicionais..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Ordem'}
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

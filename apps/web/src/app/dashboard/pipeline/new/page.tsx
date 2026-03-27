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

const STAGES = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'QUALIFIED', label: 'Qualificado' },
  { value: 'PROPOSAL', label: 'Proposta' },
  { value: 'NEGOTIATION', label: 'Negociação' },
  { value: 'WON', label: 'Ganho' },
  { value: 'LOST', label: 'Perdido' },
]

const schema = z.object({
  title: z.string().min(2, 'Título obrigatório'),
  clientId: z.string().min(1, 'Cliente obrigatório'),
  value: z.string().optional(),
  probability: z.coerce.number().min(0).max(100).optional(),
  stage: z.enum(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST']),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewDealPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      stage: 'LEAD',
      probability: 10,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/crm/deals', {
      ...data,
      value: data.value ? parseFloat(data.value) : undefined,
      expectedCloseDate: data.expectedCloseDate || undefined,
    }),
    onSuccess: () => router.push('/dashboard/pipeline'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar negócio'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Negócio</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <Input {...register('title')} placeholder="Nome do negócio" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">ID do Cliente</label>
            <Input {...register('clientId')} placeholder="ID do cliente (CUID)" />
            {errors.clientId && <p className="text-xs text-red-500 mt-1">{errors.clientId.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Valor (AOA)</label>
              <Input {...register('value')} type="number" step="0.01" placeholder="0.00" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Probabilidade (%)</label>
              <Input {...register('probability')} type="number" min="0" max="100" placeholder="10" />
              {errors.probability && <p className="text-xs text-red-500 mt-1">{errors.probability.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Fase</label>
              <select {...register('stage')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                {STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data Prevista de Fecho</label>
              <Input {...register('expectedCloseDate')} type="date" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea {...register('notes')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Observações sobre o negócio..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Negócio'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

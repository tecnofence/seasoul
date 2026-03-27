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
  clientName: z.string().min(2, 'Nome do cliente obrigatório'),
  title: z.string().min(2, 'Título obrigatório'),
  contractType: z.string().min(1, 'Tipo de contrato obrigatório'),
  monthlyValue: z.string().optional(),
  totalValue: z.string().optional(),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  endDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  autoRenew: z.boolean().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewContractPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      autoRenew: false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/contracts', {
      ...data,
      monthlyValue: data.monthlyValue ? parseFloat(data.monthlyValue) : undefined,
      totalValue: data.totalValue ? parseFloat(data.totalValue) : undefined,
      endDate: data.endDate || undefined,
      paymentTerms: data.paymentTerms || undefined,
      description: data.description || undefined,
      notes: data.notes || undefined,
    }),
    onSuccess: () => router.push('/dashboard/contracts'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar contrato'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold">Novo Contrato</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome do Cliente</label>
            <Input {...register('clientName')} placeholder="Nome do cliente" />
            {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Título do Contrato</label>
            <Input {...register('title')} placeholder="Título do contrato" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Contrato</label>
            <Input {...register('contractType')} placeholder="Ex: Serviço, Manutenção, Consultoria" />
            {errors.contractType && <p className="text-xs text-red-500 mt-1">{errors.contractType.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Valor Mensal (AOA)</label>
              <Input {...register('monthlyValue')} type="number" step="0.01" min="0" placeholder="0.00" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Valor Total (AOA)</label>
              <Input {...register('totalValue')} type="number" step="0.01" min="0" placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Início</label>
              <Input {...register('startDate')} type="date" />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Fim</label>
              <Input {...register('endDate')} type="date" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Condições de Pagamento</label>
            <Input {...register('paymentTerms')} placeholder="Ex: 30 dias, mensal, trimestral" />
          </div>

          <div className="flex items-center gap-2">
            <input {...register('autoRenew')} type="checkbox" id="autoRenew" className="h-4 w-4 rounded border-gray-300" />
            <label htmlFor="autoRenew" className="text-sm font-medium">Renovação Automática</label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea {...register('description')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Descrição do contrato..." />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea {...register('notes')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[60px]" placeholder="Notas adicionais..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Contrato'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

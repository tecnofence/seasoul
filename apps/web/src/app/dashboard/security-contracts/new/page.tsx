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

const CONTRACT_TYPES = [
  { value: 'MONITORING', label: 'Monitorização' },
  { value: 'PATROL', label: 'Patrulha' },
  { value: 'CCTV', label: 'CCTV' },
  { value: 'ALARM', label: 'Alarmes' },
  { value: 'ACCESS_CONTROL', label: 'Controlo de Acesso' },
  { value: 'MIXED', label: 'Misto' },
]

const schema = z.object({
  clientName: z.string().min(1, 'Nome do cliente obrigatório'),
  title: z.string().min(3, 'Título obrigatório (mín. 3 caracteres)'),
  contractType: z.enum(['MONITORING', 'PATROL', 'CCTV', 'ALARM', 'ACCESS_CONTROL', 'MIXED']),
  monthlyValue: z.coerce.number().min(0, 'Valor mensal deve ser positivo'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  endDate: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewSecurityContractPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { contractType: 'MONITORING', monthlyValue: 0 },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/security', {
      ...data,
      endDate: data.endDate || undefined,
      description: data.description || undefined,
      notes: data.notes || undefined,
    }),
    onSuccess: () => router.push('/dashboard/security-contracts'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar contrato'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Contrato de Segurança</h1>
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
            <label className="mb-1 block text-sm font-medium">Título</label>
            <Input {...register('title')} placeholder="Ex: Contrato de monitorização 24h" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Contrato</label>
            <select {...register('contractType')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              {CONTRACT_TYPES.map((ct) => (
                <option key={ct.value} value={ct.value}>{ct.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Valor Mensal (AOA)</label>
            <Input type="number" step="0.01" min={0} {...register('monthlyValue')} placeholder="0.00" />
            {errors.monthlyValue && <p className="text-xs text-red-500 mt-1">{errors.monthlyValue.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Início</label>
              <Input type="date" {...register('startDate')} />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Fim (opcional)</label>
              <Input type="date" {...register('endDate')} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição (opcional)</label>
            <textarea {...register('description')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[100px]" placeholder="Descreva os detalhes do contrato..." />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Observações (opcional)</label>
            <textarea {...register('notes')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Notas adicionais..." />
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

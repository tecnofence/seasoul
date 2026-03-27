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

const PROJECT_TYPES = [
  { value: 'CONSTRUCTION', label: 'Construção' },
  { value: 'RENOVATION', label: 'Renovação' },
  { value: 'MAINTENANCE', label: 'Manutenção' },
  { value: 'DESIGN', label: 'Projeto' },
  { value: 'CONSULTATION', label: 'Consultoria' },
  { value: 'INSPECTION', label: 'Inspeção' },
  { value: 'OTHER', label: 'Outro' },
]

const schema = z.object({
  name: z.string().min(3, 'Nome obrigatório (mín. 3 caracteres)'),
  clientName: z.string().min(1, 'Nome do cliente obrigatório'),
  projectType: z.enum(['CONSTRUCTION', 'RENOVATION', 'MAINTENANCE', 'DESIGN', 'CONSULTATION', 'INSPECTION', 'OTHER']),
  budget: z.coerce.number().min(0, 'Orçamento inválido').optional(),
  startDate: z.string().optional(),
  expectedEnd: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewEngineeringProjectPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { projectType: 'CONSTRUCTION' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/engineering', {
      ...data,
      budget: data.budget || undefined,
      startDate: data.startDate || undefined,
      expectedEnd: data.expectedEnd || undefined,
      location: data.location || undefined,
      description: data.description || undefined,
    }),
    onSuccess: () => router.push('/dashboard/projects'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar projeto'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Projeto de Engenharia</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome do Projeto</label>
            <Input {...register('name')} placeholder="Ex: Construção Bloco B" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Nome do Cliente</label>
            <Input {...register('clientName')} placeholder="Nome do cliente" />
            {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Projeto</label>
            <select {...register('projectType')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Orçamento (AOA)</label>
            <Input type="number" step="0.01" min={0} {...register('budget')} placeholder="0.00" />
            {errors.budget && <p className="text-xs text-red-500 mt-1">{errors.budget.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Início</label>
              <Input type="date" {...register('startDate')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fim Previsto</label>
              <Input type="date" {...register('expectedEnd')} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Localização</label>
            <Input {...register('location')} placeholder="Morada ou coordenadas" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea {...register('description')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[100px]" placeholder="Descreva o projeto em detalhe..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Projeto'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

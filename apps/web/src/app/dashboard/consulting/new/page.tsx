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
  { value: 'AUDIT', label: 'Auditoria' },
  { value: 'STRATEGY', label: 'Estratégia' },
  { value: 'TECHNOLOGY', label: 'Tecnologia' },
  { value: 'FINANCIAL', label: 'Financeiro' },
  { value: 'LEGAL', label: 'Jurídico' },
  { value: 'HR', label: 'Recursos Humanos' },
  { value: 'OPERATIONS', label: 'Operações' },
  { value: 'OTHER', label: 'Outro' },
]

const schema = z.object({
  title: z.string().min(2, 'Título obrigatório'),
  clientName: z.string().min(2, 'Nome do cliente obrigatório'),
  projectType: z.string().min(1, 'Tipo de projeto obrigatório'),
  description: z.string().optional(),
  budget: z.string().min(1, 'Orçamento obrigatório'),
  estimatedHours: z.string().min(1, 'Horas estimadas obrigatórias'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
  endDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewConsultingProjectPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/consulting', {
        ...data,
        budget: parseFloat(data.budget),
        estimatedHours: parseInt(data.estimatedHours, 10),
        description: data.description || undefined,
        endDate: data.endDate || undefined,
      }),
    onSuccess: () => router.push('/dashboard/consulting'),
    onError: (err: any) =>
      setError(err.response?.data?.error || 'Erro ao criar projeto de consultoria'),
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
        <h1 className="text-2xl font-bold">Novo Projeto de Consultoria</h1>
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
            <label className="mb-1 block text-sm font-medium">Título</label>
            <Input {...register('title')} placeholder="Título do projeto" />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Nome do Cliente</label>
            <Input {...register('clientName')} placeholder="Nome do cliente" />
            {errors.clientName && (
              <p className="mt-1 text-xs text-red-500">{errors.clientName.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Projeto</label>
            <select
              {...register('projectType')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecionar tipo...</option>
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.projectType && (
              <p className="mt-1 text-xs text-red-500">{errors.projectType.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea
              {...register('description')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]"
              placeholder="Descrição do projeto (opcional)..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Orçamento (AOA)</label>
              <Input
                {...register('budget')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              {errors.budget && (
                <p className="mt-1 text-xs text-red-500">{errors.budget.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Horas Estimadas</label>
              <Input
                {...register('estimatedHours')}
                type="number"
                min="1"
                step="1"
                placeholder="0"
              />
              {errors.estimatedHours && (
                <p className="mt-1 text-xs text-red-500">{errors.estimatedHours.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Início</label>
              <Input {...register('startDate')} type="date" />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Fim</label>
              <Input {...register('endDate')} type="date" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Projeto'}
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

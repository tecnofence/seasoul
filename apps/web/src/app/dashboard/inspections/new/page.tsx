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

const INSPECTION_TYPES = [
  { value: 'INITIAL', label: 'Inicial' },
  { value: 'PERIODIC', label: 'Periódica' },
  { value: 'EXTRAORDINARY', label: 'Extraordinária' },
  { value: 'FINAL', label: 'Final' },
]

const schema = z.object({
  projectId: z.string().min(1, 'ID do projeto obrigatório'),
  inspectionType: z.string().min(1, 'Tipo de inspeção obrigatório'),
  scheduledDate: z.string().min(1, 'Data agendada obrigatória'),
  inspector: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewInspectionPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { inspectionType: 'INITIAL' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/electrical/inspections', {
      ...data,
      inspector: data.inspector || undefined,
      location: data.location || undefined,
      notes: data.notes || undefined,
    }),
    onSuccess: () => router.push('/dashboard/inspections'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar inspeção'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Inspeção</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">ID do Projeto</label>
            <Input {...register('projectId')} placeholder="ID do projeto elétrico" />
            {errors.projectId && <p className="text-xs text-red-500 mt-1">{errors.projectId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Inspeção</label>
            <select {...register('inspectionType')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              {INSPECTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.inspectionType && <p className="text-xs text-red-500 mt-1">{errors.inspectionType.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Data Agendada</label>
            <Input type="date" {...register('scheduledDate')} />
            {errors.scheduledDate && <p className="text-xs text-red-500 mt-1">{errors.scheduledDate.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Inspetor</label>
            <Input {...register('inspector')} placeholder="Nome do inspetor" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Localização</label>
            <Input {...register('location')} placeholder="Morada da inspeção" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea {...register('notes')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[100px]" placeholder="Observações adicionais..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Inspeção'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

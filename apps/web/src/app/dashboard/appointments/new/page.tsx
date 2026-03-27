'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

const schema = z.object({
  patientId: z.string().min(1, 'Paciente obrigatório'),
  doctorName: z.string().min(2, 'Nome do médico obrigatório'),
  specialty: z.string().min(2, 'Especialidade obrigatória'),
  date: z.string().min(1, 'Data e hora obrigatórias'),
  reason: z.string().min(2, 'Motivo obrigatório'),
  cost: z.coerce.number().nonnegative('Custo deve ser igual ou superior a 0'),
})

type FormData = z.infer<typeof schema>

export default function NewAppointmentPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => api.get('/healthcare/patients?limit=100').then((r) => r.data.data),
  })

  const patients: any[] = patientsData?.items ?? patientsData ?? []

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/healthcare/appointments', {
        ...data,
        date: new Date(data.date).toISOString(),
      }),
    onSuccess: () => router.push('/dashboard/appointments'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar consulta'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Nova Consulta</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Paciente</label>
            <select
              {...register('patientId')}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecionar paciente...</option>
              {patients.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.patientId && <p className="text-xs text-red-500 mt-1">{errors.patientId.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Nome do Médico</label>
              <Input {...register('doctorName')} placeholder="Dr. Nome Apelido" />
              {errors.doctorName && <p className="text-xs text-red-500 mt-1">{errors.doctorName.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Especialidade</label>
              <Input {...register('specialty')} placeholder="Ex: Clínica Geral" />
              {errors.specialty && <p className="text-xs text-red-500 mt-1">{errors.specialty.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Data e Hora</label>
            <Input {...register('date')} type="datetime-local" />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Motivo da Consulta</label>
            <Input {...register('reason')} placeholder="Descreva o motivo da consulta" />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Custo (AOA)</label>
            <Input {...register('cost')} type="number" min={0} step="0.01" placeholder="0.00" />
            {errors.cost && <p className="text-xs text-red-500 mt-1">{errors.cost.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Consulta'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

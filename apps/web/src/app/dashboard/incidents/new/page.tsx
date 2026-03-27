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

const INCIDENT_TYPES = [
  { value: 'INTRUSION', label: 'Intrusão' },
  { value: 'THEFT', label: 'Furto' },
  { value: 'VANDALISM', label: 'Vandalismo' },
  { value: 'FIRE', label: 'Incêndio' },
  { value: 'EQUIPMENT_FAILURE', label: 'Falha de Equipamento' },
  { value: 'ALARM_TRIGGER', label: 'Disparo de Alarme' },
  { value: 'ACCESS_VIOLATION', label: 'Violação de Acesso' },
  { value: 'OTHER', label: 'Outro' },
]

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
]

const schema = z.object({
  title: z.string().min(3, 'Título obrigatório (mín. 3 caracteres)'),
  description: z.string().min(1, 'Descrição obrigatória'),
  type: z.enum(['INTRUSION', 'THEFT', 'VANDALISM', 'FIRE', 'EQUIPMENT_FAILURE', 'ALARM_TRIGGER', 'ACCESS_VIOLATION', 'OTHER']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  location: z.string().min(1, 'Localização obrigatória'),
  photos: z.string().optional(),
  contractId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewIncidentPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'OTHER', severity: 'MEDIUM' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/security/incidents', {
      ...data,
      photos: data.photos ? data.photos.split(',').map((url) => url.trim()).filter(Boolean) : [],
      contractId: data.contractId || undefined,
    }),
    onSuccess: () => router.push('/dashboard/incidents'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao reportar incidente'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Reportar Incidente</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <Input {...register('title')} placeholder="Ex: Intrusão detectada no perímetro norte" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Incidente</label>
            <select {...register('type')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              {INCIDENT_TYPES.map((it) => (
                <option key={it.value} value={it.value}>{it.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Gravidade</label>
            <select {...register('severity')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Localização</label>
            <Input {...register('location')} placeholder="Ex: Entrada principal, Bloco B" />
            {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea {...register('description')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[100px]" placeholder="Descreva o incidente em detalhe..." />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Fotos (opcional)</label>
            <Input {...register('photos')} placeholder="URLs separados por vírgula" />
            <p className="mt-1 text-xs text-gray-400">Insira os URLs das imagens separados por vírgula</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">ID do Contrato (opcional)</label>
            <Input {...register('contractId')} placeholder="ID do contrato associado" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A enviar...' : 'Reportar Incidente'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

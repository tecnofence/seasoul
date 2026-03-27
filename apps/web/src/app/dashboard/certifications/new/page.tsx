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

const CERT_TYPES = [
  { value: 'ELECTRICAL_INSTALLATION', label: 'Instalação Elétrica' },
  { value: 'ELECTRICAL_MAINTENANCE', label: 'Manutenção Elétrica' },
  { value: 'SAFETY_COMPLIANCE', label: 'Conformidade de Segurança' },
  { value: 'ENERGY_EFFICIENCY', label: 'Eficiência Energética' },
  { value: 'OTHER', label: 'Outro' },
]

const schema = z.object({
  projectId: z.string().min(1, 'ID do projeto obrigatório'),
  clientName: z.string().min(1, 'Nome do cliente obrigatório'),
  certType: z.string().min(1, 'Tipo de certificação obrigatório'),
  certNumber: z.string().optional(),
  issuedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewCertificationPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { certType: 'ELECTRICAL_INSTALLATION' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/electrical/certifications', {
      ...data,
      certNumber: data.certNumber || undefined,
      issuedAt: data.issuedAt || undefined,
      expiresAt: data.expiresAt || undefined,
      notes: data.notes || undefined,
    }),
    onSuccess: () => router.push('/dashboard/certifications'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar certificação'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Certificação</h1>
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
            <label className="mb-1 block text-sm font-medium">Nome do Cliente</label>
            <Input {...register('clientName')} placeholder="Nome do cliente" />
            {errors.clientName && <p className="text-xs text-red-500 mt-1">{errors.clientName.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Certificação</label>
            <select {...register('certType')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              {CERT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.certType && <p className="text-xs text-red-500 mt-1">{errors.certType.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">N.º Certificado</label>
            <Input {...register('certNumber')} placeholder="Ex: CERT-2026-001" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Emissão</label>
              <Input type="date" {...register('issuedAt')} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Data de Expiração</label>
              <Input type="date" {...register('expiresAt')} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea {...register('notes')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[100px]" placeholder="Observações adicionais..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Certificação'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

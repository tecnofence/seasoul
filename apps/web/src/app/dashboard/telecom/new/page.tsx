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

const PLAN_TYPES = [
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'FIXED', label: 'Telefone Fixo' },
  { value: 'INTERNET', label: 'Internet' },
  { value: 'TV', label: 'Televisão' },
  { value: 'BUNDLE', label: 'Pacote Combinado' },
]

const schema = z.object({
  clientName: z.string().min(2, 'Nome do cliente obrigatório'),
  phone: z.string().min(7, 'Telefone obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  planName: z.string().min(2, 'Nome do plano obrigatório'),
  planType: z.string().min(1, 'Tipo de plano obrigatório'),
  monthlyValue: z.string().min(1, 'Valor mensal obrigatório'),
  contractMonths: z.string().min(1, 'Duração do contrato obrigatória'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
})

type FormData = z.infer<typeof schema>

export default function NewTelecomContractPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      contractMonths: '12',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/telecom', {
        ...data,
        email: data.email || undefined,
        monthlyValue: parseFloat(data.monthlyValue),
        contractMonths: parseInt(data.contractMonths, 10),
      }),
    onSuccess: () => router.push('/dashboard/telecom'),
    onError: (err: any) =>
      setError(err.response?.data?.error || 'Erro ao criar contrato de telecomunicações'),
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
        <h1 className="text-2xl font-bold">Novo Contrato Telecom</h1>
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
            <label className="mb-1 block text-sm font-medium">Nome do Cliente</label>
            <Input {...register('clientName')} placeholder="Nome do cliente" />
            {errors.clientName && (
              <p className="mt-1 text-xs text-red-500">{errors.clientName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <Input {...register('phone')} placeholder="+244 9xx xxx xxx" />
              {errors.phone && (
                <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email (opcional)</label>
              <Input {...register('email')} type="email" placeholder="cliente@email.com" />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Nome do Plano</label>
            <Input {...register('planName')} placeholder="Ex: Plano Ouro 50GB" />
            {errors.planName && (
              <p className="mt-1 text-xs text-red-500">{errors.planName.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de Plano</label>
            <select
              {...register('planType')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Selecionar tipo...</option>
              {PLAN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.planType && (
              <p className="mt-1 text-xs text-red-500">{errors.planType.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Valor Mensal (AOA)</label>
              <Input
                {...register('monthlyValue')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
              />
              {errors.monthlyValue && (
                <p className="mt-1 text-xs text-red-500">{errors.monthlyValue.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Duração (meses)</label>
              <Input
                {...register('contractMonths')}
                type="number"
                min="1"
                step="1"
                placeholder="12"
              />
              {errors.contractMonths && (
                <p className="mt-1 text-xs text-red-500">{errors.contractMonths.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Data de Início</label>
            <Input {...register('startDate')} type="date" />
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Contrato'}
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

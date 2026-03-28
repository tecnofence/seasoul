'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, UserPlus, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório (mínimo 2 caracteres)'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  documentType: z.enum(['PASSPORT', 'BI', 'RESIDÊNCIA']).optional(),
  documentNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewGuestPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nationality: '',
      country: '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload: Record<string, unknown> = { ...data }
      // Convert empty strings to undefined so the API ignores optional fields
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') payload[k] = undefined
      })
      // Convert dateOfBirth to ISO string if provided
      if (payload.dateOfBirth) {
        payload.dateOfBirth = new Date(payload.dateOfBirth as string).toISOString()
      }
      return api.post('/guests', payload)
    },
    onSuccess: () => {
      setError('')
      setSuccess(true)
      setTimeout(() => router.push('/dashboard/guests'), 1500)
    },
    onError: (err: any) => {
      setSuccess(false)
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Erro ao registar hóspede. Tente novamente.',
      )
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/guests"
          className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Hóspedes
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Hóspede</h1>
          <p className="text-sm text-gray-500">Registo de novo cliente / hóspede</p>
        </div>
      </div>

      {/* Form card */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="space-y-5"
          >
            {/* Error banner */}
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Success banner */}
            {success && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">
                  Hóspede registado com sucesso! A redirecionar...
                </p>
              </div>
            )}

            {/* Nome (full width) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="Ex: João Manuel Silva"
                className={cn(errors.name && 'border-red-400 focus:ring-red-400')}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="email@exemplo.com"
                  className={cn(errors.email && 'border-red-400')}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
                <Input {...register('phone')} placeholder="+244 9XX XXX XXX" />
              </div>
            </div>

            {/* Nationality + Country */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nacionalidade
                </label>
                <Input {...register('nationality')} placeholder="Angolana" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">País</label>
                <Input {...register('country')} placeholder="Angola" />
              </div>
            </div>

            {/* Document type + Document number */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tipo de Documento
                </label>
                <select
                  {...register('documentType')}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Selecionar...</option>
                  <option value="PASSPORT">Passaporte</option>
                  <option value="BI">Bilhete de Identidade (BI)</option>
                  <option value="RESIDÊNCIA">Residência</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nº do Documento
                </label>
                <Input {...register('documentNumber')} placeholder="Ex: N123456789" />
              </div>
            </div>

            {/* Date of birth + Address */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Data de Nascimento
                </label>
                <Input {...register('dateOfBirth')} type="date" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Morada</label>
                <Input {...register('address')} placeholder="Rua, cidade" />
              </div>
            </div>

            {/* Notes (full width) */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Notas <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Observações adicionais sobre o hóspede..."
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              <Button
                type="submit"
                disabled={mutation.isPending || success}
                className="min-w-[140px]"
              >
                {mutation.isPending ? 'A registar...' : 'Registar Hóspede'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={mutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

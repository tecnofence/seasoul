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

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  nif: z.string().regex(/^\d{9}$/, 'NIF deve ter 9 dígitos').optional().or(z.literal('')),
  type: z.enum(['INDIVIDUAL', 'COMPANY', 'GOVERNMENT']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewClientPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'INDIVIDUAL',
      country: 'AO',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/crm', {
      ...data,
      nif: data.nif || undefined,
      email: data.email || undefined,
    }),
    onSuccess: () => router.push('/dashboard/clients'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar cliente'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Cliente</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <Input {...register('name')} placeholder="Nome do cliente" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">NIF</label>
              <Input {...register('nif')} placeholder="123456789" />
              {errors.nif && <p className="text-xs text-red-500 mt-1">{errors.nif.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select {...register('type')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="INDIVIDUAL">Particular</option>
                <option value="COMPANY">Empresa</option>
                <option value="GOVERNMENT">Governo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input {...register('email')} type="email" placeholder="email@cliente.ao" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <Input {...register('phone')} placeholder="+244 9XX XXX XXX" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Morada</label>
            <Input {...register('address')} placeholder="Morada completa" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Cidade</label>
              <Input {...register('city')} placeholder="Luanda" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">País</label>
              <Input {...register('country')} placeholder="AO" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notas</label>
            <textarea {...register('notes')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Observações sobre o cliente..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Cliente'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

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
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewSupplierPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/suppliers', {
      ...data,
      nif: data.nif || undefined,
      email: data.email || undefined,
    }),
    onSuccess: () => router.push('/dashboard/suppliers'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar fornecedor'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Fornecedor</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <Input {...register('name')} placeholder="Nome do fornecedor" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">NIF</label>
              <Input {...register('nif')} placeholder="123456789" />
              {errors.nif && <p className="text-xs text-red-500 mt-1">{errors.nif.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pessoa de Contacto</label>
              <Input {...register('contact')} placeholder="Nome do contacto" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Telefone</label>
              <Input {...register('phone')} placeholder="+244 9XX XXX XXX" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Email</label>
              <Input {...register('email')} type="email" placeholder="email@fornecedor.ao" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Morada</label>
            <textarea {...register('address')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Morada completa..." />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Fornecedor'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

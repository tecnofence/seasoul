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

const roles = ['SUPER_ADMIN', 'RESORT_MANAGER', 'RECEPTIONIST', 'POS_OPERATOR', 'STOCK_MANAGER', 'HR_MANAGER', 'MAINTENANCE', 'HOUSEKEEPING']

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.string().min(1, 'Cargo obrigatório'),
  resortId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewUserPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'RECEPTIONIST' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/users', {
      ...data,
      resortId: data.resortId || undefined,
    }),
    onSuccess: () => router.push('/dashboard/users'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar utilizador'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Utilizador</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome Completo</label>
            <Input {...register('name')} placeholder="Nome do utilizador" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input {...register('email')} type="email" placeholder="email@seasoul.ao" />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Senha</label>
            <Input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Cargo</label>
              <select {...register('role')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                {roles.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Resort ID (opcional)</label>
              <Input {...register('resortId')} placeholder="ID do resort" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Utilizador'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

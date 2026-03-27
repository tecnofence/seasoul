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
  resortId: z.string().min(1, 'Resort obrigatório'),
  name: z.string().min(2, 'Nome obrigatório'),
  nif: z.string().regex(/^\d{9}$/, 'NIF deve ter 9 dígitos'),
  role: z.string().min(1, 'Cargo obrigatório'),
  department: z.string().min(1, 'Departamento obrigatório'),
  baseSalary: z.coerce.number().positive('Salário deve ser positivo'),
  startDate: z.string().min(1, 'Data de início obrigatória'),
})

type FormData = z.infer<typeof schema>

const departments = ['RECEÇÃO', 'COZINHA', 'BAR', 'HOUSEKEEPING', 'SPA', 'SEGURANÇA', 'MANUTENÇÃO', 'ADMINISTRAÇÃO']

export default function NewEmployeePage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/hr', {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
    }),
    onSuccess: () => router.push('/dashboard/hr'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar colaborador'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Colaborador</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Resort ID</label>
            <Input {...register('resortId')} placeholder="ID do resort" />
            {errors.resortId && <p className="text-xs text-red-500 mt-1">{errors.resortId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Nome Completo</label>
            <Input {...register('name')} placeholder="Nome do colaborador" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">NIF</label>
              <Input {...register('nif')} placeholder="123456789" />
              {errors.nif && <p className="text-xs text-red-500 mt-1">{errors.nif.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cargo</label>
              <Input {...register('role')} placeholder="Ex: Rececionista" />
              {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Departamento</label>
              <select {...register('department')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="">Selecionar...</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Salário Base (AOA)</label>
              <Input {...register('baseSalary')} type="number" min={0} step="0.01" />
              {errors.baseSalary && <p className="text-xs text-red-500 mt-1">{errors.baseSalary.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Data de Início</label>
            <Input {...register('startDate')} type="date" />
            {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Colaborador'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

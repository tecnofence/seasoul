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
import { Card, CardTitle } from '@/components/ui/card'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  category: z.string().min(1, 'Categoria obrigatória'),
  department: z.string().min(1, 'Departamento obrigatório'),
  unitPrice: z.coerce.number().positive('Preço deve ser positivo'),
  taxRate: z.coerce.number().min(0).max(100).default(14),
})

type FormData = z.infer<typeof schema>

const departments = ['BAR', 'RESTAURANTE', 'SPA', 'ATIVIDADES', 'LOJA', 'MINIBAR', 'HOUSEKEEPING']

export default function NewProductPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { taxRate: 14 },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/products', data),
    onSuccess: () => router.push('/dashboard/products'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar produto'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Produto</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome</label>
            <Input {...register('name')} placeholder="Ex: Cerveja Cuca" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Categoria</label>
            <Input {...register('category')} placeholder="Ex: Bebidas" />
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Departamento</label>
            <select {...register('department')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="">Selecionar...</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Preço (AOA)</label>
              <Input {...register('unitPrice')} type="number" min={0} step="0.01" placeholder="0.00" />
              {errors.unitPrice && <p className="text-xs text-red-500 mt-1">{errors.unitPrice.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">IVA (%)</label>
              <Input {...register('taxRate')} type="number" min={0} max={100} />
              {errors.taxRate && <p className="text-xs text-red-500 mt-1">{errors.taxRate.message}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Produto'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

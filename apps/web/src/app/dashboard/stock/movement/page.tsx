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
  stockItemId: z.string().min(1, 'Item obrigatório'),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  qty: z.coerce.number().positive('Quantidade deve ser positiva'),
  reason: z.string().min(1, 'Razão obrigatória'),
  supplierId: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function StockMovementPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { data: stockItems } = useQuery({
    queryKey: ['stock-items-all'],
    queryFn: () => api.get('/stock', { params: { limit: 100 } }).then((r) => r.data.data),
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => api.get('/suppliers', { params: { limit: 100 } }).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'IN' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/stock/movement', {
      ...data,
      supplierId: data.supplierId || undefined,
    }),
    onSuccess: () => router.push('/dashboard/stock'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao registar movimento'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Movimento de Stock</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Item de Stock</label>
            <select {...register('stockItemId')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="">Selecionar...</option>
              {(stockItems || []).map((item: any) => (
                <option key={item.id} value={item.id}>{item.name} ({item.department})</option>
              ))}
            </select>
            {errors.stockItemId && <p className="text-xs text-red-500 mt-1">{errors.stockItemId.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo</label>
              <select {...register('type')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                <option value="IN">Entrada</option>
                <option value="OUT">Saída</option>
                <option value="ADJUSTMENT">Ajuste</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Quantidade</label>
              <Input {...register('qty')} type="number" min={0} step="0.001" />
              {errors.qty && <p className="text-xs text-red-500 mt-1">{errors.qty.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Fornecedor (opcional)</label>
            <select {...register('supplierId')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="">Nenhum</option>
              {(suppliers || []).map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Razão</label>
            <Input {...register('reason')} placeholder="Ex: Compra ao fornecedor" />
            {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A registar...' : 'Registar Movimento'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

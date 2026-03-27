'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  category: z.string().min(1, 'Categoria obrigatória'),
  department: z.string().min(1, 'Departamento obrigatório'),
  unitPrice: z.coerce.number().positive('Preço deve ser positivo'),
  taxRate: z.coerce.number().min(0).max(100),
})

type FormData = z.infer<typeof schema>

const departments = ['BAR', 'RESTAURANTE', 'SPA', 'ATIVIDADES', 'LOJA', 'MINIBAR', 'HOUSEKEEPING']

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/products/${id}`),
    onSuccess: () => router.push('/dashboard/products'),
  })

  const startEditing = () => {
    if (product) {
      reset({
        name: product.name,
        category: product.category,
        department: product.department,
        unitPrice: parseFloat(product.unitPrice),
        taxRate: parseFloat(product.taxRate),
      })
    }
    setEditing(true)
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!product) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Produto não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <Badge variant={product.active ? 'success' : 'danger'}>
          {product.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {editing ? (
        <Card className="mx-auto max-w-xl">
          <CardTitle>Editar Produto</CardTitle>
          <CardContent>
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

              <div>
                <label className="mb-1 block text-sm font-medium">Nome</label>
                <Input {...register('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Categoria</label>
                <Input {...register('category')} />
                {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Departamento</label>
                <select {...register('department')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Preço (AOA)</label>
                  <Input {...register('unitPrice')} type="number" min={0} step="0.01" />
                  {errors.unitPrice && <p className="text-xs text-red-500 mt-1">{errors.unitPrice.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">IVA (%)</label>
                  <Input {...register('taxRate')} type="number" min={0} max={100} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'A guardar...' : 'Guardar'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardTitle>Detalhes</CardTitle>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-500">Nome</dt>
                  <dd className="font-medium">{product.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Categoria</dt>
                  <dd>{product.category}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Departamento</dt>
                  <dd>{product.department}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Preço Unitário</dt>
                  <dd className="font-semibold text-primary">{formatKwanza(product.unitPrice)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Taxa IVA</dt>
                  <dd>{parseFloat(product.taxRate)}%</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Estado</dt>
                  <dd>
                    <Badge variant={product.active ? 'success' : 'danger'}>
                      {product.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardTitle>Ações</CardTitle>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={startEditing}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (confirm('Tem a certeza que quer desativar este produto?')) {
                    deleteMutation.mutate()
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {product.active ? 'Desativar' : 'Já desativado'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Pencil } from 'lucide-react'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  department: z.string().min(1, 'Departamento obrigatório'),
  unit: z.string().min(1, 'Unidade obrigatória'),
  minQty: z.coerce.number().min(0),
})

type FormData = z.infer<typeof schema>

const departments = ['BAR', 'RESTAURANTE', 'SPA', 'HOUSEKEEPING', 'MANUTENÇÃO', 'LOJA']
const units = ['UN', 'KG', 'LT', 'CX', 'PCT', 'GR', 'ML']

export default function StockItemDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const { data: item, isLoading } = useQuery({
    queryKey: ['stock-item', id],
    queryFn: () => api.get(`/stock/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/stock/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-item', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar'),
  })

  const startEditing = () => {
    if (item) {
      reset({
        name: item.name,
        department: item.department,
        unit: item.unit,
        minQty: parseFloat(item.minQty),
      })
    }
    setEditing(true)
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!item) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Item não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{item.name}</h1>
        <Badge variant={item.isLow ? 'danger' : 'success'}>
          {item.isLow ? 'Stock Baixo' : 'OK'}
        </Badge>
      </div>

      {editing ? (
        <Card className="mx-auto max-w-xl">
          <CardTitle>Editar Item de Stock</CardTitle>
          <CardContent>
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

              <div>
                <label className="mb-1 block text-sm font-medium">Nome</label>
                <Input {...register('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Departamento</label>
                  <select {...register('department')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Unidade</label>
                  <select {...register('unit')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    {units.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Qty Mínima</label>
                  <Input {...register('minQty')} type="number" min={0} step="0.01" />
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
                  <dd className="font-medium">{item.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Departamento</dt>
                  <dd>{item.department}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Unidade</dt>
                  <dd>{item.unit}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Qty Atual</dt>
                  <dd className="text-lg font-semibold">{parseFloat(item.currentQty)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Qty Mínima</dt>
                  <dd>{parseFloat(item.minQty)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Estado</dt>
                  <dd>
                    <Badge variant={item.isLow ? 'danger' : 'success'}>
                      {item.isLow ? 'Abaixo do mínimo' : 'Dentro do normal'}
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico de movimentos */}
      {item.movements?.length > 0 && (
        <Card>
          <CardTitle>Histórico de Movimentos</CardTitle>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Referência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {item.movements.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === 'IN' ? 'success' : m.type === 'OUT' ? 'danger' : 'warning'}>
                        {m.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{parseFloat(m.qty)}</TableCell>
                    <TableCell>{m.supplier?.name ?? '—'}</TableCell>
                    <TableCell>{m.reference ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

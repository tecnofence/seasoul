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
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  nif: z.string().regex(/^\d{9}$/, 'NIF deve ter 9 dígitos').optional().or(z.literal('')),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => api.get(`/suppliers/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/suppliers/${id}`, {
      ...data,
      nif: data.nif || undefined,
      email: data.email || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/suppliers/${id}`),
    onSuccess: () => router.push('/dashboard/suppliers'),
  })

  const startEditing = () => {
    if (supplier) {
      reset({
        name: supplier.name,
        nif: supplier.nif || '',
        contact: supplier.contact || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
      })
    }
    setEditing(true)
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!supplier) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Fornecedor não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{supplier.name}</h1>
        <Badge variant={supplier.active ? 'success' : 'danger'}>
          {supplier.active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      {editing ? (
        <Card className="mx-auto max-w-xl">
          <CardTitle>Editar Fornecedor</CardTitle>
          <CardContent>
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

              <div>
                <label className="mb-1 block text-sm font-medium">Nome</label>
                <Input {...register('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">NIF</label>
                  <Input {...register('nif')} />
                  {errors.nif && <p className="text-xs text-red-500 mt-1">{errors.nif.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Pessoa de Contacto</label>
                  <Input {...register('contact')} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Telefone</label>
                  <Input {...register('phone')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <Input {...register('email')} type="email" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Morada</label>
                <textarea {...register('address')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" />
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
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Nome</dt>
                  <dd className="font-medium">{supplier.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">NIF</dt>
                  <dd>{supplier.nif || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Contacto</dt>
                  <dd>{supplier.contact || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Telefone</dt>
                  <dd>{supplier.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd>{supplier.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Morada</dt>
                  <dd>{supplier.address || '—'}</dd>
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
                  if (confirm('Tem a certeza que quer desativar este fornecedor?')) {
                    deleteMutation.mutate()
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {supplier.active ? 'Desativar' : 'Já desativado'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Movimentos de stock recentes */}
      {supplier.stockMovements?.length > 0 && (
        <Card>
          <CardTitle>Movimentos de Stock</CardTitle>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Qtd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.stockMovements.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>{formatDateTime(m.createdAt)}</TableCell>
                    <TableCell>{m.stockItem?.name}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === 'IN' ? 'success' : 'danger'}>{m.type}</Badge>
                    </TableCell>
                    <TableCell>{parseFloat(m.qty)}</TableCell>
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

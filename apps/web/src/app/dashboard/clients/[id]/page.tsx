'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { ArrowLeft, Pencil, Trash2, Phone, Mail, MapPin } from 'lucide-react'

const TYPE_LABEL: Record<string, string> = { INDIVIDUAL: 'Particular', COMPANY: 'Empresa', GOVERNMENT: 'Governo' }
const TYPE_VARIANT: Record<string, 'default' | 'info' | 'warning'> = { INDIVIDUAL: 'default', COMPANY: 'info', GOVERNMENT: 'warning' }

const STAGE_LABEL: Record<string, string> = {
  LEAD: 'Lead', QUALIFIED: 'Qualificado', PROPOSAL: 'Proposta',
  NEGOTIATION: 'Negociacao', WON: 'Ganho', LOST: 'Perdido',
}
const STAGE_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  LEAD: 'default', QUALIFIED: 'info', PROPOSAL: 'info',
  NEGOTIATION: 'warning', WON: 'success', LOST: 'danger',
}

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

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => api.get(`/crm/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/crm/${id}`, {
      ...data,
      nif: data.nif || undefined,
      email: data.email || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/crm/${id}`),
    onSuccess: () => router.push('/dashboard/clients'),
  })

  const startEditing = () => {
    if (client) {
      reset({
        name: client.name,
        nif: client.nif || '',
        type: client.type || 'INDIVIDUAL',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        country: client.country || 'AO',
        notes: client.notes || '',
      })
    }
    setEditing(true)
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!client) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Cliente não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{client.name}</h1>
        <Badge variant={TYPE_VARIANT[client.type] ?? 'default'}>
          {TYPE_LABEL[client.type] ?? client.type}
        </Badge>
      </div>

      {editing ? (
        <Card className="mx-auto max-w-xl">
          <CardTitle>Editar Cliente</CardTitle>
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
                  <Input {...register('email')} type="email" />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Telefone</label>
                  <Input {...register('phone')} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Morada</label>
                <Input {...register('address')} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Cidade</label>
                  <Input {...register('city')} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">País</label>
                  <Input {...register('country')} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Notas</label>
                <textarea {...register('notes')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" />
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
                  <dd className="font-medium">{client.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">NIF</dt>
                  <dd>{client.nif || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Tipo</dt>
                  <dd>{TYPE_LABEL[client.type] ?? client.type}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">País</dt>
                  <dd>{client.country || '—'}</dd>
                </div>
              </dl>
              {client.notes && (
                <div className="mt-4 text-sm">
                  <dt className="text-gray-500">Notas</dt>
                  <dd className="mt-1 whitespace-pre-wrap">{client.notes}</dd>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardTitle>Contacto</CardTitle>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{client.phone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{client.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{[client.address, client.city].filter(Boolean).join(', ') || '—'}</span>
                </div>
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
                    if (confirm('Tem a certeza que quer eliminar este cliente?')) {
                      deleteMutation.mutate()
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Negócios associados */}
      {client.deals?.length > 0 && (
        <Card>
          <CardTitle>Negócios</CardTitle>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Probabilidade</TableHead>
                  <TableHead>Data Prevista</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.deals.map((deal: any) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell>
                      <Badge variant={STAGE_VARIANT[deal.stage] ?? 'default'}>
                        {STAGE_LABEL[deal.stage] ?? deal.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>{deal.value ? formatKwanza(Number(deal.value)) : '—'}</TableCell>
                    <TableCell>{deal.probability != null ? `${deal.probability}%` : '—'}</TableCell>
                    <TableCell>{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : '—'}</TableCell>
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

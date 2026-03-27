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
import { ArrowLeft, Pencil } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  MASSAGE: 'Massagem',
  FACIAL: 'Facial',
  BODY: 'Corpo',
  NAILS: 'Unhas',
  HAIR: 'Cabelo',
  THERAPY: 'Terapia',
  OTHER: 'Outro',
}

const CATEGORIES = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmado',
  IN_PROGRESS: 'Em Curso',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'Não Compareceu',
}

const BOOKING_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
}

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  description: z.string().optional(),
  duration: z.coerce.number().int().min(1, 'Duração obrigatória (em minutos)'),
  price: z.coerce.number().min(0, 'Preço obrigatório'),
})

type FormData = z.infer<typeof schema>

export default function SpaServiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const { data: service, isLoading, isError } = useQuery({
    queryKey: ['spa-service', id],
    queryFn: () => api.get(`/spa/services/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/spa/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spa-service', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar serviço'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !service) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Serviço de spa não encontrado.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  const handleEditClick = () => {
    reset({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
    })
    setEditing(true)
    setError('')
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <p className="text-sm text-gray-500">{CATEGORY_LABELS[service.category] || service.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={service.active ? 'success' : 'default'}>
            {service.active ? 'Ativo' : 'Inativo'}
          </Badge>
          {!editing && (
            <Button size="sm" variant="secondary" onClick={handleEditClick}>
              <Pencil className="mr-1 h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Detalhes / Formulário de edição */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Detalhes do Serviço</CardTitle>
          <CardContent>
            {editing ? (
              <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

                <div>
                  <label className="mb-1 block text-sm font-medium">Nome</label>
                  <Input {...register('name')} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Descrição</label>
                  <textarea
                    {...register('description')}
                    className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Duração (min)</label>
                    <Input {...register('duration')} type="number" />
                    {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Preço (AOA)</label>
                    <Input {...register('price')} type="number" step="0.01" />
                    {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'A guardar...' : 'Guardar'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => { setEditing(false); setError('') }}>
                    Cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="space-y-3">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-sm text-gray-500">Categoria</dt>
                  <dd className="text-sm font-medium">{CATEGORY_LABELS[service.category] || service.category}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-sm text-gray-500">Duração</dt>
                  <dd className="text-sm font-medium">{service.duration} min</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-sm text-gray-500">Preço</dt>
                  <dd className="text-sm font-medium">{formatKwanza(service.price)}</dd>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                  <dt className="text-sm text-gray-500">Estado</dt>
                  <dd>
                    <Badge variant={service.active ? 'success' : 'default'}>
                      {service.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </dd>
                </div>
                {service.description && (
                  <div>
                    <dt className="mb-1 text-sm text-gray-500">Descrição</dt>
                    <dd className="text-sm text-gray-700 whitespace-pre-wrap">{service.description}</dd>
                  </div>
                )}
              </dl>
            )}
          </CardContent>
        </Card>

        {/* Lista de reservas */}
        <Card>
          <CardTitle className="mb-4">Reservas deste Serviço</CardTitle>
          <CardContent>
            {service.bookings && service.bookings.length > 0 ? (
              <div className="space-y-3">
                {service.bookings.map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-md border border-gray-100 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{booking.clientName}</p>
                      <p className="text-xs text-gray-500">{formatDate(booking.date)}</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sem reservas para este serviço.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

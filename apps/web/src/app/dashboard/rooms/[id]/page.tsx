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
import { ArrowLeft, Pencil } from 'lucide-react'

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  AVAILABLE: 'success',
  OCCUPIED: 'info',
  MAINTENANCE: 'danger',
  CLEANING: 'warning',
}

const statusLabel: Record<string, string> = {
  AVAILABLE: 'Disponível',
  OCCUPIED: 'Ocupado',
  MAINTENANCE: 'Manutenção',
  CLEANING: 'Limpeza',
}

const schema = z.object({
  number: z.string().min(1, 'Número obrigatório'),
  type: z.enum(['STANDARD', 'SUPERIOR', 'SUITE', 'VILLA']),
  floor: z.coerce.number().int(),
  capacity: z.coerce.number().int().positive(),
  pricePerNight: z.coerce.number().positive('Preço obrigatório'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const { data: room, isLoading } = useQuery({
    queryKey: ['room', id],
    queryFn: () => api.get(`/rooms/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => api.put(`/rooms/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room', id] })
      setEditing(false)
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/rooms/${id}/status`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['room', id] }),
  })

  const startEditing = () => {
    if (room) {
      reset({
        number: room.number,
        type: room.type,
        floor: room.floor,
        capacity: room.capacity,
        pricePerNight: parseFloat(room.pricePerNight),
        description: room.description || '',
      })
    }
    setEditing(true)
  }

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!room) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Quarto não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Quarto #{room.number}</h1>
        <Badge variant={statusVariant[room.status] ?? 'default'}>
          {statusLabel[room.status] ?? room.status}
        </Badge>
      </div>

      {editing ? (
        <Card className="mx-auto max-w-xl">
          <CardTitle>Editar Quarto</CardTitle>
          <CardContent>
            <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Número</label>
                  <Input {...register('number')} />
                  {errors.number && <p className="text-xs text-red-500 mt-1">{errors.number.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Tipo</label>
                  <select {...register('type')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="STANDARD">Standard</option>
                    <option value="SUPERIOR">Superior</option>
                    <option value="SUITE">Suite</option>
                    <option value="VILLA">Villa</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Piso</label>
                  <Input {...register('floor')} type="number" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Capacidade</label>
                  <Input {...register('capacity')} type="number" min={1} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Preço/Noite (AOA)</label>
                  <Input {...register('pricePerNight')} type="number" min={0} step="0.01" />
                  {errors.pricePerNight && <p className="text-xs text-red-500 mt-1">{errors.pricePerNight.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Descrição</label>
                <textarea {...register('description')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]" />
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
                  <dt className="text-gray-500">Número</dt>
                  <dd className="font-medium">#{room.number}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Tipo</dt>
                  <dd>{room.type}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Piso</dt>
                  <dd>{room.floor}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Capacidade</dt>
                  <dd>{room.capacity} pessoas</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Preço/Noite</dt>
                  <dd className="font-semibold text-primary">{formatKwanza(room.pricePerNight)}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Resort</dt>
                  <dd>{room.resort?.name}</dd>
                </div>
              </dl>
              {room.description && (
                <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
                  <span className="font-medium text-gray-500">Descrição: </span>{room.description}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardTitle>Ações</CardTitle>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={startEditing}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>

              <div className="pt-2">
                <p className="mb-2 text-xs font-medium text-gray-500">Alterar Estado</p>
                <div className="grid grid-cols-2 gap-2">
                  {['AVAILABLE', 'MAINTENANCE', 'CLEANING'].map((s) => (
                    <Button
                      key={s}
                      variant={room.status === s ? 'primary' : 'secondary'}
                      size="sm"
                      disabled={room.status === s || statusMutation.isPending}
                      onClick={() => statusMutation.mutate(s)}
                    >
                      {statusLabel[s]}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

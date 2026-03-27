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
  resortId: z.string().min(1, 'Resort obrigatório'),
  roomId: z.string().optional(),
  title: z.string().min(3, 'Título obrigatório'),
  description: z.string().min(1, 'Descrição obrigatória'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
})

type FormData = z.infer<typeof schema>

export default function NewMaintenanceTicketPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { data: rooms } = useQuery({
    queryKey: ['rooms-all'],
    queryFn: () => api.get('/rooms', { params: { limit: 200 } }).then((r) => r.data.data),
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/maintenance', {
      ...data,
      roomId: data.roomId || undefined,
    }),
    onSuccess: () => router.push('/dashboard/maintenance'),
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao criar ticket'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">Novo Ticket de Manutenção</h1>

      <Card>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div>
            <label className="mb-1 block text-sm font-medium">Resort ID</label>
            <Input {...register('resortId')} placeholder="ID do resort" />
            {errors.resortId && <p className="text-xs text-red-500 mt-1">{errors.resortId.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Quarto (opcional)</label>
            <select {...register('roomId')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="">Área Comum</option>
              {(rooms || []).map((room: any) => (
                <option key={room.id} value={room.id}>#{room.number} — {room.type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <Input {...register('title')} placeholder="Ex: Ar condicionado avariado" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Descrição</label>
            <textarea {...register('description')} className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[100px]" placeholder="Descreva o problema em detalhe..." />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Prioridade</label>
            <select {...register('priority')} className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A criar...' : 'Criar Ticket'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

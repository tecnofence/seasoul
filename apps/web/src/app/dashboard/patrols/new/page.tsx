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
import { ArrowLeft } from 'lucide-react'

const schema = z.object({
  guardName: z.string().min(2, 'Nome do guarda obrigatório (mín. 2 caracteres)'),
  route: z.string().min(2, 'Rota obrigatória'),
  scheduledStart: z.string().min(1, 'Data/hora de início obrigatória'),
  scheduledEnd: z.string().min(1, 'Data/hora de fim obrigatória'),
  checkpoints: z.coerce
    .number()
    .int()
    .min(1, 'Número de postos deve ser pelo menos 1'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewPatrolPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      api.post('/security/patrols', {
        ...data,
        notes: data.notes || undefined,
      }),
    onSuccess: () => router.push('/dashboard/patrols'),
    onError: (err: any) =>
      setError(err.response?.data?.error || 'Erro ao criar ronda'),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1 text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nova Ronda</h1>
      </div>

      <Card>
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          {error && (
            <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Nome do Guarda</label>
            <Input
              {...register('guardName')}
              placeholder="Ex: António Silva"
            />
            {errors.guardName && (
              <p className="mt-1 text-xs text-red-500">{errors.guardName.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Rota</label>
            <Input
              {...register('route')}
              placeholder="Ex: Perímetro Norte — Bloco A"
            />
            {errors.route && (
              <p className="mt-1 text-xs text-red-500">{errors.route.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Início Agendado
              </label>
              <Input
                {...register('scheduledStart')}
                type="datetime-local"
              />
              {errors.scheduledStart && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.scheduledStart.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Fim Agendado
              </label>
              <Input
                {...register('scheduledEnd')}
                type="datetime-local"
              />
              {errors.scheduledEnd && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.scheduledEnd.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Nº de Postos</label>
            <Input
              {...register('checkpoints')}
              type="number"
              min={1}
              placeholder="Ex: 5"
            />
            {errors.checkpoints && (
              <p className="mt-1 text-xs text-red-500">
                {errors.checkpoints.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Observações <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              {...register('notes')}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[80px]"
              placeholder="Instruções especiais ou informações adicionais..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'A guardar...' : 'Criar Ronda'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

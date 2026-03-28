'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, BookOpen, Users, Clock, Activity, AlertCircle } from 'lucide-react'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  activityId: z.string().min(1, 'Selecione uma atividade'),
  guestName: z.string().min(2, 'Nome obrigatório'),
  guestEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  guestPhone: z.string().optional(),
  date: z.string().min(1, 'Data obrigatória'),
  time: z.string().min(1, 'Hora obrigatória'),
  participants: z.coerce.number().int().min(1, 'Mínimo 1 participante'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

// ─── Category labels ──────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  WATER_SPORTS: 'Desportos Aquáticos',
  LAND_SPORTS: 'Desportos Terrestres',
  WELLNESS: 'Bem-estar',
  CULTURAL: 'Cultural',
  ADVENTURE: 'Aventura',
  GASTRONOMY: 'Gastronomia',
  KIDS: 'Crianças',
  AQUATIC: 'Aquático',
  LAND: 'Terrestre',
  NATURE: 'Natureza',
  SPORT: 'Desporto',
  OTHER: 'Outro',
}

const CATEGORY_BG: Record<string, string> = {
  WATER_SPORTS: 'bg-cyan-100 text-cyan-700',
  AQUATIC: 'bg-cyan-100 text-cyan-700',
  LAND_SPORTS: 'bg-green-100 text-green-700',
  LAND: 'bg-green-100 text-green-700',
  WELLNESS: 'bg-pink-100 text-pink-700',
  CULTURAL: 'bg-purple-100 text-purple-700',
  ADVENTURE: 'bg-orange-100 text-orange-700',
  GASTRONOMY: 'bg-amber-100 text-amber-700',
  KIDS: 'bg-blue-100 text-blue-700',
  SPORT: 'bg-blue-100 text-blue-700',
  NATURE: 'bg-emerald-100 text-emerald-700',
  OTHER: 'bg-gray-100 text-gray-700',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewActivityBookingPage() {
  const router = useRouter()
  const [selectedActivity, setSelectedActivity] = useState<any>(null)

  const { data: activitiesData } = useQuery({
    queryKey: ['activities-active'],
    queryFn: () => api.get('/activities', { params: { status: 'ACTIVE', limit: 100 } }).then((r) => r.data),
  })

  const activities: any[] = activitiesData?.data ?? []

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { participants: 1 },
  })

  const participants = watch('participants') || 1
  const activityId = watch('activityId')

  const computedTotal = selectedActivity
    ? parseFloat(String(selectedActivity.price)) * participants
    : 0

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const datetime = `${data.date}T${data.time}:00.000Z`
      return api.post('/activities/bookings', {
        activityId: data.activityId,
        guestName: data.guestName,
        guestEmail: data.guestEmail || undefined,
        guestPhone: data.guestPhone || undefined,
        date: datetime,
        participants: data.participants,
        notes: data.notes || undefined,
      })
    },
    onSuccess: () => router.push('/dashboard/activities/bookings'),
  })

  const onSubmit = handleSubmit((data) => mutation.mutate(data))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Reserva de Atividade</h1>
          <p className="text-sm text-gray-500">Registe uma reserva para um hóspede ou grupo</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3">
        {/* Left col: form */}
        <div className="space-y-6 lg:col-span-2">
          {/* Select activity */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Selecionar Atividade</h2>
            {activities.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Nenhuma atividade ativa. Crie primeiro uma atividade no catálogo.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activities.map((a: any) => {
                  const isSelected = activityId === a.id
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setValue('activityId', a.id)
                        setSelectedActivity(a)
                      }}
                      className={`flex flex-col rounded-lg border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_BG[a.category] ?? 'bg-gray-100 text-gray-700'}`}>
                          {CATEGORY_LABEL[a.category] ?? a.category}
                        </span>
                        {isSelected && (
                          <span className="text-xs font-semibold text-primary">Selecionada</span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{a.name}</p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-semibold text-gray-900">{formatKwanza(parseFloat(String(a.price)))}/p</span>
                        {a.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {a.duration} min
                          </span>
                        )}
                        {a.maxParticipants && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> máx. {a.maxParticipants}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            {errors.activityId && (
              <p className="mt-2 text-xs text-red-500">{errors.activityId.message}</p>
            )}
          </div>

          {/* Guest details */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Dados do Hóspede</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nome *</label>
                <Input {...register('guestName')} placeholder="Nome completo" />
                {errors.guestName && <p className="mt-1 text-xs text-red-500">{errors.guestName.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Telefone</label>
                <Input {...register('guestPhone')} placeholder="+244 9XX XXX XXX" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
                <Input {...register('guestEmail')} placeholder="email@exemplo.com" type="email" />
                {errors.guestEmail && <p className="mt-1 text-xs text-red-500">{errors.guestEmail.message}</p>}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Data e Participantes</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Data *</label>
                <Input {...register('date')} type="date" />
                {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Hora *</label>
                <Input {...register('time')} type="time" />
                {errors.time && <p className="mt-1 text-xs text-red-500">{errors.time.message}</p>}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nº Participantes *</label>
                <Input
                  {...register('participants')}
                  type="number"
                  min={1}
                  max={selectedActivity?.maxParticipants ?? 999}
                />
                {errors.participants && <p className="mt-1 text-xs text-red-500">{errors.participants.message}</p>}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Notas Internas</h2>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Pedidos especiais, alergias, preferências..."
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>

        {/* Right col: summary */}
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Resumo da Reserva</h2>

            {selectedActivity ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-primary/5 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedActivity.name}</p>
                    <p className="text-xs text-gray-500">{CATEGORY_LABEL[selectedActivity.category] ?? selectedActivity.category}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Preço unitário</span>
                    <span className="font-medium">{formatKwanza(parseFloat(String(selectedActivity.price)))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Participantes</span>
                    <span className="font-medium">{participants}</span>
                  </div>
                  {selectedActivity.duration && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duração</span>
                      <span className="font-medium">{selectedActivity.duration} min</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span className="text-primary">{formatKwanza(computedTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
                <BookOpen className="h-8 w-8 text-gray-300" />
                <p>Selecione uma atividade para ver o resumo</p>
              </div>
            )}
          </div>

          {mutation.isError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Erro ao criar reserva. Tente novamente.
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending || !selectedActivity}
          >
            {mutation.isPending ? 'A criar...' : 'Criar Reserva'}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}

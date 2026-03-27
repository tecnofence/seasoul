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
import { ArrowLeft, Calendar, PauseCircle, PlayCircle, XCircle, Pencil, X } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
  PENDING: 'Pendente',
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CANCELLED: 'danger',
  PENDING: 'info',
}

const PLAN_TYPE_LABEL: Record<string, string> = {
  MOBILE: 'Mobile',
  FIXED: 'Telefone Fixo',
  INTERNET: 'Internet',
  TV: 'Televisão',
  BUNDLE: 'Pacote Combinado',
}

const editSchema = z.object({
  planName: z.string().min(2, 'Nome do plano obrigatório'),
  monthlyValue: z.string().min(1, 'Valor mensal obrigatório'),
})

type EditFormData = z.infer<typeof editSchema>

export default function TelecomContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const { data: contract, isLoading } = useQuery({
    queryKey: ['telecom', id],
    queryFn: () => api.get(`/telecom/${id}`).then((r) => r.data.data),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  })

  const editMutation = useMutation({
    mutationFn: (data: EditFormData) =>
      api.put(`/telecom/${id}`, {
        planName: data.planName,
        monthlyValue: parseFloat(data.monthlyValue),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecom', id] })
      setIsEditing(false)
      setError('')
    },
    onError: (err: any) =>
      setError(err.response?.data?.error || 'Erro ao atualizar contrato'),
  })

  const actionMutation = useMutation({
    mutationFn: (action: string) => api.patch(`/telecom/${id}/${action}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecom', id] })
      setError('')
    },
    onError: (err: any) =>
      setError(err.response?.data?.error || 'Erro ao atualizar estado do contrato'),
  })

  const handleEditOpen = () => {
    reset({
      planName: contract?.planName ?? '',
      monthlyValue: contract?.monthlyValue ? String(contract.monthlyValue) : '',
    })
    setIsEditing(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        A carregar...
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Contrato não encontrado
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{contract.clientName}</h1>
          <p className="text-sm text-gray-500">{contract.planName}</p>
        </div>
        <Badge variant={STATUS_VARIANT[contract.status] ?? 'default'}>
          {STATUS_LABEL[contract.status] ?? contract.status}
        </Badge>
      </div>

      {error && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <CardTitle>Detalhes do Contrato</CardTitle>
            {!isEditing && (
              <button
                onClick={handleEditOpen}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-primary hover:bg-primary/5"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
            )}
          </div>

          {isEditing ? (
            <CardContent>
              <form
                onSubmit={handleSubmit((data) => editMutation.mutate(data))}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">Nome do Plano</label>
                  <Input {...register('planName')} placeholder="Nome do plano" />
                  {errors.planName && (
                    <p className="mt-1 text-xs text-red-500">{errors.planName.message}</p>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Valor Mensal (AOA)</label>
                  <Input
                    {...register('monthlyValue')}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                  {errors.monthlyValue && (
                    <p className="mt-1 text-xs text-red-500">{errors.monthlyValue.message}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={editMutation.isPending}>
                    {editMutation.isPending ? 'A guardar...' : 'Guardar'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          ) : (
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Cliente</dt>
                  <dd className="font-medium">{contract.clientName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Telefone</dt>
                  <dd className="font-medium">{contract.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd>{contract.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Plano</dt>
                  <dd className="font-medium">{contract.planName}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Tipo de Plano</dt>
                  <dd>{PLAN_TYPE_LABEL[contract.planType] ?? contract.planType}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Valor Mensal</dt>
                  <dd className="font-semibold text-primary">
                    {contract.monthlyValue ? formatKwanza(Number(contract.monthlyValue)) : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Duração do Contrato</dt>
                  <dd>{contract.contractMonths ? `${contract.contractMonths} meses` : '—'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Data de Início</dt>
                  <dd className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {contract.startDate ? formatDate(contract.startDate) : '—'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            {contract.status === 'ACTIVE' && (
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => {
                  if (confirm('Suspender este contrato?')) {
                    actionMutation.mutate('suspend')
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <PauseCircle className="mr-2 h-4 w-4" />
                Suspender
              </Button>
            )}

            {contract.status === 'SUSPENDED' && (
              <Button
                className="w-full"
                onClick={() => {
                  if (confirm('Reativar este contrato?')) {
                    actionMutation.mutate('activate')
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Reativar
              </Button>
            )}

            {contract.status !== 'CANCELLED' && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (
                    confirm(
                      'Tem a certeza que quer cancelar este contrato? Esta ação não pode ser revertida.'
                    )
                  ) {
                    actionMutation.mutate('cancel')
                  }
                }}
                disabled={actionMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Contrato
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/dashboard/telecom')}
            >
              Voltar à Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

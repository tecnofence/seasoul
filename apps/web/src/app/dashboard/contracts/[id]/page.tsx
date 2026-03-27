'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, PauseCircle, XCircle, Calendar, FileCheck } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  EXPIRED: 'danger',
  CANCELLED: 'danger',
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => api.get(`/contracts/${id}`).then((r) => r.data.data),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/contracts/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract', id] })
      setError('')
    },
    onError: (err: any) => setError(err.response?.data?.error || 'Erro ao atualizar estado'),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!contract) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Contrato não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">{contract.title}</h1>
          <p className="text-sm text-gray-500">{contract.clientName}</p>
        </div>
        <Badge variant={STATUS_VARIANT[contract.status] ?? 'default'}>
          {STATUS_LABEL[contract.status] ?? contract.status}
        </Badge>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Detalhes do Contrato</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Cliente</dt>
                <dd className="font-medium">{contract.clientName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tipo de Contrato</dt>
                <dd className="font-medium">{contract.contractType || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Valor Mensal</dt>
                <dd className="font-medium">
                  {contract.monthlyValue ? formatKwanza(Number(contract.monthlyValue)) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Valor Total</dt>
                <dd className="font-medium">
                  {contract.totalValue ? formatKwanza(Number(contract.totalValue)) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Data de Início</dt>
                <dd className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {contract.startDate ? formatDate(contract.startDate) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Data de Fim</dt>
                <dd className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {contract.endDate ? formatDate(contract.endDate) : 'Indeterminado'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Condições de Pagamento</dt>
                <dd>{contract.paymentTerms || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Renovação Automática</dt>
                <dd>
                  <Badge variant={contract.autoRenew ? 'success' : 'default'}>
                    {contract.autoRenew ? 'Sim' : 'Não'}
                  </Badge>
                </dd>
              </div>
            </dl>

            {contract.description && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500">Descrição</h4>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{contract.description}</p>
              </div>
            )}

            {contract.notes && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500">Notas</h4>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{contract.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Ações</CardTitle>
          <CardContent className="space-y-3">
            {contract.status === 'ACTIVE' && (
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => {
                  if (confirm('Tem a certeza que quer suspender este contrato?')) {
                    statusMutation.mutate('SUSPENDED')
                  }
                }}
                disabled={statusMutation.isPending}
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
                    statusMutation.mutate('ACTIVE')
                  }
                }}
                disabled={statusMutation.isPending}
              >
                <FileCheck className="mr-2 h-4 w-4" />
                Reativar
              </Button>
            )}

            {(contract.status === 'ACTIVE' || contract.status === 'SUSPENDED' || contract.status === 'DRAFT') && (
              <Button
                variant="danger"
                className="w-full"
                onClick={() => {
                  if (confirm('Tem a certeza que quer cancelar este contrato? Esta ação não pode ser revertida.')) {
                    statusMutation.mutate('CANCELLED')
                  }
                }}
                disabled={statusMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Contrato
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push('/dashboard/contracts')}
            >
              Voltar à Lista
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

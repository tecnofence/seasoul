'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatKwanza, formatDate } from '@/lib/utils'
import { ArrowLeft, Pencil, Shield, MapPin } from 'lucide-react'

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  MONITORING: 'Monitorização',
  PATROL: 'Patrulha',
  CCTV: 'CCTV',
  ALARM: 'Alarmes',
  ACCESS_CONTROL: 'Controlo de Acesso',
  MIXED: 'Misto',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SUSPENDED: 'bg-orange-100 text-orange-800',
  CANCELLED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  PENDING: 'Pendente',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
}

export default function SecurityContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: contract, isLoading, isError } = useQuery({
    queryKey: ['security-contract', id],
    queryFn: () => api.get(`/security/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !contract) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Contrato não encontrado.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  const status = contract.status || 'ACTIVE'

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
            <p className="text-sm text-gray-500">{contract.clientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
            {STATUS_LABELS[status] || status}
          </span>
          <Button variant="secondary" onClick={() => router.push(`/dashboard/security-contracts/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Informações do contrato */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            <Shield className="mr-2 inline h-5 w-5 text-primary" />
            Detalhes do Contrato
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">Tipo de Contrato</dt>
              <dd className="text-sm font-medium">{CONTRACT_TYPE_LABELS[contract.contractType] || contract.contractType}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">Valor Mensal</dt>
              <dd className="text-sm font-semibold text-primary">{formatKwanza(contract.monthlyValue)}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">Data de Início</dt>
              <dd className="text-sm font-medium">{formatDate(contract.startDate)}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">Data de Fim</dt>
              <dd className="text-sm font-medium">{contract.endDate ? formatDate(contract.endDate) : 'Indeterminado'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Cliente</dt>
              <dd className="text-sm font-medium">{contract.clientName}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Descrição</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {contract.description || 'Sem descrição.'}
          </p>
          {contract.notes && (
            <>
              <h3 className="mt-6 mb-2 text-sm font-semibold text-gray-900">Observações</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{contract.notes}</p>
            </>
          )}
        </Card>
      </div>

      {/* Instalações relacionadas */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            <MapPin className="mr-2 inline h-5 w-5 text-primary" />
            Instalações
          </h2>
        </div>
        {contract.installations && contract.installations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Local</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Data de Instalação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {contract.installations.map((inst: any) => (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="py-3">{inst.location}</td>
                    <td className="py-3">{inst.type}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        inst.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        inst.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {inst.status === 'ACTIVE' ? 'Activo' :
                         inst.status === 'MAINTENANCE' ? 'Manutenção' :
                         inst.status === 'INACTIVE' ? 'Inactivo' : inst.status}
                      </span>
                    </td>
                    <td className="py-3">{inst.installedAt ? formatDate(inst.installedAt) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma instalação associada a este contrato.</p>
        )}
      </Card>
    </div>
  )
}

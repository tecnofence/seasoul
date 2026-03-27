'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

const STAGES = [
  { id: 'LEAD', label: 'Lead', color: 'border-gray-300 bg-gray-50' },
  { id: 'QUALIFIED', label: 'Qualificado', color: 'border-blue-300 bg-blue-50' },
  { id: 'PROPOSAL', label: 'Proposta', color: 'border-indigo-300 bg-indigo-50' },
  { id: 'NEGOTIATION', label: 'Negociação', color: 'border-amber-300 bg-amber-50' },
  { id: 'WON', label: 'Ganho', color: 'border-green-300 bg-green-50' },
  { id: 'LOST', label: 'Perdido', color: 'border-red-300 bg-red-50' },
]

export default function PipelinePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get('/crm/deals', { params: { limit: 100 } }).then((r) => r.data),
  })

  const deals = data?.data ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">CRM — Pipeline de Vendas</h1>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = deals.filter((d: any) => d.stage === stage.id)
            const stageTotal = stageDeals.reduce((sum: number, d: any) => sum + Number(d.value ?? 0), 0)
            return (
              <div key={stage.id} className="min-w-[280px] flex-shrink-0">
                <div className={`mb-3 rounded-lg border-2 p-3 ${stage.color}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{stage.label}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium">{stageDeals.length}</span>
                  </div>
                  <p className="text-sm text-gray-500">{formatKwanza(stageTotal)}</p>
                </div>

                <div className="space-y-2">
                  {stageDeals.map((deal: any) => (
                    <div key={deal.id} className="rounded-lg border bg-white p-3 shadow-sm">
                      <h4 className="font-medium text-gray-900">{deal.title}</h4>
                      <p className="text-sm text-gray-500">{deal.client?.name ?? '—'}</p>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-primary">{deal.value ? formatKwanza(Number(deal.value)) : '—'}</span>
                        <span className="text-gray-400">{deal.probability}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {stageDeals.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-gray-400">Sem negócios</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {deals.length === 0 && !isLoading && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Nenhum negócio no pipeline</p>
        </div>
      )}
    </div>
  )
}

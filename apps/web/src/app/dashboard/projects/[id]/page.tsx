'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, FolderKanban, Hammer, Calculator, Ruler } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { PLANNING: 'Planeamento', APPROVED: 'Aprovado', IN_PROGRESS: 'Em Curso', ON_HOLD: 'Suspenso', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' }
const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = { PLANNING: 'info', APPROVED: 'info', IN_PROGRESS: 'warning', ON_HOLD: 'default', COMPLETED: 'success', CANCELLED: 'danger' }
const TYPE_LABEL: Record<string, string> = { CONSTRUCTION: 'Construção', RENOVATION: 'Renovação', MAINTENANCE: 'Manutenção', DESIGN: 'Projeto', CONSULTATION: 'Consultoria', INSPECTION: 'Inspeção', OTHER: 'Outro' }

type Tab = 'works' | 'budget' | 'measurements'

export default function EngineeringProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('works')

  const { data: project, isLoading } = useQuery({
    queryKey: ['engineering-project', id],
    queryFn: () => api.get(`/engineering/${id}`).then((r) => r.data.data),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!project) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Projeto não encontrado</div>
  }

  const p = project
  const progress = p.progress ?? 0

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'works', label: 'Obras', icon: <Hammer className="h-4 w-4" /> },
    { key: 'budget', label: 'Orçamento', icon: <Calculator className="h-4 w-4" /> },
    { key: 'measurements', label: 'Medições', icon: <Ruler className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{p.name}</h1>
        <Badge variant={STATUS_VARIANT[p.status] ?? 'default'} className="text-sm">
          {STATUS_LABEL[p.status] ?? p.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Detalhes do Projeto</CardTitle>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500">Cliente</dt>
                <dd className="font-medium">{p.clientName}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Tipo</dt>
                <dd>{TYPE_LABEL[p.projectType] ?? p.projectType}</dd>
              </div>
              {p.code && (
                <div>
                  <dt className="text-gray-500">Código</dt>
                  <dd className="font-mono">{p.code}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-500">Orçamento</dt>
                <dd className="font-semibold text-primary">{p.budget ? formatKwanza(Number(p.budget)) : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Data de Início</dt>
                <dd>{p.startDate ? new Date(p.startDate).toLocaleDateString('pt-AO') : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Fim Previsto</dt>
                <dd>{p.expectedEnd ? new Date(p.expectedEnd).toLocaleDateString('pt-AO') : '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Localização</dt>
                <dd>{p.location || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Resort</dt>
                <dd>{p.resort?.name || '—'}</dd>
              </div>
            </dl>
            {p.description && (
              <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
                <span className="font-medium text-gray-500">Descrição: </span>{p.description}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Progresso</CardTitle>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-gray-500">Conclusão</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              {p.totalBudget != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Total Orçamento</dt>
                  <dd className="font-medium">{formatKwanza(Number(p.totalBudget))}</dd>
                </div>
              )}
              {p.executedBudget != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Executado</dt>
                  <dd className="font-medium">{formatKwanza(Number(p.executedBudget))}</dd>
                </div>
              )}
              {p._count?.works != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Obras</dt>
                  <dd className="font-medium">{p._count.works}</dd>
                </div>
              )}
              {p._count?.budgetItems != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Itens Orçamento</dt>
                  <dd className="font-medium">{p._count.budgetItems}</dd>
                </div>
              )}
              {p._count?.measurements != null && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Medições</dt>
                  <dd className="font-medium">{p._count.measurements}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Obras */}
      {activeTab === 'works' && (
        <Card>
          <CardTitle>Obras</CardTitle>
          <CardContent>
            {p.works?.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Progresso</th>
                      <th className="px-4 py-3">Início</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {p.works.map((w: any) => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{w.name}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            w.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            w.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {STATUS_LABEL[w.status] ?? w.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">{w.progress ?? 0}%</td>
                        <td className="px-4 py-3 text-gray-500">{w.startDate ? new Date(w.startDate).toLocaleDateString('pt-AO') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Hammer className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Nenhuma obra registada</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Orçamento */}
      {activeTab === 'budget' && (
        <Card>
          <CardTitle>Itens de Orçamento</CardTitle>
          <CardContent>
            {p.budgetItems?.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Qtd</th>
                      <th className="px-4 py-3">Preço Unit.</th>
                      <th className="px-4 py-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {p.budgetItems.map((item: any) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{item.description}</td>
                        <td className="px-4 py-3 text-gray-500">{item.category || '—'}</td>
                        <td className="px-4 py-3">{item.quantity ?? '—'}</td>
                        <td className="px-4 py-3">{item.unitPrice ? formatKwanza(Number(item.unitPrice)) : '—'}</td>
                        <td className="px-4 py-3 font-medium">{item.totalPrice ? formatKwanza(Number(item.totalPrice)) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Calculator className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Nenhum item de orçamento</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Medições */}
      {activeTab === 'measurements' && (
        <Card>
          <CardTitle>Medições</CardTitle>
          <CardContent>
            {p.measurements?.length > 0 ? (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3">Unidade</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {p.measurements.map((m: any) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{m.description}</td>
                        <td className="px-4 py-3">{m.value ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{m.unit || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{m.date ? new Date(m.date).toLocaleDateString('pt-AO') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <Ruler className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Nenhuma medição registada</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

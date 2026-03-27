'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { ArrowLeft, Zap, ClipboardCheck, Award } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { PLANNING: 'Planeamento', APPROVED: 'Aprovado', IN_PROGRESS: 'Em Curso', ON_HOLD: 'Suspenso', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' }
const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = { PLANNING: 'info', APPROVED: 'info', IN_PROGRESS: 'warning', ON_HOLD: 'default', COMPLETED: 'success', CANCELLED: 'danger' }
const TYPE_LABEL: Record<string, string> = { NEW_INSTALLATION: 'Nova Instalação', RENOVATION: 'Renovação', EXPANSION: 'Ampliação', MAINTENANCE: 'Manutenção', EMERGENCY: 'Emergência' }
const VOLTAGE_LABEL: Record<string, string> = { LOW: 'Baixa Tensão', MEDIUM: 'Média Tensão', HIGH: 'Alta Tensão' }
const VOLTAGE_COLOR: Record<string, string> = { LOW: 'bg-green-100 text-green-700', MEDIUM: 'bg-yellow-100 text-yellow-700', HIGH: 'bg-red-100 text-red-700' }

const INSP_STATUS_LABEL: Record<string, string> = { SCHEDULED: 'Agendada', IN_PROGRESS: 'Em Curso', COMPLETED: 'Concluída', CANCELLED: 'Cancelada' }
const INSP_STATUS_COLOR: Record<string, string> = { SCHEDULED: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-amber-100 text-amber-700', COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' }

const CERT_STATUS_LABEL: Record<string, string> = { PENDING: 'Pendente', ISSUED: 'Emitida', EXPIRED: 'Expirada', REVOKED: 'Revogada' }
const CERT_STATUS_COLOR: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', ISSUED: 'bg-green-100 text-green-700', EXPIRED: 'bg-red-100 text-red-700', REVOKED: 'bg-gray-100 text-gray-700' }

export default function ElectricalProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: project, isLoading } = useQuery({
    queryKey: ['electrical-project', id],
    queryFn: () => api.get(`/electrical/${id}`).then((r) => r.data.data),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar...</div>
  }

  if (!project) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Projeto não encontrado</div>
  }

  const p = project
  const inspections = p.inspections ?? []
  const certifications = p.certifications ?? []

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
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${VOLTAGE_COLOR[p.voltageLevel] ?? 'bg-gray-100 text-gray-700'}`}>
          <Zap className="mr-1 inline h-3 w-3" />
          {VOLTAGE_LABEL[p.voltageLevel] ?? p.voltageLevel}
        </span>
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
              <div>
                <dt className="text-gray-500">Nível de Tensão</dt>
                <dd>{VOLTAGE_LABEL[p.voltageLevel] ?? p.voltageLevel}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Orçamento</dt>
                <dd className="font-semibold text-primary">{p.budget ? formatKwanza(Number(p.budget)) : '—'}</dd>
              </div>
              {p.code && (
                <div>
                  <dt className="text-gray-500">Código</dt>
                  <dd className="font-mono">{p.code}</dd>
                </div>
              )}
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
            </dl>
            {p.description && (
              <div className="mt-4 rounded bg-gray-50 p-3 text-sm">
                <span className="font-medium text-gray-500">Descrição: </span>{p.description}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Resumo</CardTitle>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Inspeções</span>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">{inspections.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Certificações</span>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">{certifications.length}</span>
            </div>
            {p.progress != null && (
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-gray-500">Progresso</span>
                  <span className="font-semibold">{p.progress}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-200">
                  <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inspeções */}
      <Card>
        <CardTitle>Inspeções</CardTitle>
        <CardContent>
          {inspections.length > 0 ? (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Inspetor</th>
                    <th className="px-4 py-3">Data Agendada</th>
                    <th className="px-4 py-3">Resultado</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {inspections.map((insp: any) => (
                    <tr key={insp.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/inspections/${insp.id}`)}>
                      <td className="px-4 py-3 font-medium">{insp.inspectionType?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{insp.inspector || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{insp.scheduledDate ? new Date(insp.scheduledDate).toLocaleDateString('pt-AO') : '—'}</td>
                      <td className="px-4 py-3">{insp.result || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${INSP_STATUS_COLOR[insp.status] ?? ''}`}>
                          {INSP_STATUS_LABEL[insp.status] ?? insp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Nenhuma inspeção associada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificações */}
      <Card>
        <CardTitle>Certificações</CardTitle>
        <CardContent>
          {certifications.length > 0 ? (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">N.º Certificado</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Emissão</th>
                    <th className="px-4 py-3">Expiração</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {certifications.map((cert: any) => (
                    <tr key={cert.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/certifications/${cert.id}`)}>
                      <td className="px-4 py-3 font-mono">{cert.certNumber || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{cert.certType?.replace(/_/g, ' ') || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('pt-AO') : '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{cert.expiresAt ? new Date(cert.expiresAt).toLocaleDateString('pt-AO') : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CERT_STATUS_COLOR[cert.status] ?? ''}`}>
                          {CERT_STATUS_LABEL[cert.status] ?? cert.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Award className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Nenhuma certificação associada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

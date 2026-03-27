'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatDateTime } from '@/lib/utils'
import { ArrowLeft, AlertTriangle, MapPin, Clock, Camera } from 'lucide-react'

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  INTRUSION: 'Intrusão',
  THEFT: 'Furto',
  VANDALISM: 'Vandalismo',
  FIRE: 'Incêndio',
  EQUIPMENT_FAILURE: 'Falha de Equipamento',
  ALARM_TRIGGER: 'Disparo de Alarme',
  ACCESS_VIOLATION: 'Violação de Acesso',
  OTHER: 'Outro',
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Progresso',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
}

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { data: incident, isLoading, isError } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => api.get(`/security/incidents/${id}`).then((r) => r.data.data),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isError || !incident) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500">Incidente não encontrado.</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.back()}>Voltar</Button>
      </div>
    )
  }

  const severity = incident.severity || 'MEDIUM'
  const status = incident.status || 'OPEN'

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-md p-1 text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{incident.title}</h1>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>{incident.location}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${SEVERITY_COLORS[severity] || 'bg-gray-100 text-gray-800'}`}>
            {SEVERITY_LABELS[severity] || severity}
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}`}>
            {STATUS_LABELS[status] || status}
          </span>
        </div>
      </div>

      {/* Detalhes principais */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            <AlertTriangle className="mr-2 inline h-5 w-5 text-primary" />
            Detalhes do Incidente
          </h2>
          <dl className="space-y-3">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">Tipo</dt>
              <dd className="text-sm font-medium">{INCIDENT_TYPE_LABELS[incident.type] || incident.type}</dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">Gravidade</dt>
              <dd>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[severity]}`}>
                  {SEVERITY_LABELS[severity]}
                </span>
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">Estado</dt>
              <dd>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status]}`}>
                  {STATUS_LABELS[status]}
                </span>
              </dd>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <dt className="text-sm text-gray-500">Localização</dt>
              <dd className="text-sm font-medium">{incident.location}</dd>
            </div>
            {incident.contractId && (
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Contrato</dt>
                <dd>
                  <button
                    onClick={() => router.push(`/dashboard/security-contracts/${incident.contractId}`)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Ver contrato
                  </button>
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Reportado em</dt>
              <dd className="text-sm font-medium">{formatDateTime(incident.createdAt)}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Descrição</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.description}</p>

          {/* Fotos */}
          {incident.photos && incident.photos.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Camera className="h-4 w-4" />
                Fotos ({incident.photos.length})
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {incident.photos.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border hover:opacity-80">
                    <img src={url} alt={`Foto ${i + 1}`} className="h-32 w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Resolução */}
      {(incident.resolvedAt || incident.resolution) && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Resolução</h2>
          <dl className="space-y-3">
            {incident.resolvedAt && (
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Resolvido em</dt>
                <dd className="text-sm font-medium">{formatDateTime(incident.resolvedAt)}</dd>
              </div>
            )}
            {incident.resolvedBy && (
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <dt className="text-sm text-gray-500">Resolvido por</dt>
                <dd className="text-sm font-medium">{incident.resolvedBy}</dd>
              </div>
            )}
            {incident.resolution && (
              <div>
                <dt className="mb-1 text-sm text-gray-500">Descrição da Resolução</dt>
                <dd className="text-sm text-gray-700 whitespace-pre-wrap">{incident.resolution}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {/* Linha do tempo */}
      {incident.timeline && incident.timeline.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            <Clock className="mr-2 inline h-5 w-5 text-primary" />
            Linha do Tempo
          </h2>
          <div className="relative space-y-0">
            {incident.timeline.map((event: any, i: number) => (
              <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                {/* Linha vertical */}
                {i < incident.timeline.length - 1 && (
                  <div className="absolute left-[11px] top-6 h-full w-0.5 bg-gray-200" />
                )}
                {/* Ponto */}
                <div className="relative z-10 mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center">
                  <div className={`h-3 w-3 rounded-full ${
                    event.type === 'STATUS_CHANGE' ? 'bg-primary' :
                    event.type === 'COMMENT' ? 'bg-blue-400' :
                    'bg-gray-400'
                  }`} />
                </div>
                {/* Conteúdo */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{event.title || event.description}</p>
                  {event.description && event.title && (
                    <p className="mt-0.5 text-sm text-gray-600">{event.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                    <span>{formatDateTime(event.createdAt)}</span>
                    {event.user && <span>por {event.user}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

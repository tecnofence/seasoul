'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck, Plus, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'

// ─── Constants ────────────────────────────────────────────────────────────────

const RESULT_LABEL: Record<string, string> = {
  APPROVED: 'Aprovada',
  APPROVED_WITH_CONDITIONS: 'Aprovada c/ Condições',
  FAILED: 'Reprovada',
  PENDING: 'Pendente',
}

const RESULT_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  APPROVED: 'success',
  APPROVED_WITH_CONDITIONS: 'warning',
  FAILED: 'danger',
  PENDING: 'default',
}

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  IN_PROGRESS: 'Em Curso',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
}

const STATUS_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'default'> = {
  SCHEDULED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
}

const TYPE_TABS = [
  { value: '', label: 'Todos' },
  { value: 'ROOM', label: 'Quarto' },
  { value: 'COMMON_AREA', label: 'Área Comum' },
  { value: 'KITCHEN', label: 'Cozinha' },
  { value: 'POOL', label: 'Piscina' },
  { value: 'SECURITY', label: 'Segurança' },
]

const STATUS_TABS = [
  { value: '', label: 'Todos' },
  { value: 'SCHEDULED', label: 'Agendada' },
  { value: 'IN_PROGRESS', label: 'Em Curso' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_INSPECTIONS = [
  {
    id: 'mock-1',
    type: 'ROOM',
    location: 'Quarto 201',
    inspector: 'António Silva',
    date: '2026-03-28',
    result: 'APPROVED',
    status: 'COMPLETED',
    issuesFound: 0,
    notes: 'Tudo conforme. Quarto em excelente estado.',
  },
  {
    id: 'mock-2',
    type: 'KITCHEN',
    location: 'Cozinha Principal',
    inspector: 'Maria Costa',
    date: '2026-03-27',
    result: 'APPROVED_WITH_CONDITIONS',
    status: 'COMPLETED',
    issuesFound: 2,
    notes: 'Frigorífico industrial necessita limpeza profunda. Prateleiras com pequenas irregularidades.',
  },
  {
    id: 'mock-3',
    type: 'POOL',
    location: 'Piscina Exterior',
    inspector: 'João Mendes',
    date: '2026-03-26',
    result: 'FAILED',
    status: 'COMPLETED',
    issuesFound: 4,
    notes: 'Nível de cloro fora dos parâmetros. Bomba de filtração com ruído anormal.',
  },
  {
    id: 'mock-4',
    type: 'COMMON_AREA',
    location: 'Lobby Principal',
    inspector: 'Ana Rodrigues',
    date: '2026-03-25',
    result: 'APPROVED',
    status: 'COMPLETED',
    issuesFound: 0,
    notes: 'Área em bom estado. Limpeza a cumprir horários.',
  },
  {
    id: 'mock-5',
    type: 'SECURITY',
    location: 'Perímetro Norte',
    inspector: 'Carlos Santos',
    date: '2026-04-01',
    result: 'PENDING',
    status: 'SCHEDULED',
    issuesFound: 0,
    notes: '',
  },
  {
    id: 'mock-6',
    type: 'ROOM',
    location: 'Suite 301',
    inspector: 'Maria Costa',
    date: '2026-03-24',
    result: 'APPROVED_WITH_CONDITIONS',
    status: 'COMPLETED',
    issuesFound: 1,
    notes: 'Ar condicionado a fazer ruído. Manutenção agendada.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InspectionsPage() {
  const router = useRouter()
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', typeFilter, statusFilter],
    queryFn: () =>
      api
        .get('/maintenance/inspections', {
          params: {
            type: typeFilter || undefined,
            status: statusFilter || undefined,
            limit: 50,
          },
        })
        .then((r) => r.data)
        .catch(() => null),
    retry: false,
  })

  // Use API data if available, otherwise fall back to mock
  const inspections: any[] = useMemo(() => {
    if (data?.data?.length) return data.data
    let list = MOCK_INSPECTIONS
    if (typeFilter) list = list.filter((i) => i.type === typeFilter)
    if (statusFilter) list = list.filter((i) => i.status === statusFilter)
    return list
  }, [data, typeFilter, statusFilter])

  // ── Stats ────────────────────────────────────────────────────────────────
  const allForStats = useMemo(() => {
    if (data?.data?.length) return data.data
    return MOCK_INSPECTIONS
  }, [data])

  const stats = useMemo(() => {
    const total = allForStats.length
    const approved = allForStats.filter((i: any) => i.result === 'APPROVED').length
    const failed = allForStats.filter((i: any) => i.result === 'FAILED').length
    const pendingReview = allForStats.filter(
      (i: any) => i.result === 'PENDING' || i.status === 'SCHEDULED',
    ).length
    return { total, approved, failed, pendingReview }
  }, [allForStats])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inspecções</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quartos, áreas comuns, cozinha, piscina e segurança
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/inspections/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Inspecção
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Inspecções"
          value={stats.total}
          icon={<ClipboardCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Aprovadas"
          value={stats.approved}
          icon={<CheckCircle className="h-5 w-5" />}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="Reprovadas"
          value={stats.failed}
          icon={<XCircle className="h-5 w-5" />}
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          title="Pendentes Revisão"
          value={stats.pendingReview}
          icon={<Clock className="h-5 w-5" />}
          className="border-l-4 border-l-amber-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        {/* Type filter */}
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-gray-500 mr-1">Tipo:</span>
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTypeFilter(tab.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                typeFilter === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          <span className="self-center text-xs font-medium text-gray-500 mr-1">Estado:</span>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-sm">A carregar inspecções...</span>
          </div>
        </div>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Data</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Tipo</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Localização</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Inspetor</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Resultado</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500">Problemas</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inspections.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <ClipboardCheck className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-3 text-sm text-gray-500">Nenhuma inspecção encontrada</p>
                      <p className="text-xs text-gray-400">
                        Ajuste os filtros ou crie uma nova inspecção
                      </p>
                    </td>
                  </tr>
                )}
                {inspections.map((insp: any) => (
                  <tr
                    key={insp.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-600">
                      {insp.date || insp.scheduledDate
                        ? formatDate(insp.date ?? insp.scheduledDate)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {TYPE_TABS.find((t) => t.value === insp.type)?.label ?? insp.type ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {insp.location ?? insp.roomName ?? insp.facilityName ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {insp.inspector ?? insp.inspectorName ?? insp.assignedTo ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {insp.result ? (
                        <Badge variant={RESULT_VARIANT[insp.result] ?? 'default'}>
                          {RESULT_LABEL[insp.result] ?? insp.result}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(insp.issuesFound ?? 0) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {insp.issuesFound}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[insp.status] ?? 'default'}>
                        {STATUS_LABEL[insp.status] ?? insp.status ?? '—'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => router.push(`/dashboard/inspections/${insp.id}`)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!isLoading && inspections.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          {inspections.length} inspecç{inspections.length !== 1 ? 'ões' : 'ão'} encontrada
          {inspections.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

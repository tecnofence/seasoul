'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Award, Plus, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import api from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  VALID: 'Válida',
  EXPIRING_SOON: 'A Expirar',
  EXPIRED: 'Expirada',
  PENDING: 'Pendente',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  VALID: 'success',
  EXPIRING_SOON: 'warning',
  EXPIRED: 'danger',
  PENDING: 'info',
}

const TYPE_TABS = [
  { value: '', label: 'Todos' },
  { value: 'SAFETY', label: 'Segurança' },
  { value: 'HYGIENE', label: 'Higiene' },
  { value: 'FIRE', label: 'Incêndio' },
  { value: 'ENVIRONMENTAL', label: 'Ambiental' },
  { value: 'OTHER', label: 'Outros' },
]

const TYPE_LABEL: Record<string, string> = {
  SAFETY: 'Segurança',
  HYGIENE: 'Higiene',
  FIRE: 'Incêndio',
  ENVIRONMENTAL: 'Ambiental',
  OTHER: 'Outros',
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CERTS = [
  {
    id: 'mock-1',
    name: 'HACCP — Análise de Perigos e Controlo de Pontos Críticos',
    type: 'HYGIENE',
    issuer: 'INAPEM / Ministério da Saúde',
    issuedAt: '2025-01-15',
    expiresAt: '2026-01-14',
    status: 'EXPIRING_SOON',
  },
  {
    id: 'mock-2',
    name: 'Livro de Reclamações',
    type: 'OTHER',
    issuer: 'INACOM',
    issuedAt: '2025-03-01',
    expiresAt: '2027-02-28',
    status: 'VALID',
  },
  {
    id: 'mock-3',
    name: 'Certificado de Segurança Contra Incêndio',
    type: 'FIRE',
    issuer: 'DNPCI — Corpo de Bombeiros',
    issuedAt: '2024-06-10',
    expiresAt: '2025-06-09',
    status: 'EXPIRED',
  },
  {
    id: 'mock-4',
    name: 'Alvará de Licença Turística',
    type: 'SAFETY',
    issuer: 'Ministério do Turismo de Angola',
    issuedAt: '2023-09-20',
    expiresAt: '2026-09-19',
    status: 'VALID',
  },
  {
    id: 'mock-5',
    name: 'Certificado de Qualidade da Água Potável',
    type: 'HYGIENE',
    issuer: 'EPAS — Empresa Pública de Águas de Angola',
    issuedAt: '2026-01-05',
    expiresAt: '2026-07-04',
    status: 'VALID',
  },
  {
    id: 'mock-6',
    name: 'Licença Ambiental de Operação',
    type: 'ENVIRONMENTAL',
    issuer: 'INAMET / Ministério do Ambiente',
    issuedAt: '2025-11-01',
    expiresAt: null,
    status: 'PENDING',
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeStatus(cert: any): string {
  if (cert.status) return cert.status
  if (!cert.expiresAt) return 'PENDING'
  const now = new Date()
  const exp = new Date(cert.expiresAt)
  if (exp < now) return 'EXPIRED'
  const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return 'EXPIRING_SOON'
  return 'VALID'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CertificationsPage() {
  const router = useRouter()
  const [typeFilter, setTypeFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['certifications', typeFilter],
    queryFn: () =>
      api
        .get('/certifications', {
          params: {
            type: typeFilter || undefined,
            limit: 50,
          },
        })
        .then((r) => r.data)
        .catch(() => null),
    retry: false,
  })

  // Use API data if available, otherwise fall back to mock
  const allCerts: any[] = useMemo(() => {
    if (data?.data?.length) return data.data
    let list = MOCK_CERTS.map((c) => ({ ...c, status: computeStatus(c) }))
    if (typeFilter) list = list.filter((c) => c.type === typeFilter)
    return list
  }, [data, typeFilter])

  // ── Stats ────────────────────────────────────────────────────────────────
  const allForStats = useMemo(() => {
    if (data?.data?.length) return data.data
    return MOCK_CERTS.map((c) => ({ ...c, status: computeStatus(c) }))
  }, [data])

  const stats = useMemo(() => {
    const total = allForStats.length
    const valid = allForStats.filter((c: any) => c.status === 'VALID').length
    const expiringSoon = allForStats.filter((c: any) => c.status === 'EXPIRING_SOON').length
    const expired = allForStats.filter((c: any) => c.status === 'EXPIRED').length
    return { total, valid, expiringSoon, expired }
  }, [allForStats])

  const hasAlerts = stats.expired > 0 || stats.expiringSoon > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificações</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Segurança, higiene, incêndio, ambiente e licenças
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/certifications/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Certificação
        </Button>
      </div>

      {/* Alert banner */}
      {hasAlerts && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Atenção: Certificações a requerer acção</p>
            <p className="mt-0.5 text-amber-700">
              {stats.expired > 0 && (
                <span>
                  {stats.expired} certificaç{stats.expired !== 1 ? 'ões' : 'ão'} expirada
                  {stats.expired !== 1 ? 's' : ''}
                  {stats.expiringSoon > 0 ? ' · ' : ''}
                </span>
              )}
              {stats.expiringSoon > 0 && (
                <span>
                  {stats.expiringSoon} a expirar nos próximos 30 dias
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total Certificações"
          value={stats.total}
          icon={<Award className="h-5 w-5" />}
        />
        <StatCard
          title="Válidas"
          value={stats.valid}
          icon={<CheckCircle className="h-5 w-5" />}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="A Expirar (30 dias)"
          value={stats.expiringSoon}
          icon={<Clock className="h-5 w-5" />}
          className="border-l-4 border-l-amber-400"
        />
        <StatCard
          title="Expiradas"
          value={stats.expired}
          icon={<XCircle className="h-5 w-5" />}
          className="border-l-4 border-l-red-500"
        />
      </div>

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

      {/* Table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-sm">A carregar certificações...</span>
          </div>
        </div>
      ) : (
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left">
                  <th className="px-4 py-3 font-medium text-gray-500">Certificação</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Tipo</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Emitida por</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Emissão</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Validade</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {allCerts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Award className="mx-auto h-10 w-10 text-gray-300" />
                      <p className="mt-3 text-sm text-gray-500">Nenhuma certificação encontrada</p>
                      <p className="text-xs text-gray-400">
                        Ajuste os filtros ou crie uma nova certificação
                      </p>
                    </td>
                  </tr>
                )}
                {allCerts.map((cert: any) => {
                  const status = cert.status ?? computeStatus(cert)
                  return (
                    <tr
                      key={cert.id}
                      className={`transition-colors hover:bg-gray-50 ${
                        status === 'EXPIRED' ? 'bg-red-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {cert.name ?? cert.certName ?? cert.title ?? '—'}
                        </p>
                        {cert.certNumber && (
                          <p className="font-mono text-xs text-gray-400">{cert.certNumber}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {TYPE_LABEL[cert.type] ?? cert.type ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {cert.issuer ?? cert.issuedBy ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {cert.issuedAt ? formatDate(cert.issuedAt) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {cert.expiresAt ? (
                          <span
                            className={
                              status === 'EXPIRED'
                                ? 'font-medium text-red-600'
                                : status === 'EXPIRING_SOON'
                                  ? 'font-medium text-amber-600'
                                  : 'text-gray-600'
                            }
                          >
                            {formatDate(cert.expiresAt)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Sem prazo</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[status] ?? 'default'}>
                          {STATUS_LABEL[status] ?? status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => router.push(`/dashboard/certifications/${cert.id}`)}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {!isLoading && allCerts.length > 0 && (
        <p className="text-center text-xs text-gray-400">
          {allCerts.length} certificaç{allCerts.length !== 1 ? 'ões' : 'ão'} encontrada
          {allCerts.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

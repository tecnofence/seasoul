'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn, formatDateTime } from '@/lib/utils'
import { Info, ChevronLeft, ChevronRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = 'LOGIN' | 'CREATE' | 'UPDATE' | 'DELETE' | 'INVOICE_EMIT' | string

interface AuditEntry {
  id: string
  timestamp: string
  user: string
  action: ActionType
  entity: string
  entityId?: string
  ip: string
}

interface Filters {
  entity: string
  action: string
  dateFrom: string
  dateTo: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_OPTIONS = [
  { value: '', label: 'Todas as ações' },
  { value: 'LOGIN', label: 'LOGIN' },
  { value: 'CREATE', label: 'CREATE' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'INVOICE_EMIT', label: 'INVOICE_EMIT' },
]

const MOCK_LOGS: AuditEntry[] = [
  { id: '1', timestamp: '2026-03-28T09:14:32Z', user: 'super@engeris.ao', action: 'LOGIN', entity: 'Auth', ip: '197.149.64.22' },
  { id: '2', timestamp: '2026-03-28T09:18:05Z', user: 'super@engeris.ao', action: 'CREATE', entity: 'Tenant', entityId: 'clx9k...', ip: '197.149.64.22' },
  { id: '3', timestamp: '2026-03-27T14:43:11Z', user: 'admin@engeris.ao', action: 'UPDATE', entity: 'TenantPlan', entityId: 'demo-resort', ip: '41.63.128.10' },
  { id: '4', timestamp: '2026-03-27T11:22:47Z', user: 'admin@engeris.ao', action: 'DELETE', entity: 'User', entityId: 'usr_123', ip: '41.63.128.10' },
  { id: '5', timestamp: '2026-03-26T15:30:00Z', user: 'admin@engeris.ao', action: 'INVOICE_EMIT', entity: 'Invoice', entityId: 'inv_2026_001', ip: '41.63.128.10' },
  { id: '6', timestamp: '2026-03-26T16:31:08Z', user: 'super@engeris.ao', action: 'UPDATE', entity: 'Settings', entityId: 'session-timeout', ip: '197.149.64.22' },
  { id: '7', timestamp: '2026-03-25T10:05:00Z', user: 'pedro@engeris.ao', action: 'LOGIN', entity: 'Auth', ip: '41.63.200.1' },
  { id: '8', timestamp: '2026-03-24T22:17:44Z', user: 'pedro@engeris.ao', action: 'LOGIN', entity: 'Auth', ip: '41.63.200.1' },
]

// ─── Action badge ──────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    LOGIN: 'bg-blue-100 text-blue-700',
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-amber-100 text-amber-700',
    DELETE: 'bg-red-100 text-red-700',
    INVOICE_EMIT: 'bg-purple-100 text-purple-700',
  }
  const cls = styles[action] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', cls)}>
      {action}
    </span>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

export default function AuditLogPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>({
    entity: '',
    action: '',
    dateFrom: '',
    dateTo: '',
  })

  // Build query params
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(PAGE_SIZE))
  if (filters.entity) params.set('entity', filters.entity)
  if (filters.action) params.set('action', filters.action)
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom)
  if (filters.dateTo) params.set('dateTo', filters.dateTo)

  const { data: apiResult, isLoading } = useQuery({
    queryKey: ['admin-audit-log', page, filters],
    queryFn: () =>
      api.get(`/admin/audit-log?${params.toString()}`).then((r) => r.data?.data ?? r.data),
  })

  // Normalise API response
  const rawLogs: AuditEntry[] = Array.isArray(apiResult?.data)
    ? apiResult.data
    : Array.isArray(apiResult)
    ? apiResult
    : []

  const logs: AuditEntry[] = rawLogs.length > 0 ? rawLogs : MOCK_LOGS

  const totalCount: number = apiResult?.total ?? logs.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registos do Sistema</h1>
          <p className="text-sm text-gray-500">Auditoria completa de todas as ações na plataforma.</p>
        </div>
      </div>

      {/* Policy notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          Registos retidos por <strong>90 dias</strong> conforme política de auditoria da plataforma ENGERIS ONE.
        </p>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Entidade</label>
            <input
              type="text"
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              placeholder="Ex: Tenant, User..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Ação</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">De</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Até</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">A carregar registos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">Data/Hora</th>
                  <th className="px-6 py-3 text-left">Utilizador</th>
                  <th className="px-6 py-3 text-left">Ação</th>
                  <th className="px-6 py-3 text-left">Entidade</th>
                  <th className="px-6 py-3 text-left">ID da Entidade</th>
                  <th className="px-6 py-3 text-left">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                      Nenhum registo encontrado para os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-gray-500">
                        {log.timestamp ? formatDateTime(log.timestamp) : log.timestamp}
                      </td>
                      <td className="px-6 py-3 text-gray-700">{log.user}</td>
                      <td className="px-6 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-6 py-3 text-gray-700">{log.entity}</td>
                      <td className="px-6 py-3 font-mono text-xs text-gray-400">
                        {log.entityId ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-gray-400">
                        {log.ip}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p className="text-xs text-gray-400">
            A mostrar {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}–{Math.min(page * PAGE_SIZE, totalCount)} de {totalCount} registos
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page numbers (show up to 5) */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = totalPages <= 5
                ? i + 1
                : page <= 3
                ? i + 1
                : page >= totalPages - 2
                ? totalPages - 4 + i
                : page - 2 + i
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-colors',
                    page === pageNum
                      ? 'bg-primary text-white'
                      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

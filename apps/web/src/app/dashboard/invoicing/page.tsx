'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Plus, Search, AlertTriangle, Eye, Receipt, TrendingUp, Hash, Calendar } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type DocType = 'FT' | 'FR' | 'NC' | 'ND' | 'ORC' | 'PF' | 'RC' | 'GT' | 'AM' | 'CS'

interface Invoice {
  id: string
  documentType: DocType
  fullNumber: string
  clientName: string
  clientNif?: string
  totalAmount: number
  createdAt: string
  cancelledAt?: string
  paidAt?: string
  isTraining?: boolean
}

interface Summary {
  totalAmount?: number
  totalCount?: number
  taxAmount?: number
  monthAmount?: number
}

interface TypeSummaryEntry {
  type: DocType
  count: number
  total: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_LABELS: Record<string, string> = {
  FT: 'Fatura', FR: 'Fatura-Recibo', NC: 'Nota de Crédito',
  ND: 'Nota de Débito', ORC: 'Orçamento', PF: 'Proforma',
  RC: 'Recibo', GT: 'Guia Transporte', AM: 'Auto Medição', CS: 'Contrato',
}

// No indigo — PF now uses primary/10 palette
const DOC_COLORS: Record<string, string> = {
  FT: 'bg-blue-100 text-blue-800',
  FR: 'bg-green-100 text-green-800',
  NC: 'bg-red-100 text-red-800',
  ND: 'bg-orange-100 text-orange-800',
  ORC: 'bg-purple-100 text-purple-800',
  PF: 'bg-primary/10 text-primary',
  RC: 'bg-teal-100 text-teal-800',
  GT: 'bg-yellow-100 text-yellow-800',
  AM: 'bg-cyan-100 text-cyan-800',
  CS: 'bg-pink-100 text-pink-800',
}

// Chip configs for the filter row (key subset shown as quick-filters)
const QUICK_FILTER_TYPES: DocType[] = ['FT', 'FR', 'NC', 'ND', 'ORC']

// ─── Component ───────────────────────────────────────────────────────────────

export default function InvoicingPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['invoicing', search, typeFilter, page],
    queryFn: () =>
      api.get('/invoicing', {
        params: { search: search || undefined, type: typeFilter || undefined, page, limit: 20 },
      }).then((r) => r.data),
  })

  const { data: summary } = useQuery<Summary>({
    queryKey: ['invoicing-summary'],
    queryFn: () => api.get('/invoicing/summary').then((r) => r.data.data),
  })

  const { data: typeSummaryRaw } = useQuery({
    queryKey: ['invoicing-type-summary'],
    queryFn: () =>
      api.get('/invoicing/summary/by-type').then((r) => r.data.data)
        .catch(() => null),
    retry: 1,
  })

  const invoices: Invoice[] = data?.data ?? []
  const totalPages: number = data?.totalPages ?? 1
  const typeSummary: TypeSummaryEntry[] = typeSummaryRaw ?? []

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturação</h1>
          <p className="mt-0.5 text-sm text-gray-500">Documentos fiscais e faturação AGT</p>
        </div>
        <Button onClick={() => router.push('/dashboard/invoicing/new')}>
          <Plus className="mr-2 h-4 w-4" /> Novo Documento
        </Button>
      </div>

      {/* ── Summary stats row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Faturado</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {summary ? formatKwanza(summary.totalAmount ?? 0) : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Hash className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Nº Documentos</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {summary?.totalCount ?? '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">IVA Total</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {summary ? formatKwanza(summary.taxAmount ?? 0) : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Este Mês</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {summary ? formatKwanza(summary.monthAmount ?? 0) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Document type summary cards (clickable filter) ── */}
      {typeSummary.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {typeSummary.map((s) => (
            <button
              key={s.type}
              onClick={() => setTypeFilter(typeFilter === s.type ? '' : s.type)}
              className={`rounded-lg border p-3 text-left transition-shadow hover:shadow-md ${
                typeFilter === s.type ? 'ring-2 ring-primary' : 'bg-white'
              }`}
            >
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  DOC_COLORS[s.type] ?? 'bg-gray-100 text-gray-700'
                }`}
              >
                {s.type}
              </span>
              <p className="mt-1 text-lg font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-gray-500">{formatKwanza(s.total)}</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Quick-filter type chips ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Filtrar por tipo:</span>
        <button
          onClick={() => { setTypeFilter(''); setPage(1) }}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            typeFilter === ''
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {QUICK_FILTER_TYPES.map((code) => (
          <button
            key={code}
            onClick={() => { setTypeFilter(typeFilter === code ? '' : code); setPage(1) }}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              typeFilter === code
                ? (DOC_COLORS[code] ?? 'bg-primary/10 text-primary') + ' ring-2 ring-offset-1 ring-primary/40'
                : (DOC_COLORS[code] ?? 'bg-gray-100 text-gray-700') + ' hover:opacity-80'
            }`}
          >
            {code} <span className="ml-1 font-normal opacity-75">— {DOC_LABELS[code]}</span>
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Pesquisar por número, cliente ou NIF..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(DOC_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{code} — {label}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-sm">A carregar documentos...</span>
          </div>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">NIF</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-12 text-center">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => router.push(`/dashboard/invoicing/${inv.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                          DOC_COLORS[inv.documentType] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {inv.documentType}
                      </span>
                      <span className="font-mono text-sm text-gray-800">{inv.fullNumber}</span>
                      {inv.isTraining && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                          TREINO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.clientName}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.clientNif || '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatKwanza(Number(inv.totalAmount))}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(inv.createdAt).toLocaleDateString('pt-AO')}
                  </td>
                  <td className="px-4 py-3">
                    {inv.cancelledAt ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertTriangle className="h-3 w-3" /> Anulada
                      </span>
                    ) : inv.paidAt ? (
                      <span className="text-xs font-medium text-green-600">Paga</span>
                    ) : (
                      <span className="text-xs font-medium text-primary">Emitida</span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => router.push(`/dashboard/invoicing/${inv.id}`)}
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoices.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhum documento encontrado</p>
              <p className="mt-1 text-sm text-gray-400">Tente ajustar os filtros de pesquisa</p>
            </div>
          )}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <span className="px-2 text-sm text-gray-500">
            Página <span className="font-medium">{page}</span> de{' '}
            <span className="font-medium">{totalPages}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Seguinte
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Plus, Search, AlertTriangle } from 'lucide-react'

const DOC_LABELS: Record<string, string> = {
  FT: 'Fatura', FR: 'Fatura-Recibo', NC: 'Nota de Crédito',
  ND: 'Nota de Débito', ORC: 'Orçamento', PF: 'Proforma',
  RC: 'Recibo', GT: 'Guia Transporte', AM: 'Auto Medição', CS: 'Contrato',
}

const DOC_COLORS: Record<string, string> = {
  FT: 'bg-blue-100 text-blue-800', FR: 'bg-green-100 text-green-800',
  NC: 'bg-red-100 text-red-800', ND: 'bg-orange-100 text-orange-800',
  ORC: 'bg-purple-100 text-purple-800', PF: 'bg-indigo-100 text-indigo-800',
  RC: 'bg-teal-100 text-teal-800', GT: 'bg-yellow-100 text-yellow-800',
  AM: 'bg-cyan-100 text-cyan-800', CS: 'bg-pink-100 text-pink-800',
}

export default function InvoicingPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['invoicing', search, typeFilter, page],
    queryFn: () => api.get('/invoicing', {
      params: { search: search || undefined, type: typeFilter || undefined, page, limit: 20 },
    }).then((r) => r.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['invoicing-summary'],
    queryFn: () => api.get('/invoicing/summary').then((r) => r.data.data),
  })

  const invoices = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Faturação</h1>
        <Button onClick={() => router.push('/dashboard/invoicing/new')}>
          <Plus className="mr-2 h-4 w-4" /> Novo Documento
        </Button>
      </div>

      {/* Resumo por tipo */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {summary.map((s: any) => (
            <button
              key={s.type}
              onClick={() => setTypeFilter(typeFilter === s.type ? '' : s.type)}
              className={`rounded-lg border p-3 text-left transition-shadow hover:shadow-md ${typeFilter === s.type ? 'ring-2 ring-primary' : ''}`}
            >
              <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${DOC_COLORS[s.type] ?? 'bg-gray-100'}`}>
                {s.type}
              </span>
              <p className="mt-1 text-lg font-bold">{s.count}</p>
              <p className="text-xs text-gray-500">{formatKwanza(s.total)}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filtros */}
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
          className="rounded-md border bg-white px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(DOC_LABELS).map(([code, label]) => (
            <option key={code} value={code}>{code} — {label}</option>
          ))}
        </select>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <p className="text-gray-500">A carregar...</p>
      ) : (
        <div className="overflow-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Documento</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">NIF</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv: any) => (
                <tr
                  key={inv.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/dashboard/invoicing/${inv.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${DOC_COLORS[inv.documentType] ?? 'bg-gray-100'}`}>
                        {inv.documentType}
                      </span>
                      <span className="font-mono text-sm">{inv.fullNumber}</span>
                      {inv.isTraining && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">TREINO</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{inv.clientName}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.clientNif || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatKwanza(Number(inv.totalAmount))}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(inv.createdAt).toLocaleDateString('pt-AO')}</td>
                  <td className="px-4 py-3">
                    {inv.cancelledAt ? (
                      <span className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" /> Anulada
                      </span>
                    ) : inv.paidAt ? (
                      <span className="text-xs text-green-600">Paga</span>
                    ) : (
                      <span className="text-xs text-blue-600">Emitida</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoices.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhum documento encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>Anterior</Button>
          <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
          <Button variant="ghost" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Seguinte</Button>
        </div>
      )}
    </div>
  )
}

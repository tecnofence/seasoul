'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Plus,
  CheckCircle,
  Circle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Wallet,
  ExternalLink,
} from 'lucide-react'

// ─── Tipos e constantes ───────────────────────────────────────────────────────

type EntryType = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'

const TYPE_CONFIG: Record<EntryType, { label: string; bg: string; text: string }> = {
  RECEITA:       { label: 'Receita',       bg: 'bg-green-100', text: 'text-green-700' },
  DESPESA:       { label: 'Despesa',       bg: 'bg-red-100',   text: 'text-red-700'   },
  TRANSFERENCIA: { label: 'Transferência', bg: 'bg-blue-100',  text: 'text-blue-700'  },
}

const CATEGORY_LABEL: Record<string, string> = {
  REVENUE:   'Receita',
  EXPENSE:   'Despesa',
  ASSET:     'Activo',
  LIABILITY: 'Passivo',
  EQUITY:    'Capital Próprio',
  TRANSFER:  'Transferência',
}

type FilterTab = 'all' | 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',           label: 'Todos'          },
  { key: 'RECEITA',       label: 'Receitas'       },
  { key: 'DESPESA',       label: 'Despesas'       },
  { key: 'TRANSFERENCIA', label: 'Transferências' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveEntryType(entry: any): EntryType {
  if (entry.type) {
    const t = String(entry.type).toUpperCase()
    if (t in TYPE_CONFIG) return t as EntryType
  }
  if (entry.category) {
    const c = String(entry.category).toUpperCase()
    if (c === 'REVENUE') return 'RECEITA'
    if (c === 'EXPENSE') return 'DESPESA'
    if (c === 'TRANSFER') return 'TRANSFERENCIA'
  }
  // Inferir pelo débito/crédito
  const debit  = parseFloat(entry.debit  ?? '0') || 0
  const credit = parseFloat(entry.credit ?? '0') || 0
  if (debit > 0 && credit === 0) return 'RECEITA'
  if (credit > 0 && debit === 0) return 'DESPESA'
  return 'TRANSFERENCIA'
}

function entryAmount(entry: any): number {
  const debit  = parseFloat(entry.debit  ?? '0') || 0
  const credit = parseFloat(entry.credit ?? '0') || 0
  if (debit > 0)  return debit
  if (credit > 0) return credit
  return parseFloat(entry.amount ?? '0') || 0
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AccountingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [reconciledFilter, setReconciledFilter] = useState('')

  // ── Totais via endpoint dedicado ────────────────────────────────────────
  const { data: summaryData } = useQuery({
    queryKey: ['accounting', 'summary'],
    queryFn: () =>
      api.get('/accounting/summary')
        .then((r) => r.data)
        .catch(() => null),
  })

  // ── Lista de lançamentos ────────────────────────────────────────────────
  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['accounting', 'entries', activeTab, reconciledFilter],
    queryFn: () =>
      api.get('/accounting/entries', {
        params: {
          type:       activeTab !== 'all' ? activeTab : undefined,
          reconciled: reconciledFilter === '' ? undefined : reconciledFilter === 'true',
          limit:      30,
        },
      })
      .then((r) => r.data)
      .catch(() =>
        // Fallback: tentar o endpoint raiz
        api.get('/accounting', {
          params: {
            category:   activeTab !== 'all' ? activeTab : undefined,
            reconciled: reconciledFilter === '' ? undefined : reconciledFilter === 'true',
            limit:      30,
          },
        }).then((r) => r.data)
      ),
  })

  const entries: any[] = entriesData?.data ?? []

  // ── Calcular totais a partir dos lançamentos (fallback se sem summary) ──
  const totalReceitas    = entries.filter((e) => resolveEntryType(e) === 'RECEITA')
                                  .reduce((s, e) => s + entryAmount(e), 0)
  const totalDespesas    = entries.filter((e) => resolveEntryType(e) === 'DESPESA')
                                  .reduce((s, e) => s + entryAmount(e), 0)
  const resultado        = totalReceitas - totalDespesas
  const saldoEstimado    = summaryData?.saldo ?? summaryData?.balance ?? resultado

  const statsReceitas = summaryData?.totalReceitas ?? summaryData?.totalRevenue  ?? totalReceitas
  const statsDespesas = summaryData?.totalDespesas ?? summaryData?.totalExpenses ?? totalDespesas
  const statsResultado = summaryData?.resultado    ?? summaryData?.result        ?? resultado

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contabilidade</h1>
          <p className="text-sm text-gray-500">Gestão de receitas, despesas e transferências</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/accounting/new')}
          className="bg-primary text-white hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Receitas */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Receitas Total</p>
              <p className="mt-1.5 text-2xl font-bold text-gray-900">{formatKwanza(statsReceitas)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {entries.filter((e) => resolveEntryType(e) === 'RECEITA').length} lançamentos
          </p>
        </div>

        {/* Despesas */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Despesas Total</p>
              <p className="mt-1.5 text-2xl font-bold text-gray-900">{formatKwanza(statsDespesas)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {entries.filter((e) => resolveEntryType(e) === 'DESPESA').length} lançamentos
          </p>
        </div>

        {/* Resultado */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Resultado</p>
              <p className={`mt-1.5 text-2xl font-bold ${statsResultado >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {formatKwanza(statsResultado)}
              </p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${statsResultado >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`h-5 w-5 ${statsResultado >= 0 ? 'text-green-600' : 'text-red-500'}`} />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">Receitas − Despesas</p>
        </div>

        {/* Saldo estimado */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Saldo Estimado</p>
              <p className="mt-1.5 text-2xl font-bold text-gray-900">{formatKwanza(saldoEstimado)}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">Saldo consolidado</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tabs por tipo */}
        <div className="flex gap-1 rounded-lg border bg-gray-50 p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-primary shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filtro reconciliado */}
        <select
          className="rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={reconciledFilter}
          onChange={(e) => setReconciledFilter(e.target.value)}
        >
          <option value="">Todos os estados</option>
          <option value="true">Reconciliado</option>
          <option value="false">Não Reconciliado</option>
        </select>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border bg-white py-16">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
            <p className="text-sm">A carregar lançamentos...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Data</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Conta</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Rec.</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry: any) => {
                const entryType = resolveEntryType(entry)
                const typeConf  = TYPE_CONFIG[entryType]
                const amount    = entryAmount(entry)

                return (
                  <tr key={entry.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {entry.date ? formatDate(entry.date) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeConf.bg} ${typeConf.text}`}>
                        {typeConf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">
                      {entry.description ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {CATEGORY_LABEL[entry.category] ?? entry.category ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {entry.account ?? entry.accountName ?? '—'}
                    </td>
                    <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold ${
                      entryType === 'RECEITA'
                        ? 'text-green-700'
                        : entryType === 'DESPESA'
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}>
                      {entryType === 'DESPESA' ? '−' : '+'}{formatKwanza(amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {entry.reconciled
                        ? <CheckCircle className="mx-auto h-4 w-4 text-green-500" />
                        : <Circle       className="mx-auto h-4 w-4 text-gray-300" />
                      }
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      <button
                        onClick={() => router.push(`/dashboard/accounting/${entry.id}`)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-sm text-gray-400">
                    Nenhum lançamento encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

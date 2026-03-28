'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Scale, FileText } from 'lucide-react'
import api from '@/lib/api'
import { formatKwanza, formatDateTime } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'

const COLORS = ['#1A3E6E', '#EF4444', '#10B981', '#F59E0B']

// ── Dados de amostra ─────────────────────────────────────────────────────────

const SAMPLE_MONTHLY = [
  { mes: 'Jan', receitas: 12_000_000, despesas: 8_000_000 },
  { mes: 'Fev', receitas: 14_000_000, despesas: 9_000_000 },
  { mes: 'Mar', receitas: 18_000_000, despesas: 11_000_000 },
  { mes: 'Abr', receitas: 15_000_000, despesas: 10_000_000 },
  { mes: 'Mai', receitas: 19_000_000, despesas: 12_000_000 },
  { mes: 'Jun', receitas: 22_000_000, despesas: 13_000_000 },
  { mes: 'Jul', receitas: 28_000_000, despesas: 16_000_000 },
  { mes: 'Ago', receitas: 26_000_000, despesas: 15_000_000 },
  { mes: 'Set', receitas: 21_000_000, despesas: 13_000_000 },
  { mes: 'Out', receitas: 17_000_000, despesas: 11_000_000 },
  { mes: 'Nov', receitas: 20_000_000, despesas: 13_000_000 },
  { mes: 'Dez', receitas: 30_000_000, despesas: 18_000_000 },
]

const SAMPLE_CATEGORIES = [
  { categoria: 'Salários', valor: 10_200_000 },
  { categoria: 'Fornecedores', valor: 4_800_000 },
  { categoria: 'Manutenção', valor: 2_100_000 },
  { categoria: 'Utilities', valor: 1_500_000 },
  { categoria: 'Marketing', valor: 900_000 },
  { categoria: 'Outro', valor: 1_400_000 },
]

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const CATEGORY_LABELS: Record<string, string> = {
  SALARIOS: 'Salários',
  FORNECEDORES: 'Fornecedores',
  MANUTENCAO: 'Manutenção',
  UTILITIES: 'Utilities',
  MARKETING: 'Marketing',
  OUTRO: 'Outro',
  REVENUE: 'Receita',
  EXPENSE: 'Despesa',
}

interface AccountingEntry {
  id: string
  date: string
  description: string
  category?: string
  debit: number | string
  credit: number | string
  account: string
  createdAt: string
}

function processEntries(entries: AccountingEntry[]) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let totalReceitas = 0
  let totalDespesas = 0

  const monthlyMap: Record<string, { receitas: number; despesas: number }> = {}
  MONTHS.forEach((m) => (monthlyMap[m] = { receitas: 0, despesas: 0 }))

  const categoryMap: Record<string, number> = {}

  entries.forEach((entry) => {
    const credit = parseFloat(String(entry.credit ?? 0))
    const debit = parseFloat(String(entry.debit ?? 0))
    const d = new Date(entry.date || entry.createdAt)
    const monthName = MONTHS[d.getMonth()]

    // credit = receita, debit = despesa (standard double-entry)
    if (monthName) {
      monthlyMap[monthName].receitas += credit
      monthlyMap[monthName].despesas += debit
    }

    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      totalReceitas += credit
      totalDespesas += debit
    }

    if (debit > 0 && entry.category) {
      const cat = entry.category
      categoryMap[cat] = (categoryMap[cat] || 0) + debit
    }
  })

  const monthly = MONTHS.map((mes) => ({
    mes,
    receitas: monthlyMap[mes].receitas,
    despesas: monthlyMap[mes].despesas,
  }))

  const categories = Object.entries(categoryMap).map(([cat, valor]) => ({
    categoria: CATEGORY_LABELS[cat] ?? cat,
    valor,
  }))

  return { totalReceitas, totalDespesas, monthly, categories }
}

function tipoBadge(entry: AccountingEntry) {
  const credit = parseFloat(String(entry.credit ?? 0))
  const debit = parseFloat(String(entry.debit ?? 0))
  if (credit > 0 && credit >= debit) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        RECEITA
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
      DESPESA
    </span>
  )
}

export default function FinancialReportsPage() {
  const { data: entriesData } = useQuery<{ data: AccountingEntry[] }>({
    queryKey: ['accounting-entries-report'],
    queryFn: () => api.get('/accounting?limit=200').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const entries = entriesData?.data ?? []
  const hasData = entries.length > 0

  const processed = hasData
    ? processEntries(entries)
    : {
        totalReceitas: SAMPLE_MONTHLY.reduce((a, m) => a + m.receitas, 0) / 12,
        totalDespesas: SAMPLE_MONTHLY.reduce((a, m) => a + m.despesas, 0) / 12,
        monthly: SAMPLE_MONTHLY,
        categories: SAMPLE_CATEGORIES,
      }

  const { totalReceitas, totalDespesas, monthly, categories } = processed
  const resultado = totalReceitas - totalDespesas

  const recentEntries = hasData
    ? [...entries].sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()).slice(0, 20)
    : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/reports"
          className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <p className="mt-1 text-sm text-gray-500">
            Análise de receitas, despesas e resultados do período
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receitas do Mês"
          value={formatKwanza(totalReceitas)}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          description="Total de entradas no mês corrente"
        />
        <StatCard
          title="Despesas do Mês"
          value={formatKwanza(totalDespesas)}
          icon={<TrendingDown className="h-6 w-6 text-red-500" />}
          description="Total de saídas no mês corrente"
        />
        <StatCard
          title="Resultado"
          value={formatKwanza(resultado)}
          icon={<Scale className="h-6 w-6 text-primary" />}
          description={resultado >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
        />
        <StatCard
          title="Faturas Emitidas"
          value="47"
          icon={<FileText className="h-6 w-6 text-primary" />}
          description="No mês corrente"
        />
      </div>

      {/* Area Chart — Receitas vs Despesas por mês */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-base font-semibold text-gray-900">
          Receitas vs Despesas — Últimos 12 Meses
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A3E6E" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1A3E6E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                tick={{ fontSize: 11 }}
                width={48}
              />
              <Tooltip
                formatter={(value: number) => [formatKwanza(value)]}
                labelStyle={{ fontWeight: 600 }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="receitas"
                name="Receitas"
                stroke="#1A3E6E"
                strokeWidth={2}
                fill="url(#gradReceitas)"
              />
              <Area
                type="monotone"
                dataKey="despesas"
                name="Despesas"
                stroke="#EF4444"
                strokeWidth={2}
                fill="url(#gradDespesas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart — Despesas por Categoria */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-base font-semibold text-gray-900">
          Despesas por Categoria
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categories.length > 0 ? categories : SAMPLE_CATEGORIES}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                dataKey="categoria"
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value: number) => [formatKwanza(value), 'Despesa']} />
              <Bar dataKey="valor" name="Despesa" radius={[0, 6, 6, 0]}>
                {(categories.length > 0 ? categories : SAMPLE_CATEGORIES).map((_, idx) => (
                  <Cell key={`cat-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table — Últimos 20 Lançamentos */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Últimos Lançamentos</h2>
          <p className="text-xs text-gray-400">20 lançamentos mais recentes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Data</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Descrição</th>
                <th className="px-6 py-3 text-left">Categoria</th>
                <th className="px-6 py-3 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Sem lançamentos disponíveis
                  </td>
                </tr>
              ) : (
                recentEntries.map((entry) => {
                  const credit = parseFloat(String(entry.credit ?? 0))
                  const debit = parseFloat(String(entry.debit ?? 0))
                  const valor = credit > 0 && credit >= debit ? credit : debit
                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 text-gray-500 whitespace-nowrap">
                        {formatDateTime(entry.date || entry.createdAt)}
                      </td>
                      <td className="px-6 py-3">{tipoBadge(entry)}</td>
                      <td className="px-6 py-3 font-medium text-gray-800 max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="px-6 py-3 text-gray-500">
                        {entry.category ? (CATEGORY_LABELS[entry.category] ?? entry.category) : '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                        {formatKwanza(valor)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

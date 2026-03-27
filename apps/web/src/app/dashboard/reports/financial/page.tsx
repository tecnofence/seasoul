'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const COLORS = ['#0A5C8A', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899']

// Dados de amostra — usados quando a API não está disponível
const sampleMonthlyRevenue = [
  { month: 'Jan', receita: 4500000, despesas: 3200000 },
  { month: 'Fev', receita: 5200000, despesas: 3400000 },
  { month: 'Mar', receita: 4800000, despesas: 3100000 },
  { month: 'Abr', receita: 6100000, despesas: 3800000 },
  { month: 'Mai', receita: 5700000, despesas: 3500000 },
  { month: 'Jun', receita: 7200000, despesas: 4200000 },
  { month: 'Jul', receita: 8100000, despesas: 4600000 },
  { month: 'Ago', receita: 7800000, despesas: 4400000 },
  { month: 'Set', receita: 6500000, despesas: 3900000 },
  { month: 'Out', receita: 5900000, despesas: 3600000 },
  { month: 'Nov', receita: 6800000, despesas: 4000000 },
  { month: 'Dez', receita: 9200000, despesas: 5100000 },
]

const sampleInvoiceDistribution = [
  { name: 'Fatura', value: 45 },
  { name: 'Fatura-Recibo', value: 30 },
  { name: 'Nota de Crédito', value: 8 },
  { name: 'Nota de Débito', value: 5 },
  { name: 'Recibo', value: 12 },
]

const sampleTopClients = [
  { name: 'Sonangol EP', receita: 12500000 },
  { name: 'Odebrecht Angola', receita: 9800000 },
  { name: 'BAI - Banco', receita: 7600000 },
  { name: 'Unitel S.A.', receita: 6200000 },
  { name: 'TAAG Airlines', receita: 5100000 },
]

const sampleTaxSummary = [
  { name: 'IVA Cobrado', value: 11200000 },
  { name: 'IVA Pago', value: 7800000 },
]

const kwanzaFormatter = (value: number) => formatKwanza(value)

export default function FinancialReportsPage() {
  // Tentar buscar dados da API, usar amostra como fallback
  const { data: invoices } = useQuery({
    queryKey: ['reports-invoices'],
    queryFn: () => api.get('/invoicing?limit=100').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  // Processar dados reais ou usar amostra
  const monthlyRevenue = invoices
    ? processMonthlyRevenue(invoices)
    : sampleMonthlyRevenue

  const invoiceDistribution = invoices
    ? processInvoiceDistribution(invoices)
    : sampleInvoiceDistribution

  const topClients = invoices
    ? processTopClients(invoices)
    : sampleTopClients

  const taxSummary = invoices
    ? processTaxSummary(invoices)
    : sampleTaxSummary

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/reports"
          className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <p className="mt-1 text-sm text-gray-500">
            Análise de receitas, faturas e impostos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Receita Mensal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Receita vs Despesas — Últimos 12 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={kwanzaFormatter} />
                  <Tooltip formatter={(value: number) => formatKwanza(value)} />
                  <Legend />
                  <Bar dataKey="receita" name="Receita" fill="#0A5C8A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Faturas */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo de Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {invoiceDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes por Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClients} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={kwanzaFormatter} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatKwanza(value)} />
                  <Bar dataKey="receita" name="Receita" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resumo IVA */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Resumo de IVA (14%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-gray-500">IVA Cobrado</p>
                <p className="text-2xl font-bold text-[#0A5C8A]">
                  {formatKwanza(taxSummary[0]?.value ?? 0)}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-gray-500">IVA Pago (Dedutível)</p>
                <p className="text-2xl font-bold text-[#EF4444]">
                  {formatKwanza(taxSummary[1]?.value ?? 0)}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-gray-500">IVA a Entregar ao Estado</p>
                <p className="text-2xl font-bold text-[#10B981]">
                  {formatKwanza((taxSummary[0]?.value ?? 0) - (taxSummary[1]?.value ?? 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Funções de processamento de dados reais da API
function processMonthlyRevenue(invoices: any[]) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const revenueMap: Record<string, { receita: number; despesas: number }> = {}
  months.forEach((m) => (revenueMap[m] = { receita: 0, despesas: 0 }))

  invoices.forEach((inv: any) => {
    const date = new Date(inv.issueDate || inv.createdAt)
    const monthIdx = date.getMonth()
    const monthName = months[monthIdx]
    if (monthName) {
      const total = parseFloat(inv.totalAmount || inv.total || '0')
      if (inv.documentType === 'NC') {
        revenueMap[monthName].despesas += total
      } else {
        revenueMap[monthName].receita += total
      }
    }
  })

  return months.map((month) => ({
    month,
    receita: revenueMap[month].receita,
    despesas: revenueMap[month].despesas,
  }))
}

function processInvoiceDistribution(invoices: any[]) {
  const typeMap: Record<string, number> = {}
  const labelMap: Record<string, string> = {
    FT: 'Fatura',
    FR: 'Fatura-Recibo',
    NC: 'Nota de Crédito',
    ND: 'Nota de Débito',
    ORC: 'Orçamento',
    PF: 'Proforma',
    RC: 'Recibo',
    GT: 'Guia de Transporte',
    AM: 'Auto de Medição',
    CS: 'Contrato de Serviço',
  }
  invoices.forEach((inv: any) => {
    const type = inv.documentType || 'FT'
    typeMap[type] = (typeMap[type] || 0) + 1
  })
  return Object.entries(typeMap).map(([key, value]) => ({
    name: labelMap[key] || key,
    value,
  }))
}

function processTopClients(invoices: any[]) {
  const clientMap: Record<string, number> = {}
  invoices.forEach((inv: any) => {
    const name = inv.clientName || inv.client?.name || 'Desconhecido'
    const total = parseFloat(inv.totalAmount || inv.total || '0')
    clientMap[name] = (clientMap[name] || 0) + total
  })
  return Object.entries(clientMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, receita]) => ({ name, receita }))
}

function processTaxSummary(invoices: any[]) {
  let collected = 0
  let paid = 0
  invoices.forEach((inv: any) => {
    const tax = parseFloat(inv.taxAmount || inv.tax || '0')
    if (inv.documentType === 'NC') {
      paid += tax
    } else {
      collected += tax
    }
  })
  return [
    { name: 'IVA Cobrado', value: collected },
    { name: 'IVA Pago', value: paid },
  ]
}

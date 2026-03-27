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
  AreaChart,
  Area,
} from 'recharts'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const COLORS = ['#0A5C8A', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899']

// Dados de amostra
const samplePipeline = [
  { stage: 'Prospeção', quantidade: 45, valor: 28000000 },
  { stage: 'Qualificação', quantidade: 32, valor: 22000000 },
  { stage: 'Proposta', quantidade: 18, valor: 15000000 },
  { stage: 'Negociação', quantidade: 10, valor: 9500000 },
  { stage: 'Fechado/Ganho', quantidade: 6, valor: 7200000 },
]

const sampleConversionRates = [
  { stage: 'Prospeção -> Qualificação', taxa: 71 },
  { stage: 'Qualificação -> Proposta', taxa: 56 },
  { stage: 'Proposta -> Negociação', taxa: 56 },
  { stage: 'Negociação -> Fechado', taxa: 60 },
]

const sampleRevenueByClientType = [
  { name: 'Empresa Pública', value: 35 },
  { name: 'Empresa Privada', value: 40 },
  { name: 'ONG', value: 10 },
  { name: 'Pessoa Singular', value: 15 },
]

const sampleSalesTrend = [
  { month: 'Jan', vendas: 3200000 },
  { month: 'Fev', vendas: 3800000 },
  { month: 'Mar', vendas: 4100000 },
  { month: 'Abr', vendas: 3600000 },
  { month: 'Mai', vendas: 4500000 },
  { month: 'Jun', vendas: 5200000 },
  { month: 'Jul', vendas: 5800000 },
  { month: 'Ago', vendas: 5400000 },
  { month: 'Set', vendas: 4900000 },
  { month: 'Out', vendas: 5100000 },
  { month: 'Nov', vendas: 6200000 },
  { month: 'Dez', vendas: 7800000 },
]

const sampleTopDeals = [
  { deal: 'Projeto Solar Luanda', client: 'Sonangol EP', value: 12500000, stage: 'Negociação' },
  { deal: 'Instalação CCTV Porto', client: 'Porto de Luanda', value: 8200000, stage: 'Proposta' },
  { deal: 'Rede Elétrica Viana', client: 'ENDE', value: 7600000, stage: 'Fechado/Ganho' },
  { deal: 'Manutenção Predial', client: 'BAI - Banco', value: 5400000, stage: 'Negociação' },
  { deal: 'Sistema Segurança', client: 'Unitel S.A.', value: 4800000, stage: 'Qualificação' },
]

const kwanzaFormatter = (value: number) => formatKwanza(value)

export default function CommercialReportsPage() {
  const { data: pipeline } = useQuery({
    queryKey: ['reports-pipeline'],
    queryFn: () => api.get('/pipeline?limit=200').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const { data: clients } = useQuery({
    queryKey: ['reports-clients'],
    queryFn: () => api.get('/clients?limit=200').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const pipelineData = pipeline ? processPipeline(pipeline) : samplePipeline
  const revenueByClientType = clients
    ? processClientTypes(clients)
    : sampleRevenueByClientType

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
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Comerciais</h1>
          <p className="mt-1 text-sm text-gray-500">
            Pipeline de vendas, conversões e tendências
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Funil de Vendas */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline de Vendas — Funil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={kwanzaFormatter} />
                  <YAxis dataKey="stage" type="category" width={130} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatKwanza(value)} />
                  <Legend />
                  <Bar dataKey="valor" name="Valor Total" fill="#0A5C8A" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Taxas de Conversão */}
        <Card>
          <CardHeader>
            <CardTitle>Taxas de Conversão por Etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleConversionRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Bar dataKey="taxa" name="Taxa de Conversão" fill="#10B981" radius={[4, 4, 0, 0]}>
                    {sampleConversionRates.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Receita por Tipo de Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Receita por Tipo de Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByClientType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {revenueByClientType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tendência de Vendas */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tendência de Vendas — Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampleSalesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={kwanzaFormatter} />
                  <Tooltip formatter={(value: number) => formatKwanza(value)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="vendas"
                    name="Vendas"
                    stroke="#0A5C8A"
                    fill="#0A5C8A"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Negócios */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Top Negócios em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="pb-3 font-medium">Negócio</th>
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Valor</th>
                    <th className="pb-3 font-medium">Etapa</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleTopDeals.map((deal, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{deal.deal}</td>
                      <td className="py-3 text-gray-600">{deal.client}</td>
                      <td className="py-3 font-medium text-gray-900">{formatKwanza(deal.value)}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {deal.stage}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Funções de processamento
function processPipeline(deals: any[]) {
  const stageMap: Record<string, string> = {
    PROSPECTING: 'Prospeção',
    QUALIFICATION: 'Qualificação',
    PROPOSAL: 'Proposta',
    NEGOTIATION: 'Negociação',
    CLOSED_WON: 'Fechado/Ganho',
    CLOSED_LOST: 'Fechado/Perdido',
  }
  const grouped: Record<string, { quantidade: number; valor: number }> = {}

  deals.forEach((deal: any) => {
    const stage = deal.stage || 'PROSPECTING'
    if (!grouped[stage]) grouped[stage] = { quantidade: 0, valor: 0 }
    grouped[stage].quantidade += 1
    grouped[stage].valor += parseFloat(deal.value || deal.amount || '0')
  })

  return Object.entries(grouped).map(([key, data]) => ({
    stage: stageMap[key] || key,
    quantidade: data.quantidade,
    valor: data.valor,
  }))
}

function processClientTypes(clients: any[]) {
  const typeMap: Record<string, string> = {
    PUBLIC_COMPANY: 'Empresa Pública',
    PRIVATE_COMPANY: 'Empresa Privada',
    NGO: 'ONG',
    INDIVIDUAL: 'Pessoa Singular',
  }
  const map: Record<string, number> = {}
  clients.forEach((c: any) => {
    const type = c.type || c.clientType || 'PRIVATE_COMPANY'
    map[type] = (map[type] || 0) + 1
  })
  return Object.entries(map).map(([key, value]) => ({
    name: typeMap[key] || key,
    value,
  }))
}

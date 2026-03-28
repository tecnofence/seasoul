'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const COLORS = ['#0A5C8A', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899']

// Dados de amostra hoteleiros
const sampleOccupancyTrend = [
  { month: 'Jan', ocupacao: 62 },
  { month: 'Fev', ocupacao: 71 },
  { month: 'Mar', ocupacao: 78 },
  { month: 'Abr', ocupacao: 65 },
  { month: 'Mai', ocupacao: 74 },
  { month: 'Jun', ocupacao: 82 },
  { month: 'Jul', ocupacao: 91 },
  { month: 'Ago', ocupacao: 89 },
  { month: 'Set', ocupacao: 76 },
  { month: 'Out', ocupacao: 68 },
  { month: 'Nov', ocupacao: 72 },
  { month: 'Dez', ocupacao: 85 },
]

const sampleRevenueByDept = [
  { dept: 'Alojamento', receita: 125000000 },
  { dept: 'Restaurante', receita: 38000000 },
  { dept: 'Bar', receita: 18000000 },
  { dept: 'Spa', receita: 22000000 },
  { dept: 'Atividades', receita: 12000000 },
  { dept: 'Loja', receita: 8000000 },
]

const sampleReservationSource = [
  { name: 'Direto / Website', value: 38 },
  { name: 'OTA (Booking.com)', value: 27 },
  { name: 'Agência de Viagens', value: 18 },
  { name: 'Empresas / Corporate', value: 12 },
  { name: 'Outros', value: 5 },
]

const sampleTopGuests = [
  { name: 'Empresa Cabinda Oil', reservas: 12, gasto: 28500000, tipo: 'Corporate' },
  { name: 'Sonangol Upstream', reservas: 8, gasto: 19200000, tipo: 'Corporate' },
  { name: 'João Rodrigues', reservas: 6, gasto: 9800000, tipo: 'Particular' },
  { name: 'Embaixada de Portugal', reservas: 5, gasto: 14300000, tipo: 'Diplomático' },
  { name: 'TotalEnergies Angola', reservas: 4, gasto: 11600000, tipo: 'Corporate' },
]

export default function CommercialReportsPage() {
  const { data: reservations } = useQuery({
    queryKey: ['reports-reservations'],
    queryFn: () => api.get('/reservations?limit=200').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const { data: retailSummary } = useQuery({
    queryKey: ['reports-retail-summary'],
    queryFn: () => api.get('/retail/summary').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const occupancyData = reservations
    ? buildOccupancyTrend(reservations)
    : sampleOccupancyTrend

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/reports" className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Comerciais</h1>
          <p className="mt-1 text-sm text-gray-500">Ocupação, receita por departamento e origem das reservas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Taxa de Ocupação — Anual */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Taxa de Ocupação — Mensal (%)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={occupancyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Legend />
                  <Area type="monotone" dataKey="ocupacao" name="Taxa de Ocupação"
                    stroke="#0A5C8A" fill="#0A5C8A" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Receita por Departamento */}
        <Card>
          <CardHeader><CardTitle>Receita por Departamento (AOA)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleRevenueByDept} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => formatKwanza(v)} tick={{ fontSize: 10 }} />
                  <YAxis dataKey="dept" type="category" width={90} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatKwanza(v)} />
                  <Bar dataKey="receita" name="Receita" radius={[0, 4, 4, 0]}>
                    {sampleRevenueByDept.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Origem das Reservas */}
        <Card>
          <CardHeader><CardTitle>Origem das Reservas</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sampleReservationSource} cx="50%" cy="50%" outerRadius={100}
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    dataKey="value">
                    {sampleReservationSource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Clientes / Empresas */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Top Clientes & Empresas — Por Receita</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="pb-3 font-medium">Cliente / Empresa</th>
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium text-center">Reservas</th>
                    <th className="pb-3 font-medium text-right">Gasto Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleTopGuests.map((g, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{g.name}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                          {g.tipo}
                        </span>
                      </td>
                      <td className="py-3 text-center text-gray-600">{g.reservas}</td>
                      <td className="py-3 text-right font-semibold text-gray-900">{formatKwanza(g.gasto)}</td>
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

function buildOccupancyTrend(reservations: any[]) {
  const monthMap: Record<number, { confirmed: number }> = {}
  reservations.forEach((r: any) => {
    if (!r.checkIn) return
    const m = new Date(r.checkIn).getMonth()
    if (!monthMap[m]) monthMap[m] = { confirmed: 0 }
    monthMap[m].confirmed += 1
  })
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return months.map((month, i) => ({
    month,
    ocupacao: monthMap[i] ? Math.min(100, Math.round((monthMap[i].confirmed / 3.1) * 10)) : 0,
  }))
}

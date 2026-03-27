'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { BedDouble, TrendingUp, LogIn, LogOut, Wrench, AlertTriangle, ConciergeBell, Star } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const COLORS = ['#1A3E6E', '#1A5E6E', '#3B82F6', '#F59E0B', '#EF4444', '#10B981']

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard-central'],
    queryFn: () => api.get('/dashboard/central').then((r) => r.data.data),
  })

  const { data: today } = useQuery({
    queryKey: ['reservations-today'],
    queryFn: () => api.get('/reservations/today').then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">A carregar painel...</p>
      </div>
    )
  }

  const resorts = dashboard?.resorts ?? []
  const totalRevenue = dashboard?.totalRevenueMtd ?? 0
  const totalOccupancy = dashboard?.totalOccupancy ?? 0
  const totalCheckIns = dashboard?.combinedCheckInsToday ?? 0
  const checkInsToday = today?.checkIns?.length ?? 0
  const checkOutsToday = today?.checkOuts?.length ?? 0

  // Dados para gráfico de ocupação por resort
  const occupancyData = resorts.map((r: any) => ({
    name: r.resortName,
    ocupação: Math.round(r.occupancy ?? 0),
    quartos: r.totalRooms ?? 0,
    ocupados: r.occupiedRooms ?? 0,
  }))

  // Dados para gráfico pie de distribuição de quartos
  const roomDistData = resorts.map((r: any) => ({
    name: r.resortName,
    value: r.totalRooms ?? 0,
  }))

  // KPI adicional
  const firstResort = resorts[0]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel de Controlo</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Taxa de Ocupação"
          value={`${Math.round(totalOccupancy)}%`}
          icon={<BedDouble className="h-8 w-8" />}
        />
        <StatCard
          title="Receita (mês)"
          value={formatKwanza(totalRevenue)}
          icon={<TrendingUp className="h-8 w-8" />}
        />
        <StatCard
          title="Check-ins Hoje"
          value={checkInsToday}
          icon={<LogIn className="h-8 w-8" />}
        />
        <StatCard
          title="Check-outs Hoje"
          value={checkOutsToday}
          icon={<LogOut className="h-8 w-8" />}
        />
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Manutenção Pendente"
          value={firstResort?.pendingMaintenance ?? 0}
          icon={<Wrench className="h-8 w-8" />}
        />
        <StatCard
          title="Stock Baixo"
          value={firstResort?.lowStockAlerts ?? 0}
          icon={<AlertTriangle className="h-8 w-8" />}
        />
        <StatCard
          title="Pedidos Pendentes"
          value={firstResort?.pendingServiceOrders ?? 0}
          icon={<ConciergeBell className="h-8 w-8" />}
        />
        <StatCard
          title="Avaliação Média"
          value={firstResort?.averageRating ? `${Number(firstResort.averageRating).toFixed(1)}/5` : '—'}
          icon={<Star className="h-8 w-8" />}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ocupação por resort */}
        <Card>
          <CardTitle>Ocupação por Resort</CardTitle>
          <CardContent>
            {occupancyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={occupancyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number, name: string) => [name === 'ocupação' ? `${value}%` : value, name === 'ocupação' ? 'Ocupação' : name === 'ocupados' ? 'Ocupados' : 'Total']} />
                  <Bar dataKey="ocupação" fill="#1A3E6E" radius={[4, 4, 0, 0]} name="Ocupação %" />
                  <Bar dataKey="ocupados" fill="#1A5E6E" radius={[4, 4, 0, 0]} name="Quartos Ocupados" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Sem dados de resorts</p>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de quartos */}
        <Card>
          <CardTitle>Distribuição de Quartos</CardTitle>
          <CardContent>
            {roomDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={roomDistData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {roomDistData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-ins / Check-outs hoje */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Check-ins Esperados Hoje</CardTitle>
          <CardContent>
            {today?.checkIns?.length ? (
              <ul className="space-y-2">
                {today.checkIns.map((r: any) => (
                  <li key={r.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{r.guestName}</p>
                      <p className="text-sm text-gray-500">Quarto {r.room?.number}</p>
                    </div>
                    <span className="text-sm text-gray-400">{r.room?.type}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum check-in hoje</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Check-outs Esperados Hoje</CardTitle>
          <CardContent>
            {today?.checkOuts?.length ? (
              <ul className="space-y-2">
                {today.checkOuts.map((r: any) => (
                  <li key={r.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{r.guestName}</p>
                      <p className="text-sm text-gray-500">Quarto {r.room?.number}</p>
                    </div>
                    <span className="text-sm text-gray-400">{r.room?.type}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum check-out hoje</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

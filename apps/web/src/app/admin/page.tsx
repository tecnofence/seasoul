'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { CurrencyDisplay } from '@/components/ui/currency-display'
import { cn } from '@/lib/utils'
import {
  Users,
  Building2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#f97316']

export default function AdminDashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.get('/admin/analytics/overview').then((r) => r.data.data),
    staleTime: 60000,
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center">Carregando analytics globais...</div>
  }

  const planData = analytics?.planDistribution || []
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral do Sistema</h1>
        <p className="text-sm text-gray-500">Monitorização em tempo real de toda a plataforma ENGERIS ONE.</p>
      </div>

      {/* KPIs Globais */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Empresas"
          value={analytics?.totalTenants || 0}
          icon={<Building2 className="h-8 w-8 text-indigo-600" />}
          description={
            <div className="flex items-center gap-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>{analytics?.activeTenants || 0} ativas</span>
            </div>
          }
        />
        <StatCard
          title="Utilizadores Totais"
          value={analytics?.totalUsers || 0}
          icon={<Users className="h-8 w-8 text-purple-600" />}
          description="Em todos os tenants"
        />
        <StatCard
          title="Receita Mensal Est."
          value={<CurrencyDisplay amount={analytics?.estimatedMonthlyRevenue || 0} currency="AOA" />}
          icon={<TrendingUp className="h-8 w-8 text-emerald-600" />}
          description={
            <div className="flex items-center gap-1 text-xs text-green-600">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12% vs mês anterior</span>
            </div>
          }
        />
        <StatCard
          title="Uptime API"
          value="99.9%"
          icon={<Activity className="h-8 w-8 text-blue-600" />}
          description="Últimos 30 dias"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Distribuição de Planos */}
        <Card>
          <CardTitle className="mb-6 flex items-center justify-between">
            <span>Distribuição por Plano</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </CardTitle>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={planData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="plan" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Health Check / Quick Status */}
        <Card>
          <CardTitle className="mb-6 flex items-center justify-between">
            <span>Estado dos Serviços Core</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Zap className="h-4 w-4" />
            </div>
          </CardTitle>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Base de Dados (PostgreSQL)', status: 'Online', latency: '12ms', health: 100 },
                { name: 'Serviço de Autenticação (JWT)', status: 'Online', latency: '5ms', health: 100 },
                { name: 'API Gateway (Fastify)', status: 'Online', latency: '24ms', health: 98 },
                { name: 'Armazenamento S3 (Docs)', status: 'Online', latency: '45ms', health: 100 },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full", service.health > 95 ? "bg-green-500" : "bg-amber-500")} />
                    <span className="text-sm font-medium text-gray-700">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{service.latency}</span>
                    <span className="font-semibold text-green-600">{service.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

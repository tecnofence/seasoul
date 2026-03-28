'use client'

import { Building2, BedDouble, CalendarCheck, TrendingUp, Wifi, WifiOff } from 'lucide-react'

const kpis = [
  {
    title: 'Total de Tenants',
    value: '3',
    icon: Building2,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
    description: '3 activos',
    descriptionColor: 'text-green-600',
  },
  {
    title: 'Quartos Geridos',
    value: '451',
    icon: BedDouble,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    description: 'Em 3 propriedades',
    descriptionColor: 'text-gray-500',
  },
  {
    title: 'Reservas este mês',
    value: '1.247',
    icon: CalendarCheck,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    description: '+18% vs mês anterior',
    descriptionColor: 'text-green-600',
  },
  {
    title: 'Receita Plataforma',
    value: '15.897 USD',
    icon: TrendingUp,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    description: 'Este mês',
    descriptionColor: 'text-gray-500',
  },
]

const moduleUsage = [
  { name: 'PMS — Gestão de Propriedade', usage: 100, color: 'bg-indigo-500' },
  { name: 'Faturação AGT', usage: 97, color: 'bg-purple-500' },
  { name: 'Recursos Humanos', usage: 89, color: 'bg-emerald-500' },
  { name: 'Spa & Bem-estar', usage: 76, color: 'bg-pink-500' },
  { name: 'Gestão de Stock', usage: 71, color: 'bg-amber-500' },
]

const tenants = [
  {
    name: 'Sea and Soul Resorts',
    location: 'Cabo Ledo, Angola',
    plan: 'Profissional',
    rooms: 312,
    status: 'Online' as const,
  },
  {
    name: 'Palmeira Hotel',
    location: 'Luanda, Angola',
    plan: 'Essencial',
    rooms: 89,
    status: 'Online' as const,
  },
  {
    name: 'Demo Resort',
    location: 'Ambiente de Teste',
    plan: 'Essencial',
    rooms: 50,
    status: 'Offline' as const,
  },
]

const recentActivity = [
  { id: 1, event: 'Novo check-in — Sea and Soul', time: 'há 5 min' },
  { id: 2, event: 'Fatura emitida #2026/0142 — Palmeira Hotel', time: 'há 12 min' },
  { id: 3, event: 'Novo utilizador registado — Sea and Soul', time: 'há 34 min' },
  { id: 4, event: 'Backup concluído com sucesso — Sistema', time: 'há 1 h' },
  { id: 5, event: 'Módulo Spa activado — Sea and Soul', time: 'há 3 h' },
]

function StatusBadge({ status }: { status: 'Online' | 'Offline' }) {
  if (status === 'Online') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        <Wifi className="h-3 w-3" />
        Online
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
      <WifiOff className="h-3 w-3" />
      Offline
    </span>
  )
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Global</h1>
        <p className="text-sm text-gray-500">Visão consolidada de toda a actividade da plataforma ENGERIS ONE.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${kpi.iconBg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold text-gray-900">{kpi.value}</p>
            <p className={`mt-1 text-xs font-medium ${kpi.descriptionColor}`}>{kpi.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Module Usage */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-gray-900">Módulos Mais Usados</h2>
          <div className="space-y-5">
            {moduleUsage.map((mod) => (
              <div key={mod.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{mod.name}</span>
                  <span className="font-semibold text-gray-900">{mod.usage}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${mod.color}`}
                    style={{ width: `${mod.usage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-gray-900">Actividade Recente</h2>
          <ul className="space-y-4">
            {recentActivity.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
                <div className="min-w-0">
                  <p className="text-sm text-gray-700">{item.event}</p>
                  <p className="text-xs text-gray-400">{item.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Tenants Activos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Empresa</th>
                <th className="px-6 py-3 text-left">Localização</th>
                <th className="px-6 py-3 text-left">Plano</th>
                <th className="px-6 py-3 text-left">Quartos</th>
                <th className="px-6 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenants.map((tenant) => (
                <tr key={tenant.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{tenant.name}</td>
                  <td className="px-6 py-4 text-gray-500">{tenant.location}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{tenant.rooms}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tenant.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

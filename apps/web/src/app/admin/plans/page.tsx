'use client'

import { CreditCard, Check, Pencil, Building2 } from 'lucide-react'

const plans = [
  {
    id: 'essencial',
    name: 'Essencial',
    price: 299,
    rooms: 'Até 50 quartos',
    subscribers: 1,
    color: 'border-slate-200',
    badgeColor: 'bg-slate-100 text-slate-700',
    features: [
      'Gestão de Propriedade (PMS)',
      'Faturação AGT básica',
      'Gestão de Stock',
      'Controlo de Acesso (Fechaduras)',
      'Relatórios padrão',
      'Suporte por email (horário comercial)',
    ],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    price: 599,
    rooms: 'Até 150 quartos',
    subscribers: 1,
    color: 'border-indigo-400',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    features: [
      'Todos os módulos Essencial',
      'POS completo (Restaurante/Bar/Spa)',
      'Gestão de RH e Ponto',
      'App móvel para hóspedes',
      'Integrações de canal (OTA)',
      'Suporte prioritário (chat)',
    ],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 1199,
    rooms: 'Quartos ilimitados',
    subscribers: 0,
    color: 'border-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700',
    features: [
      'Todos os módulos Profissional',
      'BI Avançado e Dashboards personalizados',
      'Multi-propriedade centralizada',
      'API para integrações customizadas',
      'SLA garantido 24h/7 dias',
      'Gestor de conta dedicado',
    ],
  },
]

const tenantSubscriptions = [
  { tenant: 'Sea and Soul Resorts', plan: 'Profissional', since: 'Jan 2025', status: 'Ativo' },
  { tenant: 'Palmeira Hotel', plan: 'Essencial', since: 'Mar 2025', status: 'Ativo' },
]

export default function PlansPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos de Subscrição</h1>
          <p className="text-sm text-gray-500">Gira os planos disponíveis na plataforma ENGERIS ONE.</p>
        </div>
        <button
          onClick={() => alert('Funcionalidade disponível em breve')}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <CreditCard className="h-4 w-4" />
          Novo Plano
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-xl border-2 bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${plan.color}`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow">
                  Mais Popular
                </span>
              </div>
            )}

            <div className="mb-4 flex items-start justify-between">
              <div>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${plan.badgeColor}`}>
                  {plan.name}
                </span>
                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {plan.price} <span className="text-base font-medium text-gray-500">USD/mês</span>
                </p>
                <p className="mt-1 text-sm text-gray-500">{plan.rooms}</p>
              </div>
            </div>

            <ul className="mb-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span>
                  <strong className="font-semibold text-gray-700">{plan.subscribers}</strong> subscritor
                  {plan.subscribers !== 1 ? 'es' : ''}
                </span>
              </div>
              <button
                onClick={() => alert(`A editar plano: ${plan.name}`)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Subscriptions Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Subscrições Actuais</h2>
          <p className="text-sm text-gray-500">Tenants com subscrições activas na plataforma.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Empresa / Tenant</th>
                <th className="px-6 py-3 text-left">Plano</th>
                <th className="px-6 py-3 text-left">Desde</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tenantSubscriptions.map((sub) => (
                <tr key={sub.tenant} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{sub.tenant}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                      {sub.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{sub.since}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => alert(`A gerir subscrição: ${sub.tenant}`)}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Gerir
                    </button>
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

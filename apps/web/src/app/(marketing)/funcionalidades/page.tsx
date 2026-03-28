import Link from 'next/link'
import {
  BedDouble,
  ShoppingCart,
  Package,
  Users,
  Shield,
  Wrench,
  HeartPulse,
  Sparkles,
  Calculator,
  BarChart3,
  Globe,
  Building2,
  type LucideIcon,
} from 'lucide-react'

export const metadata = {
  title: 'Funcionalidades — ENGERIS ONE',
  description: 'Todos os módulos da plataforma ENGERIS ONE para gestão hoteleira em África.',
}

interface Category {
  icon: LucideIcon
  name: string
  color: string
  headerColor: string
  iconBg: string
  iconColor: string
  modules: string[]
}

const categories: Category[] = [
  {
    icon: BedDouble,
    name: 'Alojamento & Reservas',
    color: 'bg-blue-50 border-blue-100',
    headerColor: 'text-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    modules: [
      'PMS (Property Management)',
      'Reservas & Check-in/out',
      'Quartos & Housekeeping',
      'Tarifas & Disponibilidade',
      'Canal Manager',
      'Hóspedes & Perfis',
    ],
  },
  {
    icon: ShoppingCart,
    name: 'Ponto de Venda',
    color: 'bg-emerald-50 border-emerald-100',
    headerColor: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    modules: [
      'POS Restaurante',
      'POS Bar',
      'POS Loja / Spa',
      'Emissão de Faturas AGT',
      'Gestão de Mesas',
    ],
  },
  {
    icon: Package,
    name: 'Stock & Inventário',
    color: 'bg-orange-50 border-orange-100',
    headerColor: 'text-orange-700',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    modules: [
      'Controlo de Stock',
      'Movimentos de Inventário',
      'Fornecedores',
      'Compras & Encomendas',
    ],
  },
  {
    icon: Users,
    name: 'Recursos Humanos',
    color: 'bg-violet-50 border-violet-100',
    headerColor: 'text-violet-700',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    modules: [
      'Colaboradores',
      'Presenças & GPS',
      'Processamento Salarial',
      'Turnos & Escalas',
      'Documentos RH',
    ],
  },
  {
    icon: Shield,
    name: 'Segurança',
    color: 'bg-red-50 border-red-100',
    headerColor: 'text-red-700',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    modules: [
      'Rondas & Patrulhas',
      'Ocorrências',
      'Fechaduras Inteligentes (TTLock)',
      'Controlo de Acessos',
    ],
  },
  {
    icon: Wrench,
    name: 'Operações',
    color: 'bg-slate-50 border-slate-200',
    headerColor: 'text-slate-700',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    modules: [
      'Manutenção',
      'Inspeções',
      'Certificações',
      'Ordens de Serviço',
    ],
  },
  {
    icon: HeartPulse,
    name: 'Saúde In-House',
    color: 'bg-teal-50 border-teal-100',
    headerColor: 'text-teal-700',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    modules: [
      'Enfermaria do Resort',
      'Registo de Ocorrências Médicas',
      'Protocolos de Emergência',
    ],
  },
  {
    icon: Sparkles,
    name: 'Spa & Lazer',
    color: 'bg-pink-50 border-pink-100',
    headerColor: 'text-pink-700',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    modules: [
      'Serviços Spa',
      'Agendamentos Spa',
      'Atividades',
      'Eventos',
    ],
  },
  {
    icon: Calculator,
    name: 'Financeiro & Contabilidade',
    color: 'bg-yellow-50 border-yellow-100',
    headerColor: 'text-yellow-700',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    modules: [
      'Contabilidade Geral',
      'Contas a Receber / Pagar',
      'Relatórios Financeiros',
      'IVA Angola (14%)',
    ],
  },
  {
    icon: BarChart3,
    name: 'Analytics & BI',
    color: 'bg-indigo-50 border-indigo-100',
    headerColor: 'text-indigo-700',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    modules: [
      'Dashboard Executivo',
      'Relatórios Operacionais',
      'KPIs em Tempo Real',
      'Exportação Excel / PDF',
    ],
  },
  {
    icon: Globe,
    name: 'Site Público & Reservas Online',
    color: 'bg-cyan-50 border-cyan-100',
    headerColor: 'text-cyan-700',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    modules: [
      'Website do Hotel',
      'Motor de Reservas',
      'Galeria',
      'Avaliações',
    ],
  },
  {
    icon: Building2,
    name: 'Multi-propriedade',
    color: 'bg-lime-50 border-lime-100',
    headerColor: 'text-lime-700',
    iconBg: 'bg-lime-100',
    iconColor: 'text-lime-600',
    modules: [
      'Gestão Multi-resort',
      'Comparação Entre Propriedades',
      'Relatórios Consolidados',
    ],
  },
]

export default function FuncionalidadesPage() {
  const totalModules = categories.reduce((sum, c) => sum + c.modules.length, 0)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav strip */}
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-[#1A3E6E] hover:opacity-80"
          >
            ← ENGERIS ONE
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/precos" className="text-gray-600 hover:text-gray-900">
              Preços
            </Link>
            <Link
              href="/demo"
              className="rounded-lg bg-[#1A3E6E] px-4 py-2 font-medium text-white transition-colors hover:bg-[#15315a]"
            >
              Pedir Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#1A3E6E] to-[#15315a] px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-300">
            Plataforma Completa
          </p>
          <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            {totalModules} módulos para gerir
            <br />
            <span className="text-blue-300">cada aspeto do seu resort</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-blue-100">
            Do check-in ao fecho de caixa, do registo de ponto ao plano de manutenção
            — o ENGERIS ONE cobre toda a operação hoteleira numa única plataforma
            integrada.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200">
            <span>✓ {categories.length} categorias</span>
            <span>✓ {totalModules} módulos</span>
            <span>✓ Integração total</span>
            <span>✓ Made for África</span>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-6">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 text-center md:grid-cols-4">
          {[
            { value: String(totalModules), label: 'Módulos' },
            { value: String(categories.length), label: 'Categorias' },
            { value: '14%', label: 'IVA Angola integrado' },
            { value: '1', label: 'Plataforma unificada' },
          ].map((stat) => (
            <div key={stat.label} className="py-2">
              <p className="text-3xl font-bold text-[#1A3E6E]">{stat.value}</p>
              <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modules grid */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Todos os módulos
            </h2>
            <p className="mt-4 text-gray-500">
              Cada módulo foi desenvolvido com base nas necessidades reais dos hotéis
              angolanos.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <div
                  key={category.name}
                  className={`rounded-2xl border p-6 transition-shadow hover:shadow-md ${category.color}`}
                >
                  {/* Card header */}
                  <div className="mb-4 flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${category.iconBg}`}>
                      <Icon className={`h-5 w-5 ${category.iconColor}`} />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${category.headerColor}`}>
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {category.modules.length} módulo
                        {category.modules.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Module list */}
                  <ul className="space-y-2">
                    {category.modules.map((mod) => (
                      <li
                        key={mod}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <span className="mt-0.5 shrink-0 text-green-500">✓</span>
                        {mod}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Integration callout */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl bg-[#1A3E6E] px-8 py-16 text-center text-white">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Todos os módulos falam entre si
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-blue-200">
              Quando um hóspede faz check-in, o PMS atualiza a disponibilidade, as
              fechaduras são programadas automaticamente e o histórico de consumo no
              restaurante fica associado ao perfil. Uma plataforma. Zero duplicação.
            </p>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              {[
                {
                  title: 'Integração nativa',
                  desc: 'Todos os módulos partilham a mesma base de dados em tempo real.',
                },
                {
                  title: 'Feito para Angola',
                  desc: 'IVA 14%, faturação AGT, NIF e KZ integrados de raiz.',
                },
                {
                  title: 'App Mobile',
                  desc: 'Colaboradores acedem no smartphone a partir de qualquer lugar do resort.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white/10 p-5 text-left"
                >
                  <h4 className="mb-1 font-semibold">{item.title}</h4>
                  <p className="text-sm leading-relaxed text-blue-200">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">
            Pronto para ver tudo isto em ação?
          </h2>
          <p className="mb-8 text-lg text-gray-500">
            Agende uma demonstração gratuita e percorra todos os módulos com um
            especialista da ENGERIS.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1A3E6E] px-8 py-4 font-semibold text-white transition-colors hover:bg-[#15315a]"
            >
              Pedir Demonstração Gratuita →
            </Link>
            <Link
              href="/precos"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-8 py-4 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Ver Preços
            </Link>
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <div className="bg-gray-900 px-6 py-8 text-center text-xs text-gray-500">
        © 2026 ENGERIS · Todos os direitos reservados · Luanda, Angola
      </div>
    </div>
  )
}

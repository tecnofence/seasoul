'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

type FeatureValue = boolean | string

interface PlanFeature {
  name: string
  starter: FeatureValue
  resort: FeatureValue
  enterprise: FeatureValue
}

interface FeatureCategory {
  category: string
  items: PlanFeature[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

// Preços em Kwanzas (AOA) — câmbio 1 USD = 125 Kz
const plans = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 18_625,
    annual: 14_875,
    desc: 'Pensões e pequenos hotéis',
    highlight: false,
    badge: null,
    cta: 'Começar grátis',
    details: [
      'Até 20 quartos',
      '1 propriedade',
      'PMS + POS + Stock',
      'RH básico',
      'Suporte por email',
      '3 utilizadores',
    ],
  },
  {
    id: 'resort',
    name: 'Resort',
    monthly: 49_875,
    annual: 39_875,
    desc: 'Hotéis e resorts',
    highlight: true,
    badge: 'Mais Popular',
    cta: 'Começar grátis',
    details: [
      'Quartos ilimitados',
      '1 propriedade',
      'TODOS os módulos',
      'Spa + Atividades + Segurança',
      'Suporte prioritário',
      '15 utilizadores',
      'Site público + Motor de reservas',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 124_875,
    annual: 99_875,
    desc: 'Grupos hoteleiros',
    highlight: false,
    badge: null,
    cta: 'Falar com vendas',
    details: [
      'Multi-propriedade',
      'Tudo do Resort',
      'API access',
      'Integrações personalizadas',
      'Gestor de conta dedicado',
      'Utilizadores ilimitados',
      'SLA 99.9%',
    ],
  },
]

const featureTable: FeatureCategory[] = [
  {
    category: 'Hotelaria (PMS)',
    items: [
      { name: 'Gestão de quartos', starter: true, resort: true, enterprise: true },
      { name: 'Reservas & check-in/out', starter: true, resort: true, enterprise: true },
      { name: 'Número máximo de quartos', starter: 'Até 20', resort: 'Ilimitado', enterprise: 'Ilimitado' },
      { name: 'Gestão de hóspedes (CRM)', starter: true, resort: true, enterprise: true },
      { name: 'Canal Manager / OTAs', starter: false, resort: true, enterprise: true },
      { name: 'Multi-propriedade', starter: false, resort: false, enterprise: true },
    ],
  },
  {
    category: 'Ponto de Venda (POS)',
    items: [
      { name: 'POS Restaurante & Bar', starter: true, resort: true, enterprise: true },
      { name: 'POS Loja / Retail', starter: false, resort: true, enterprise: true },
      { name: 'Faturação eletrónica AGT', starter: true, resort: true, enterprise: true },
      { name: 'Integração automática com stock', starter: true, resort: true, enterprise: true },
    ],
  },
  {
    category: 'Stock & Compras',
    items: [
      { name: 'Controlo de inventário', starter: true, resort: true, enterprise: true },
      { name: 'Alertas de stock mínimo', starter: true, resort: true, enterprise: true },
      { name: 'Gestão de fornecedores', starter: false, resort: true, enterprise: true },
      { name: 'Ordens de compra', starter: false, resort: true, enterprise: true },
    ],
  },
  {
    category: 'Recursos Humanos',
    items: [
      { name: 'Gestão de colaboradores', starter: 'Até 10', resort: 'Até 50', enterprise: 'Ilimitado' },
      { name: 'Assiduidade com GPS', starter: false, resort: true, enterprise: true },
      { name: 'Processamento salarial', starter: false, resort: true, enterprise: true },
      { name: 'Turnos & escalas', starter: false, resort: true, enterprise: true },
    ],
  },
  {
    category: 'Operações & Segurança',
    items: [
      { name: 'Manutenção & inspeções', starter: false, resort: true, enterprise: true },
      { name: 'Smart Locks (TTLock)', starter: false, resort: true, enterprise: true },
      { name: 'Rondas & patrulhas', starter: false, resort: true, enterprise: true },
      { name: 'Clínica / Enfermaria', starter: false, resort: true, enterprise: true },
    ],
  },
  {
    category: 'Spa & Lazer',
    items: [
      { name: 'Serviços spa & agendamentos', starter: false, resort: true, enterprise: true },
      { name: 'Atividades & eventos', starter: false, resort: true, enterprise: true },
    ],
  },
  {
    category: 'Financeiro & Analytics',
    items: [
      { name: 'IVA automático 14% (Angola)', starter: true, resort: true, enterprise: true },
      { name: 'Contabilidade & balancetes', starter: false, resort: true, enterprise: true },
      { name: 'Relatórios financeiros avançados', starter: false, resort: true, enterprise: true },
      { name: 'Dashboard executivo & KPIs', starter: false, resort: true, enterprise: true },
      { name: 'Exportação Excel / PDF', starter: true, resort: true, enterprise: true },
      { name: 'Multi-moeda', starter: false, resort: false, enterprise: true },
    ],
  },
  {
    category: 'Site & Reservas Online',
    items: [
      { name: 'Website público do hotel', starter: false, resort: true, enterprise: true },
      { name: 'Motor de reservas online', starter: false, resort: true, enterprise: true },
    ],
  },
  {
    category: 'Plataforma',
    items: [
      { name: 'Utilizadores incluídos', starter: '3', resort: '15', enterprise: 'Ilimitado' },
      { name: '2FA para administradores', starter: true, resort: true, enterprise: true },
      { name: 'App Mobile (iOS & Android)', starter: true, resort: true, enterprise: true },
      { name: 'Backups automáticos diários', starter: true, resort: true, enterprise: true },
      { name: 'API REST & Webhooks', starter: false, resort: false, enterprise: true },
      { name: 'Integrações personalizadas', starter: false, resort: false, enterprise: true },
    ],
  },
  {
    category: 'Suporte',
    items: [
      { name: 'Suporte por email', starter: true, resort: true, enterprise: true },
      { name: 'Suporte prioritário 24h', starter: false, resort: true, enterprise: true },
      { name: 'Onboarding dedicado', starter: false, resort: false, enterprise: true },
      { name: 'Gestor de conta dedicado', starter: false, resort: false, enterprise: true },
      { name: 'SLA garantido (99.9%)', starter: false, resort: false, enterprise: true },
    ],
  },
]

const faqs = [
  {
    q: 'Os meus dados estão seguros? Onde ficam alojados?',
    a: 'Todos os dados são alojados em servidores na região de África (Hetzner, com replicação) e encriptados em repouso (AES-256) e em trânsito (TLS 1.3). Cumprimos a legislação angolana de proteção de dados. Backups automáticos diários com retenção de 30 dias.',
  },
  {
    q: 'A plataforma funciona sem acesso à internet em Angola?',
    a: 'O módulo POS tem modo offline parcial — pode continuar a registar vendas e emitir faturas mesmo sem ligação à internet. Os dados sincronizam automaticamente quando a ligação for restabelecida. Os restantes módulos requerem conectividade para funcionamento pleno.',
  },
  {
    q: 'O ENGERIS ONE está homologado para faturação AGT?',
    a: 'Sim. O módulo de faturação eletrónica cumpre os requisitos da AGT (Administração Geral Tributária) de Angola, incluindo assinatura digital RSA dos documentos fiscais, comunicação em tempo real e IVA a 14%. Emite faturas simplificadas, recibos e notas de crédito válidos.',
  },
  {
    q: 'Existe contrato de fidelidade ou posso cancelar quando quiser?',
    a: 'Não existe contrato de fidelidade. Pode cancelar a sua subscrição a qualquer momento diretamente no painel de administração, sem penalidades. O acesso mantém-se até ao final do período pago. Para o plano anual, não há reembolso do remanescente, mas pode utilizar o serviço até ao fim do período.',
  },
  {
    q: 'Que tipo de suporte técnico está disponível e em que língua?',
    a: 'Todo o suporte é prestado em Português (PT-AO) por uma equipa baseada em Luanda. O plano Starter inclui suporte por email (resposta em 24h). O plano Resort inclui suporte prioritário disponível até às 22h, 7 dias por semana. O plano Enterprise inclui suporte 24h/7 com SLA garantido e gestor de conta dedicado.',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg className="mx-auto h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg className="mx-auto h-5 w-5 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  )
}

function FeatureCell({ value }: { value: FeatureValue }) {
  if (value === true) return <CheckIcon />
  if (value === false) return <CrossIcon />
  return <span className="text-sm font-medium text-gray-700">{value}</span>
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PrecosClient() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      {/* Nav strip */}
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-[#1A3E6E] hover:opacity-80">
            ← ENGERIS ONE
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/funcionalidades" className="text-gray-600 hover:text-gray-900">
              Funcionalidades
            </Link>
            <Link
              href="/demo"
              className="rounded-lg bg-[#1A3E6E] px-4 py-2 font-medium text-white hover:bg-[#15315a] transition-colors"
            >
              Pedir Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#1A3E6E] to-[#15315a] px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-300">
            Preços
          </p>
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Simples e <span className="text-blue-300">transparentes</span>
          </h1>
          <p className="mb-8 text-lg text-blue-100">
            Sem taxas ocultas. Sem contratos de fidelidade. Cancele quando quiser.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 rounded-full bg-white/10 p-1 text-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-5 py-2 font-medium transition-colors ${
                !annual ? 'bg-white text-[#1A3E6E]' : 'text-blue-200 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-5 py-2 font-medium transition-colors ${
                annual ? 'bg-white text-[#1A3E6E]' : 'text-blue-200 hover:text-white'
              }`}
            >
              Anual
              <span className="ml-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-900">
                −20%
              </span>
            </button>
          </div>
          {annual && (
            <p className="mt-3 text-sm text-blue-300">
              Poupa até 300.000 Kz/ano com faturação anual.
            </p>
          )}
        </div>
      </section>

      {/* Plan cards */}
      <section className="bg-[#0f2647] px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const price = annual ? plan.annual : plan.monthly
              return (
                <div
                  key={plan.id}
                  className={`relative -mt-8 rounded-2xl p-8 ${
                    plan.highlight
                      ? 'bg-[#1A3E6E] ring-2 ring-blue-400 shadow-2xl shadow-blue-900/50'
                      : 'bg-slate-800 ring-1 ring-white/10'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <h3 className="mb-1 text-xl font-bold text-white">{plan.name}</h3>
                  <p className={`mb-5 text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>
                    {plan.desc}
                  </p>

                  <div className="mb-2">
                    <span className="text-4xl font-bold text-white">{price.toLocaleString('pt-AO')}</span>
                    <span className={`ml-1 text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-400'}`}>
                      {' '}Kz/mês
                    </span>
                  </div>
                  {annual && (
                    <p className={`mb-5 text-xs ${plan.highlight ? 'text-blue-300' : 'text-gray-500'}`}>
                      Faturado anualmente ({(price * 12).toLocaleString('pt-AO')} Kz/ano)
                    </p>
                  )}
                  {!annual && <div className="mb-5" />}

                  <ul className="mb-8 space-y-2">
                    {plan.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-sm text-gray-200">
                        <span className="mt-0.5 shrink-0 text-emerald-400">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/demo"
                    className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                      plan.highlight
                        ? 'bg-white text-[#1A3E6E] hover:bg-blue-50'
                        : 'border border-white/20 text-white hover:bg-white/10'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            Todos os planos incluem 14 dias de teste gratuito. Sem cartão de crédito.
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            Comparação detalhada
          </h2>
          <p className="mb-16 text-center text-gray-500">
            Veja exatamente o que está incluído em cada plano.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="py-5 pl-6 pr-4 text-left text-sm font-semibold text-gray-900">
                    Funcionalidade
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.id}
                      className={`px-6 py-5 text-center text-sm font-semibold ${
                        plan.highlight ? 'text-[#1A3E6E]' : 'text-gray-700'
                      }`}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {featureTable.map((section) => (
                  <>
                    <tr key={`cat-${section.category}`} className="bg-gray-50">
                      <td
                        colSpan={4}
                        className="py-3 pl-6 text-xs font-semibold uppercase tracking-wider text-gray-400"
                      >
                        {section.category}
                      </td>
                    </tr>
                    {section.items.map((item, idx) => (
                      <tr
                        key={item.name}
                        className={`border-b border-gray-50 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                        }`}
                      >
                        <td className="py-3.5 pl-6 pr-4 text-sm text-gray-700">{item.name}</td>
                        <td className="px-6 py-3.5 text-center">
                          <FeatureCell value={item.starter} />
                        </td>
                        <td className="bg-blue-50/30 px-6 py-3.5 text-center">
                          <FeatureCell value={item.resort} />
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <FeatureCell value={item.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <td className="py-5 pl-6" />
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-5 text-center">
                      <Link
                        href="/demo"
                        className={`inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                          plan.highlight
                            ? 'bg-[#1A3E6E] text-white hover:bg-[#15315a]'
                            : 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {plan.cta} →
                      </Link>
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">
            Perguntas frequentes
          </h2>
          <p className="mb-12 text-center text-gray-500">
            Não encontra a resposta que procura?{' '}
            <Link href="/demo" className="font-medium text-[#1A3E6E] underline underline-offset-2 hover:opacity-80">
              Fale connosco.
            </Link>
          </p>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <h3 className="mb-3 font-semibold text-gray-900">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#1A3E6E] px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold text-white">
            Fale connosco para uma demo gratuita
          </h2>
          <p className="mb-8 text-blue-200 text-lg">
            A nossa equipa em Luanda mostra-lhe o ENGERIS ONE em funcionamento,
            adaptado ao seu hotel.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-[#1A3E6E] hover:bg-blue-50 transition-colors"
            >
              Pedir Demonstração Gratuita →
            </Link>
            <Link
              href="/funcionalidades"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-4 font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Ver Funcionalidades
            </Link>
          </div>
        </div>
      </section>

      {/* Footer strip */}
      <div className="bg-gray-950 px-6 py-8 text-center text-xs text-gray-500">
        © 2026 ENGERIS · Todos os direitos reservados · Luanda, Angola
      </div>
    </div>
  )
}

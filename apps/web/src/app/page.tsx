import Link from 'next/link'
import {
  Building2,
  ShoppingCart,
  Package,
  Users,
  Lock,
  BarChart3,
  CheckCircle,
  ArrowRight,
  ChevronDown,
} from 'lucide-react'

export const metadata = {
  title: 'ENGERIS ONE — Plataforma ERP para Hotelaria em África',
  description:
    'Gestão completa de reservas, POS, stock, RH e muito mais. O ERP SaaS criado para hotéis e resorts africanos.',
}

const features = [
  {
    icon: Building2,
    title: 'PMS — Gestão de Reservas',
    desc: 'Check-in, check-out, quartos e hóspedes numa plataforma unificada.',
  },
  {
    icon: ShoppingCart,
    title: 'POS — Ponto de Venda',
    desc: 'Restaurante, bar e loja integrados com stock automático em tempo real.',
  },
  {
    icon: Package,
    title: 'Stock — Inventário em Tempo Real',
    desc: 'Alertas de stock baixo, movimentos, fornecedores e ordens de compra.',
  },
  {
    icon: Users,
    title: 'RH & Salários',
    desc: 'Colaboradores, assiduidade geolocalizada e processamento salarial automático.',
  },
  {
    icon: Lock,
    title: 'Smart Locks',
    desc: 'PINs automáticos via TTLock para hóspedes — acesso sem chave.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & KPIs',
    desc: 'Relatórios em tempo real e dashboards para decisões estratégicas.',
  },
]

const stats = [
  { value: '47+', label: 'Módulos' },
  { value: '2', label: 'Clientes Ativos' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24h', label: 'Suporte' },
]

const steps = [
  {
    num: '01',
    title: 'Crie a sua conta',
    desc: 'Registo em 2 minutos, sem cartão de crédito. Acesso imediato ao painel.',
  },
  {
    num: '02',
    title: 'Configure o seu hotel',
    desc: 'Importe quartos, tarifas e colaboradores com o nosso assistente de setup.',
  },
  {
    num: '03',
    title: 'Comece a operar',
    desc: 'O seu hotel online em menos de 1 hora. Suporte em português incluído.',
  },
]

const modules = [
  'Reservas', 'Quartos', 'Hóspedes', 'Tarifas', 'Check-in/out', 'Housekeeping',
  'POS Restaurante', 'POS Bar', 'POS Loja', 'Faturação AGT', 'IVA Automático',
  'Stock', 'Compras', 'Fornecedores', 'Inventário', 'Quebras',
  'RH', 'Assiduidade GPS', 'Salários', 'Férias', 'Contratos',
  'Manutenção', 'Smart Locks', 'Spa', 'Eventos', 'Atividades',
  'CRM', 'Imóveis', 'Agricultura', 'Produção', 'Saúde',
  'Educação', 'Consultoria', 'Telecom', 'Segurança', 'Frotas',
  'Relatórios', 'KPIs', 'Auditoria', 'Notificações', 'API',
  'Multi-propriedade', 'Permissões', '2FA', 'Integrações', 'Backups', 'Suporte PT',
]

const plans = [
  {
    name: 'Starter',
    price: '$149',
    desc: 'Pensões e pequenos hotéis',
    highlight: false,
    features: [
      'Até 20 quartos',
      '5 utilizadores',
      'PMS + POS básico',
      'Stock essencial',
      'Faturação AGT',
      'Suporte por email',
    ],
  },
  {
    name: 'Resort',
    price: '$399',
    desc: 'Hotéis e resorts',
    highlight: true,
    badge: 'POPULAR',
    features: [
      'Quartos ilimitados',
      '20 utilizadores',
      'Todos os módulos',
      'Smart Locks',
      'Analytics avançado',
      'Suporte prioritário 24h',
    ],
  },
  {
    name: 'Enterprise',
    price: '$999',
    desc: 'Grupos hoteleiros',
    highlight: false,
    features: [
      'Multi-propriedade',
      'Utilizadores ilimitados',
      'API & integrações',
      'Onboarding dedicado',
      'SLA garantido',
      'Account manager',
    ],
  },
]

const faqs = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem penalidades. Pode cancelar a sua subscrição a qualquer momento diretamente no painel.' },
  { q: 'Há suporte em Português?', a: 'Sim. Todo o suporte é prestado em Português (PT-AO), por equipa baseada em Luanda.' },
  { q: 'Os meus dados ficam em Angola?', a: 'Sim. Os dados são alojados em servidores na região de África para conformidade local.' },
  { q: 'Funciona sem internet?', a: 'O POS tem modo offline parcial. Os dados sincronizam automaticamente quando a ligação for restabelecida.' },
]

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ───── NAVBAR ───── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight text-white">
            ENGERIS <span className="text-teal-400">ONE</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-gray-300 md:flex">
            <Link href="/funcionalidades" className="transition-colors hover:text-white">Funcionalidades</Link>
            <Link href="/precos" className="transition-colors hover:text-white">Preços</Link>
            <Link href="#clientes" className="transition-colors hover:text-white">Clientes</Link>
            <Link href="/demo" className="transition-colors hover:text-white">Demo</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Entrar
            </Link>
            <Link
              href="/demo"
              className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-400"
            >
              Pedir Demo
            </Link>
          </div>
        </div>
      </header>

      {/* ───── HERO ───── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 pt-24 text-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/5 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-2 text-sm font-medium text-teal-400">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            Plataforma SaaS #1 para Hotelaria em África
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight text-white md:text-7xl">
            O ERP que o seu<br />
            <span className="text-teal-400">Hotel merece</span>
          </h1>

          <p className="mb-10 text-xl leading-relaxed text-gray-400 md:text-2xl">
            Gestão completa de reservas, POS, stock, RH e muito mais.<br className="hidden md:block" />
            Criado para hotéis e resorts africanos.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/demo"
              className="flex items-center gap-2 rounded-xl bg-teal-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-400 hover:shadow-teal-400/30"
            >
              Começar Gratuitamente
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/demo"
              className="flex items-center gap-2 rounded-xl border border-white/20 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
            >
              Ver Demonstração
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
            <span className="text-sm text-gray-500">Utilizado por:</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300">
              Sea and Soul Resorts
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300">
              Palmeira Beach Hotel
            </span>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-500">
          <ChevronDown className="h-6 w-6" />
        </div>
      </section>

      {/* ───── STATS STRIP ───── */}
      <section className="border-b border-gray-100 bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-bold text-slate-900">{s.value}</div>
                <div className="mt-1 text-sm font-medium text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-slate-900">
              Tudo o que o seu hotel precisa
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Do check-in ao processamento salarial, o ENGERIS ONE cobre todas as operações do seu hotel numa única plataforma integrada.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-blue-100 bg-blue-50 p-8 transition-all hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50"
              >
                <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3">
                  <f.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-slate-900">
              Como funciona
            </h2>
            <p className="text-lg text-gray-600">
              Comece a operar em menos de 1 hora.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.num} className="relative text-center">
                {i < steps.length - 1 && (
                  <div className="absolute left-full top-8 hidden w-full -translate-x-1/2 border-t-2 border-dashed border-gray-200 md:block" />
                )}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-teal-400">
                  {step.num}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── MODULES GRID ───── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-slate-900">
              47+ Módulos Incluídos
            </h2>
            <p className="text-lg text-gray-600">
              Uma plataforma, todos os departamentos do seu hotel.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {modules.map((mod) => (
              <span
                key={mod}
                className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
              >
                {mod}
              </span>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/funcionalidades"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-500"
            >
              Ver todos os módulos em detalhe
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───── PRICING ───── */}
      <section className="bg-slate-900 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">
              Preços transparentes
            </h2>
            <p className="text-lg text-gray-400">
              Sem taxas ocultas. Cancele a qualquer momento.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.highlight
                    ? 'bg-teal-500 shadow-2xl shadow-teal-500/30 ring-2 ring-teal-400'
                    : 'bg-slate-800 ring-1 ring-white/10'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-slate-900">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`mb-1 text-xl font-bold ${plan.highlight ? 'text-white' : 'text-white'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.highlight ? 'text-teal-100' : 'text-gray-400'}`}>
                    {plan.desc}
                  </p>
                  <div className="mt-4">
                    <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-white'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.highlight ? 'text-teal-100' : 'text-gray-400'}`}>
                      /mês
                    </span>
                  </div>
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-3">
                      <CheckCircle
                        className={`h-4 w-4 flex-shrink-0 ${plan.highlight ? 'text-teal-100' : 'text-teal-400'}`}
                      />
                      <span className={`text-sm ${plan.highlight ? 'text-teal-50' : 'text-gray-300'}`}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/demo"
                  className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                    plan.highlight
                      ? 'bg-white text-teal-600 hover:bg-teal-50'
                      : 'border border-white/20 text-white hover:bg-white/10'
                  }`}
                >
                  Começar
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/precos"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white"
            >
              Comparar todos os planos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───── CLIENTS ───── */}
      <section id="clientes" className="bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold text-slate-900">
              Os nossos clientes
            </h2>
            <p className="text-lg text-gray-600">
              Hotéis e resorts que confiam no ENGERIS ONE para gerir as suas operações.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
                  SS
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Sea and Soul Resorts</h3>
                  <p className="text-sm text-gray-500">Cabo Ledo & Sangano, Angola</p>
                </div>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                Dois resorts de luxo em Angola com sistema completo de PMS, POS, RH e Smart Locks integrado numa única plataforma.
              </p>
              <Link
                href="/seaandsoul"
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Ver site do cliente
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-2xl border border-gray-100 p-8 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600 font-bold text-white">
                  PH
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Palmeira Beach Hotel</h3>
                  <p className="text-sm text-gray-500">Luanda, Angola</p>
                </div>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-gray-600">
                Hotel urbano 4 estrelas em Luanda com gestão de reservas, restaurante e faturação eletrónica AGT.
              </p>
              <Link
                href="/palmeira"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-500"
              >
                Ver site do cliente
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ───── TESTIMONIAL ───── */}
      <section className="bg-teal-900 py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="mb-6 text-5xl text-teal-400">"</div>
          <blockquote className="mb-8 text-xl leading-relaxed text-white md:text-2xl">
            O ENGERIS ONE transformou a gestão dos nossos resorts. Passámos de folhas de Excel para um sistema completo em menos de uma semana.
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 font-bold text-white">
              MC
            </div>
            <div className="text-left">
              <p className="font-semibold text-white">Manuel Costa</p>
              <p className="text-sm text-teal-300">Director de Operações, Sea and Soul Resorts</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="bg-slate-900 py-24 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Pronto para transformar<br />o seu hotel?
          </h2>
          <p className="mb-10 text-lg text-gray-400">
            Comece com 14 dias grátis. Sem cartão de crédito.
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-400"
          >
            Pedir Demonstração Gratuita
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="bg-slate-950 px-6 py-16 text-sm text-gray-400">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
            <div>
              <div className="mb-4 text-lg font-bold text-white">
                ENGERIS <span className="text-teal-400">ONE</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                Plataforma ERP SaaS para hotelaria. Criado em Angola, para África e o mundo.
              </p>
            </div>

            <div>
              <div className="mb-4 font-semibold text-white">Produto</div>
              <ul className="space-y-2">
                <li><Link href="/funcionalidades" className="hover:text-white">Funcionalidades</Link></li>
                <li><Link href="/precos" className="hover:text-white">Preços</Link></li>
                <li><Link href="/demo" className="hover:text-white">Demo</Link></li>
                <li><Link href="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>

            <div>
              <div className="mb-4 font-semibold text-white">Clientes</div>
              <ul className="space-y-2">
                <li><Link href="/seaandsoul" className="hover:text-white">Sea and Soul</Link></li>
                <li><Link href="/palmeira" className="hover:text-white">Palmeira Hotel</Link></li>
              </ul>
            </div>

            <div>
              <div className="mb-4 font-semibold text-white">Empresa</div>
              <ul className="space-y-2">
                <li><a href="https://engeris.co.ao" className="hover:text-white" target="_blank" rel="noopener">ENGERIS</a></li>
                <li><span className="text-gray-500">Luanda, Angola</span></li>
                <li><a href="mailto:hello@engeris.co.ao" className="hover:text-white">hello@engeris.co.ao</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-white/5 pt-8 text-center text-xs text-gray-600">
            © 2026 ENGERIS · Todos os direitos reservados · Luanda, Angola
          </div>
        </div>
      </footer>

    </div>
  )
}

import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ── Navbar ──────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-[#1A3E6E]">ENGERIS ONE</span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md px-4 py-2 text-sm font-medium text-[#1A3E6E] transition hover:bg-[#1A3E6E]/10"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-[#1A3E6E] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1A3E6E]/90"
            >
              Demo Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left: copy */}
          <div>
            <span className="mb-4 inline-block rounded-full bg-[#1A3E6E]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#1A3E6E]">
              ERP Hoteleiro para Angola
            </span>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
              O ERP Hoteleiro que{' '}
              <span className="text-[#1A3E6E]">Angola precisa</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-600">
              Gestão completa de resorts — Reservas, F&amp;B, Spa, RH, Faturação AGT.
              Tudo integrado numa plataforma.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-md bg-[#1A3E6E] px-7 py-3 text-base font-semibold text-white shadow transition hover:bg-[#1A3E6E]/90"
              >
                Começar Gratuitamente
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-gray-300 bg-white px-7 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Ver Demonstração
              </Link>
            </div>
          </div>

          {/* Right: stat cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#1A3E6E]/10 p-6 text-center">
              <p className="text-4xl font-extrabold text-[#1A3E6E]">94%</p>
              <p className="mt-1 text-sm text-gray-600">Taxa de ocupação</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-6 text-center">
              <p className="text-4xl font-extrabold text-amber-600">47</p>
              <p className="mt-1 text-sm text-gray-600">Faturas AGT emitidas</p>
            </div>
            <div className="rounded-2xl bg-green-50 p-6 text-center">
              <p className="text-4xl font-extrabold text-green-600">28</p>
              <p className="mt-1 text-sm text-gray-600">Colaboradores ativos</p>
            </div>
            <div className="rounded-2xl bg-purple-50 p-6 text-center">
              <p className="text-3xl font-extrabold text-purple-600">Kz 125M</p>
              <p className="mt-1 text-sm text-gray-600">Receita total</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Módulos / Features ──────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Tudo o que o seu resort precisa
            </h2>
            <p className="mt-3 text-gray-500">
              Módulos integrados que crescem com o seu negócio
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '🏨',
                title: 'PMS — Gestão de Propriedade',
                desc: 'Reservas, check-in/out, tarifas dinâmicas e Channel Manager integrado com as principais OTAs.',
              },
              {
                icon: '🍽️',
                title: 'F&B / Ponto de Venda',
                desc: 'POS para restaurante, bar e room service. Comandas digitais, fichas técnicas e controlo de stock.',
              },
              {
                icon: '💆',
                title: 'Spa & Bem-estar',
                desc: 'Agendamento de tratamentos, gestão de terapeutas e vendas de pacotes de spa.',
              },
              {
                icon: '👥',
                title: 'Recursos Humanos',
                desc: 'Ponto eletrónico com geofencing GPS, processamento salarial e gestão de contratos.',
              },
              {
                icon: '🧾',
                title: 'Faturação AGT',
                desc: 'Emissão de faturas eletrónicas conforme a legislação angolana com assinatura RSA automática.',
              },
              {
                icon: '🔐',
                title: 'Smart Locks',
                desc: 'Integração TTLock via Seam API. Abertura remota, PINs temporários e auditoria de acessos.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100 transition hover:shadow-md"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Planos / Pricing ────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Planos para todos os tamanhos
            </h2>
            <p className="mt-3 text-gray-500">
              Comece gratuitamente. Expanda conforme cresce.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* STARTER */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Starter
              </p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-gray-900">50.000</span>
                <span className="mb-1 text-sm text-gray-500">Kz/mês</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                {[
                  'Até 5 utilizadores',
                  '1 propriedade',
                  'PMS básico',
                  'Faturação AGT',
                  'Suporte por email',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-[#1A3E6E]">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-md border border-[#1A3E6E] py-2.5 text-center text-sm font-semibold text-[#1A3E6E] transition hover:bg-[#1A3E6E]/5"
              >
                Começar
              </Link>
            </div>

            {/* PROFISSIONAL — highlighted */}
            <div className="relative rounded-2xl bg-[#1A3E6E] p-8 text-white shadow-xl">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-gray-900">
                Mais popular
              </span>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                Profissional
              </p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-extrabold">150.000</span>
                <span className="mb-1 text-sm text-white/70">Kz/mês</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-white/90">
                {[
                  'Até 25 utilizadores',
                  'Até 3 propriedades',
                  'PMS + F&B + Spa',
                  'Recursos Humanos',
                  'Smart Locks',
                  'Suporte prioritário',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-amber-400">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-md bg-white py-2.5 text-center text-sm font-semibold text-[#1A3E6E] transition hover:bg-white/90"
              >
                Começar
              </Link>
            </div>

            {/* ENTERPRISE */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Enterprise
              </p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-extrabold text-gray-900">500.000</span>
                <span className="mb-1 text-sm text-gray-500">Kz/mês</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                {[
                  'Utilizadores ilimitados',
                  'Propriedades ilimitadas',
                  'Todos os módulos',
                  'White-label',
                  'Gestor de conta dedicado',
                  'SLA 99.9%',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="text-[#1A3E6E]">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block rounded-md border border-[#1A3E6E] py-2.5 text-center text-sm font-semibold text-[#1A3E6E] transition hover:bg-[#1A3E6E]/5"
              >
                Começar
              </Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-gray-400">
            Todos os preços em AOA. IVA de 14% aplicável.
          </p>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────── */}
      <section className="bg-[#1A3E6E] py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-bold md:text-4xl">
            Pronto para transformar o seu resort?
          </h2>
          <p className="mt-4 text-white/70">
            14 dias de experiência gratuita. Sem cartão de crédito. Cancelamento a qualquer momento.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-md bg-white px-8 py-3 text-base font-semibold text-[#1A3E6E] transition hover:bg-white/90"
          >
            Começar Gratuitamente
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 md:flex-row md:justify-between">
          <p className="text-sm text-gray-500">
            © 2026 ENGERIS ONE. Todos os direitos reservados.
          </p>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link href="/sobre" className="hover:text-[#1A3E6E]">
              Sobre
            </Link>
            <Link href="/contacto" className="hover:text-[#1A3E6E]">
              Contacto
            </Link>
            <Link href="/privacidade" className="hover:text-[#1A3E6E]">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="hover:text-[#1A3E6E]">
              Termos de Serviço
            </Link>
          </nav>
          <p className="text-xs text-gray-400">
            Feito com ❤ por{' '}
            <a
              href="https://engeris.co.ao"
              className="font-medium text-[#1A3E6E] hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Engeris
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

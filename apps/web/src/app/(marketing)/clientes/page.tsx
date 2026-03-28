import Link from 'next/link'

export const metadata = {
  title: 'Clientes | ENGERIS ONE',
  description: 'Hotéis que confiam no ENGERIS ONE para gerir as suas operações em Angola.',
}

const seaSoulModules = ['PMS', 'Smart Locks', 'POS', 'Stock', 'RH', 'Spa', 'Eventos', 'Atividades']
const palmeiraModules = ['PMS', 'POS', 'Faturação AGT', 'Stock', 'RH', 'Manutenção']

export default function ClientesPage() {
  return (
    <main className="bg-white">
      {/* Header */}
      <section className="bg-slate-900 py-20 px-4 text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Os Nossos Clientes</h1>
        <p className="text-lg text-slate-300 max-w-xl mx-auto">
          Hotéis que confiam no ENGERIS ONE
        </p>
      </section>

      {/* Section 1 — Sea and Soul Resorts */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-2xl overflow-hidden shadow-xl flex flex-col md:flex-row">
          {/* Left — blue gradient panel */}
          <div className="md:w-1/2 bg-gradient-to-br from-blue-700 to-blue-900 p-10 text-white flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Sea and Soul Resorts</h2>
              <p className="text-blue-200 mb-6 text-sm font-medium uppercase tracking-wide">
                Cabo Ledo &amp; Sangano, Angola
              </p>
              <p className="text-blue-100 leading-relaxed">
                Dois resorts de luxo na costa angolana. O ENGERIS ONE gere reservas, hóspedes, POS,
                stock e colaboradores em ambas as propriedades.
              </p>
            </div>

            <div className="mt-8">
              <p className="text-blue-200 text-sm mb-2 uppercase tracking-wide font-semibold">
                Módulos Utilizados
              </p>
              <div className="flex flex-wrap gap-2">
                {seaSoulModules.map((mod) => (
                  <span
                    key={mod}
                    className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right — white panel */}
          <div className="md:w-1/2 bg-white p-10 flex flex-col justify-between">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { label: 'Propriedades', value: '2' },
                { label: 'Quartos', value: '120+' },
                { label: 'Reservas/ano', value: '500+' },
                { label: 'Módulos Ativos', value: '47' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-700">{stat.value}</p>
                  <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <blockquote className="border-l-4 border-blue-600 pl-4 mb-8">
              <p className="text-slate-600 italic leading-relaxed">
                "O ENGERIS ONE deu-nos visibilidade total sobre as nossas operações.
                Recomendamos vivamente."
              </p>
              <cite className="text-slate-400 text-sm mt-2 block not-italic">
                — Direção Geral, Sea and Soul Resorts
              </cite>
            </blockquote>

            {/* CTA */}
            <Link
              href="/seaandsoul"
              className="inline-flex items-center justify-center bg-blue-700 hover:bg-blue-800 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-fit"
            >
              Ver Site do Resort
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2 — Palmeira Beach Hotel */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-2xl overflow-hidden shadow-xl flex flex-col md:flex-row">
          {/* Left — white panel */}
          <div className="md:w-1/2 bg-white p-10 flex flex-col justify-between">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {[
                { label: 'Propriedade', value: '1' },
                { label: 'Quartos', value: '80' },
                { label: 'Reservas/ano', value: '300+' },
                { label: 'Módulos Ativos', value: '12' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-3xl font-bold text-amber-600">{stat.value}</p>
                  <p className="text-slate-500 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <blockquote className="border-l-4 border-amber-500 pl-4 mb-8">
              <p className="text-slate-600 italic leading-relaxed">
                "Sistema intuitivo que a nossa equipa adoptou em horas. O suporte em português
                é fantástico."
              </p>
              <cite className="text-slate-400 text-sm mt-2 block not-italic">
                — Gerência, Palmeira Beach Hotel
              </cite>
            </blockquote>

            {/* CTA */}
            <Link
              href="/palmeira"
              className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors w-fit"
            >
              Ver Site do Hotel
            </Link>
          </div>

          {/* Right — amber/golden panel */}
          <div className="md:w-1/2 bg-gradient-to-br from-amber-500 to-amber-700 p-10 text-white flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Palmeira Beach Hotel</h2>
              <p className="text-amber-100 mb-6 text-sm font-medium uppercase tracking-wide">
                Ilha de Luanda, Angola
              </p>
              <p className="text-amber-50 leading-relaxed">
                Hotel urbano 4 estrelas com vista para o Atlântico. ENGERIS ONE gere reservas
                online, restaurante e bar.
              </p>
            </div>

            <div className="mt-8">
              <p className="text-amber-100 text-sm mb-2 uppercase tracking-wide font-semibold">
                Módulos Utilizados
              </p>
              <div className="flex flex-wrap gap-2">
                {palmeiraModules.map((mod) => (
                  <span
                    key={mod}
                    className="bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — CTA */}
      <section className="bg-slate-900 py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          O seu hotel pode ser o próximo
        </h2>
        <p className="text-slate-300 mb-8 max-w-lg mx-auto">
          Junte-se aos hotéis angolanos que já modernizaram a sua gestão com o ENGERIS ONE.
        </p>
        <Link
          href="/demo"
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
        >
          Pedir Demonstração
        </Link>
      </section>
    </main>
  )
}

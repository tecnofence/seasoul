import Link from 'next/link'

export const metadata = {
  title: 'Sobre | ENGERIS ONE',
  description:
    'Conheça a ENGERIS — construindo o futuro da hotelaria africana com software acessível e suporte em português.',
}

const teamMembers = [
  {
    name: 'Manuel Silva',
    role: 'CEO & Fundador',
    initials: 'MS',
    bio: 'Mais de 15 anos de experiência em tecnologia e hospitalidade em África.',
    color: 'bg-blue-700',
  },
  {
    name: 'Ana Carvalho',
    role: 'CTO',
    initials: 'AC',
    bio: 'Especialista em arquitectura de software distribuído e sistemas cloud-native.',
    color: 'bg-slate-700',
  },
  {
    name: 'João Ferreira',
    role: 'Head of Sales',
    initials: 'JF',
    bio: 'Focado em ajudar hotéis africanos a transformar as suas operações com tecnologia.',
    color: 'bg-blue-500',
  },
]

const values = [
  {
    title: 'Inovação',
    description:
      'Desenvolvemos soluções modernas que antecipam as necessidades do setor hoteleiro africano.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
        />
      </svg>
    ),
  },
  {
    title: 'Acessibilidade',
    description:
      'Preços justos e transparentes para que qualquer hotel, grande ou pequeno, possa modernizar-se.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Suporte Local',
    description:
      'Equipa de suporte em português disponível para ajudar no momento em que mais precisa.',
    color: 'text-green-600',
    bg: 'bg-green-50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
        />
      </svg>
    ),
  },
  {
    title: 'Qualidade',
    description:
      'Software robusto, testado e certificado para cumprir os requisitos legais angolanos.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    ),
  },
]

export default function SobrePage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-slate-900 py-24 px-4 text-center">
        <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4">
          A empresa
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Sobre a ENGERIS</h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Construindo o futuro da hotelaria africana
        </p>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">A Nossa Missão</h2>
        <p className="text-lg text-slate-600 leading-relaxed">
          A nossa missão é democratizar o acesso a software de gestão hotelaria de qualidade
          em África, com preços acessíveis e suporte em português.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { value: '2+', label: 'Clientes Ativos' },
            { value: '47', label: 'Módulos Disponíveis' },
            { value: '2024', label: 'Ano de Fundação' },
          ].map((stat) => (
            <div key={stat.label} className="p-6 bg-slate-50 rounded-2xl">
              <p className="text-4xl font-bold text-blue-700">{stat.value}</p>
              <p className="text-slate-500 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">A Nossa Equipa</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="bg-white rounded-2xl p-8 shadow-sm text-center flex flex-col items-center"
              >
                <div
                  className={`${member.color} w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4`}
                >
                  {member.initials}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                <p className="text-blue-600 text-sm font-medium mb-3">{member.role}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Os Nossos Valores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value) => (
            <div
              key={value.title}
              className="flex gap-5 p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className={`${value.bg} ${value.color} p-3 rounded-xl h-fit shrink-0`}>
                {value.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1">{value.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-slate-900 py-20 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Junte-se a nós</h2>
        <p className="text-slate-300 mb-8 max-w-lg mx-auto">
          Estamos sempre à procura de parcerias e novos clientes que queiram transformar
          a hotelaria africana.
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

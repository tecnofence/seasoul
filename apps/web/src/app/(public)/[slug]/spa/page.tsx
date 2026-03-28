import { getSpaServices } from '@/lib/public-api'
import { Sparkles, Heart, Zap, Flower2, Scissors, Wind } from 'lucide-react'
import Link from 'next/link'

function formatKwanza(value: number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value)
}

const PLACEHOLDER_SERVICES = [
  {
    id: '1',
    name: 'Massagem Relaxante',
    category: 'MASSAGE',
    duration: 60,
    price: 15000,
    description: 'Massagem de corpo inteiro com óleos essenciais',
  },
  {
    id: '2',
    name: 'Facial Hidratante',
    category: 'FACIAL',
    duration: 45,
    price: 12000,
    description: 'Tratamento facial profundo com produtos naturais',
  },
  {
    id: '3',
    name: 'Pedras Quentes',
    category: 'THERAPY',
    duration: 90,
    price: 22000,
    description: 'Terapia com pedras vulcânicas aquecidas',
  },
  {
    id: '4',
    name: 'Esfoliação Corporal',
    category: 'BODY',
    duration: 60,
    price: 14000,
    description: 'Tratamento de esfoliação com sal do mar',
  },
  {
    id: '5',
    name: 'Manicure & Pedicure',
    category: 'NAILS',
    duration: 75,
    price: 10000,
    description: 'Cuidado completo das mãos e pés',
  },
  {
    id: '6',
    name: 'Aromaterapia',
    category: 'THERAPY',
    duration: 60,
    price: 16000,
    description: 'Sessão de relaxamento com óleos essenciais',
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  MASSAGE: 'Massagem',
  FACIAL: 'Facial',
  BODY: 'Corpo',
  NAILS: 'Unhas',
  HAIR: 'Cabelo',
  THERAPY: 'Terapia',
  OTHER: 'Outro',
}

function CategoryIcon({ category }: { category: string }) {
  const cls = 'w-6 h-6'
  switch (category) {
    case 'MASSAGE':
      return <Heart className={cls} />
    case 'FACIAL':
      return <Sparkles className={cls} />
    case 'THERAPY':
      return <Zap className={cls} />
    case 'BODY':
      return <Flower2 className={cls} />
    case 'NAILS':
      return <Scissors className={cls} />
    case 'HAIR':
      return <Wind className={cls} />
    default:
      return <Sparkles className={cls} />
  }
}

export default async function SpaPage({ params }: { params: { slug: string } }) {
  const apiServices = await getSpaServices(params.slug)
  const services = apiServices.length > 0 ? apiServices : PLACEHOLDER_SERVICES

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-purple-900 to-indigo-700 py-24 px-4 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple-300 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Spa & Bem-Estar</h1>
          <p className="text-lg md:text-xl text-purple-100 max-w-2xl mx-auto">
            Momentos de relaxamento e renovação
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service: typeof PLACEHOLDER_SERVICES[0]) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group"
            >
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 px-6 pt-6 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <CategoryIcon category={service.category} />
                  </div>
                  <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                    {CATEGORY_LABELS[service.category] ?? service.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
              </div>

              <div className="px-6 py-4">
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{service.description}</p>

                <div className="flex items-center justify-between mb-5">
                  <span className="flex items-center gap-1 text-sm text-gray-500">
                    <span>⏱</span>
                    <span>{service.duration} min</span>
                  </span>
                  <span className="text-lg font-bold text-purple-700">
                    {formatKwanza(service.price)}
                  </span>
                </div>

                <Link
                  href={`/${params.slug}/contacto`}
                  className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  Reservar
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-purple-900 to-indigo-700 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <Sparkles className="w-10 h-10 mx-auto mb-4 text-purple-200" />
          <p className="text-lg text-purple-100 mb-6">
            Para reservas de spa, contacte a recepção ou utilize o nosso formulário
          </p>
          <Link
            href={`/${params.slug}/contacto`}
            className="inline-flex items-center gap-2 bg-white text-purple-800 font-semibold px-8 py-3 rounded-full hover:bg-purple-50 transition-colors"
          >
            Contacte-nos
          </Link>
        </div>
      </section>
    </div>
  )
}

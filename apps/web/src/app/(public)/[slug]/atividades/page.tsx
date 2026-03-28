import { getActivities } from '@/lib/public-api'
import { Waves, Mountain, Users, Heart } from 'lucide-react'
import Link from 'next/link'

function formatKwanza(value: number) {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value)
}

const PLACEHOLDER_ACTIVITIES = [
  {
    id: '1',
    name: 'Mergulho com Snorkel',
    activityType: 'WATER',
    duration: 2,
    price: 25000,
    maxParticipants: 8,
    description: 'Explorar os recifes de coral da costa angolana',
  },
  {
    id: '2',
    name: 'Passeio de Barco ao Pôr-do-Sol',
    activityType: 'WATER',
    duration: 3,
    price: 35000,
    maxParticipants: 12,
    description: 'Cruzeiro ao pôr-do-sol com drinks incluídos',
  },
  {
    id: '3',
    name: 'Safari Fotográfico',
    activityType: 'LAND',
    duration: 4,
    price: 45000,
    maxParticipants: 6,
    description: 'Fotografia de vida selvagem nas florestas próximas',
  },
  {
    id: '4',
    name: 'Aula de Culinária Angolana',
    activityType: 'CULTURAL',
    duration: 3,
    price: 20000,
    maxParticipants: 10,
    description: 'Aprenda a cozinhar pratos típicos angolanos',
  },
  {
    id: '5',
    name: 'Yoga ao Amanhecer',
    activityType: 'WELLNESS',
    duration: 1,
    price: 8000,
    maxParticipants: 15,
    description: 'Sessão de yoga na praia ao nascer do sol',
  },
  {
    id: '6',
    name: 'Pesca Desportiva',
    activityType: 'WATER',
    duration: 5,
    price: 60000,
    maxParticipants: 4,
    description: 'Pesca offshore com equipamento profissional',
  },
]

const ACTIVITY_TYPE_STYLES: Record<
  string,
  { gradient: string; iconBg: string; iconText: string; badge: string }
> = {
  WATER: {
    gradient: 'from-cyan-50 to-blue-50',
    iconBg: 'bg-blue-100 group-hover:bg-blue-600',
    iconText: 'text-blue-700 group-hover:text-white',
    badge: 'text-blue-600 bg-blue-100',
  },
  LAND: {
    gradient: 'from-amber-50 to-orange-50',
    iconBg: 'bg-amber-100 group-hover:bg-amber-600',
    iconText: 'text-amber-700 group-hover:text-white',
    badge: 'text-amber-600 bg-amber-100',
  },
  CULTURAL: {
    gradient: 'from-rose-50 to-pink-50',
    iconBg: 'bg-rose-100 group-hover:bg-rose-600',
    iconText: 'text-rose-700 group-hover:text-white',
    badge: 'text-rose-600 bg-rose-100',
  },
  WELLNESS: {
    gradient: 'from-green-50 to-emerald-50',
    iconBg: 'bg-green-100 group-hover:bg-green-600',
    iconText: 'text-green-700 group-hover:text-white',
    badge: 'text-green-600 bg-green-100',
  },
}

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  WATER: 'Aquático',
  LAND: 'Terra',
  CULTURAL: 'Cultural',
  WELLNESS: 'Bem-Estar',
  OTHER: 'Outro',
}

function ActivityIcon({ type }: { type: string }) {
  const cls = 'w-6 h-6 transition-colors'
  switch (type) {
    case 'WATER':
      return <Waves className={cls} />
    case 'LAND':
      return <Mountain className={cls} />
    case 'CULTURAL':
      return <Users className={cls} />
    case 'WELLNESS':
      return <Heart className={cls} />
    default:
      return <Mountain className={cls} />
  }
}

export default async function AtividadesPage({ params }: { params: { slug: string } }) {
  const apiActivities = await getActivities(params.slug)
  const activities = apiActivities.length > 0 ? apiActivities : PLACEHOLDER_ACTIVITIES

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-teal-800 to-emerald-600 py-24 px-4 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-teal-300 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Atividades & Experiências</h1>
          <p className="text-lg md:text-xl text-teal-100 max-w-2xl mx-auto">
            Viva momentos únicos e inesquecíveis na costa angolana
          </p>
        </div>
      </section>

      {/* Activities Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((activity: typeof PLACEHOLDER_ACTIVITIES[0]) => {
            const styles = ACTIVITY_TYPE_STYLES[activity.activityType] ?? ACTIVITY_TYPE_STYLES['LAND']
            return (
              <div
                key={activity.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className={`bg-gradient-to-br ${styles.gradient} px-6 pt-6 pb-4`}>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${styles.iconBg} ${styles.iconText} transition-colors`}
                    >
                      <ActivityIcon type={activity.activityType} />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles.badge}`}>
                      {ACTIVITY_TYPE_LABELS[activity.activityType] ?? activity.activityType}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{activity.name}</h3>
                </div>

                <div className="px-6 py-4">
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    {activity.description}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">
                      {activity.duration} {activity.duration === 1 ? 'hora' : 'horas'}
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <span>👥</span>
                      <span>{activity.maxParticipants} pessoas</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-5">
                    <span className="text-lg font-bold text-teal-700">
                      {formatKwanza(activity.price)}
                    </span>
                    <span className="text-xs text-gray-400">/ pessoa</span>
                  </div>

                  <Link
                    href={`/${params.slug}/reservar`}
                    className="block w-full text-center bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                  >
                    Reservar
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-teal-800 to-emerald-600 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center text-white">
          <Waves className="w-10 h-10 mx-auto mb-4 text-teal-200" />
          <h2 className="text-2xl font-bold mb-3">Pronto para a aventura?</h2>
          <p className="text-teal-100 mb-6">
            Reserve a sua atividade com antecedência para garantir disponibilidade
          </p>
          <Link
            href={`/${params.slug}/reservar`}
            className="inline-flex items-center gap-2 bg-white text-teal-800 font-semibold px-8 py-3 rounded-full hover:bg-teal-50 transition-colors"
          >
            Fazer Reserva
          </Link>
        </div>
      </section>
    </div>
  )
}

import Link from 'next/link'
import { Sparkles, Shield, Star, ChevronDown } from 'lucide-react'
import { getResortInfo, getResortRooms, getResortReviews } from '@/lib/public-api'
import BookingBar from './_components/booking-bar'

function formatKwanza(value: number): string {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value)
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  STANDARD: 'Standard',
  SUPERIOR: 'Superior',
  DELUXE: 'Deluxe',
  SUITE: 'Suite',
  PRESIDENTIAL: 'Presidencial',
  BUNGALOW: 'Bungalow',
  VILLA: 'Villa',
}

const PLACEHOLDER_REVIEWS = [
  {
    id: '1',
    guestName: 'Ana Rodrigues',
    rating: 5,
    comment:
      'Uma experiência absolutamente incrível. O resort é deslumbrante, com vistas para o oceano que ficam na memória para sempre. O pessoal é atencioso e profissional.',
  },
  {
    id: '2',
    guestName: 'Carlos Mendes',
    rating: 5,
    comment:
      'Fiquei impressionado com a qualidade do serviço e a beleza natural da costa angolana. Os quartos são espaçosos e elegantes. Definitivamente voltarei!',
  },
  {
    id: '3',
    guestName: 'Maria Santos',
    rating: 4,
    comment:
      'Um retiro paradisíaco na costa de Angola. A gastronomia do restaurante é excepcional, com pratos locais e internacionais de altíssimo nível.',
  },
]

interface Resort {
  name: string
  [key: string]: unknown
}

interface Room {
  id: string
  number: string
  type: string
  floor?: number | null
  maxAdults?: number | null
  tariffs?: Array<{ price: number | string }>
  [key: string]: unknown
}

interface Review {
  id: string
  guestName?: string
  rating?: number
  comment?: string
  [key: string]: unknown
}

export default async function PublicHomePage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params

  const [resort, rooms, reviews] = await Promise.all([
    getResortInfo(slug) as Promise<Resort | null>,
    getResortRooms(slug) as Promise<Room[]>,
    getResortReviews(slug) as Promise<Review[]>,
  ])

  const featuredRooms = (rooms ?? []).slice(0, 3)
  const displayReviews =
    reviews && reviews.length > 0
      ? reviews.slice(-3).reverse()
      : PLACEHOLDER_REVIEWS

  return (
    <>
      {/* ── Section 1: Hero ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 overflow-hidden">
        {/* Decorative overlay */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-6 py-20 max-w-4xl mx-auto">
          <span className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/20 text-white text-sm font-medium tracking-widest uppercase backdrop-blur-sm">
            Angola · Costa Atlântica
          </span>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-wide leading-tight drop-shadow-lg mb-4">
            {resort?.name ?? 'Sea & Soul Resort'}
          </h1>

          <p className="text-xl md:text-2xl text-blue-100 font-light tracking-wide mb-10">
            Onde o luxo encontra a natureza
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/${slug}/reservar`}
              className="px-10 py-4 bg-white text-blue-800 font-bold rounded-full shadow-xl hover:bg-blue-50 transition-colors duration-200 text-lg"
            >
              Reservar Agora
            </Link>
            <Link
              href={`/${slug}/quartos`}
              className="px-10 py-4 bg-transparent text-white font-bold rounded-full border-2 border-white hover:bg-white/10 transition-colors duration-200 text-lg"
            >
              Explorar Quartos
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center text-white/70 animate-bounce">
          <span className="text-xs tracking-widest uppercase mb-1">Scroll</span>
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ── Section 2: Quick Booking Bar ────────────────────────────── */}
      <section className="relative z-20 bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4">
          <BookingBar slug={slug} />
        </div>
      </section>

      {/* ── Section 3: Highlights ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Por que nos escolher
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Uma experiência única na costa angolana, onde cada detalhe é
              pensado para o seu conforto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-b from-blue-50 to-white border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-700 text-white mb-5 shadow-lg">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Localização Privilegiada
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Na costa angolana, com acesso direto à praia e vistas
                deslumbrantes para o Atlântico.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-b from-teal-50 to-white border border-teal-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-teal-600 text-white mb-5 shadow-lg">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Serviço de Excelência
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Equipa dedicada 24h para tornar a sua estadia absolutamente
                inesquecível.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-gradient-to-b from-amber-50 to-white border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-amber-500 text-white mb-5 shadow-lg">
                <Star className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Gastronomia Premium
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Restaurante e bar com vista para o oceano, servindo culinária
                local e internacional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Featured Rooms ───────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Quartos em Destaque
              </h2>
              <p className="text-gray-500">
                Escolha o seu refúgio perfeito na costa atlântica.
              </p>
            </div>
            <Link
              href={`/${slug}/quartos`}
              className="text-blue-700 font-semibold hover:text-blue-900 transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              Ver todos os quartos →
            </Link>
          </div>

          {featuredRooms.length === 0 ? (
            <p className="text-center text-gray-400 py-12">
              Nenhum quarto disponível de momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredRooms.map((room) => {
                const tariffPrice =
                  room.tariffs && room.tariffs.length > 0
                    ? Number(room.tariffs[0].price)
                    : null

                return (
                  <div
                    key={room.id}
                    className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 bg-white flex flex-col"
                  >
                    {/* Card header gradient */}
                    <div className="relative h-44 bg-gradient-to-br from-blue-800 to-teal-700 flex items-end p-5">
                      <span className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                        {ROOM_TYPE_LABELS[room.type] ?? room.type}
                      </span>
                      <h3 className="text-white text-xl font-bold drop-shadow">
                        Quarto {room.number}
                      </h3>
                    </div>

                    {/* Card body */}
                    <div className="p-5 flex flex-col flex-1">
                      <p className="text-sm text-gray-500 mb-1">
                        {ROOM_TYPE_LABELS[room.type] ?? room.type}
                        {room.floor != null ? ` · Piso ${room.floor}` : ''}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        👥 Até {room.maxAdults ?? 2} adultos
                      </p>

                      <div className="mt-auto flex items-center justify-between">
                        <div>
                          {tariffPrice != null ? (
                            <>
                              <span className="text-lg font-bold text-gray-900">
                                {formatKwanza(tariffPrice)}
                              </span>
                              <span className="text-xs text-gray-400 ml-1">
                                / noite
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              Consultar
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/${slug}/reservar?roomId=${room.id}`}
                          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                          Reservar
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Section 5: Reviews ──────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              O que dizem os nossos hóspedes
            </h2>
            <p className="text-gray-500">
              Experiências reais de quem já viveu a magia do resort.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayReviews.map((review) => {
              const rating =
                typeof review.rating === 'number' ? review.rating : 5
              return (
                <div
                  key={review.id}
                  className="p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-b from-white to-gray-50 flex flex-col"
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-gray-200 fill-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-gray-600 leading-relaxed mb-5 flex-1 italic">
                    &ldquo;{review.comment ?? 'Excelente estadia!'}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm">
                      {(review.guestName ?? 'H').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">
                      {review.guestName ?? 'Hóspede'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Section 6: Final CTA ────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-blue-900 to-blue-700">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Pronto para a sua aventura?
          </h2>
          <p className="text-blue-200 text-lg mb-10">
            Reserve agora e viva uma experiência única na costa atlântica
            angolana.
          </p>
          <Link
            href={`/${slug}/reservar`}
            className="inline-block px-12 py-4 bg-white text-blue-800 font-bold rounded-full shadow-xl hover:bg-blue-50 transition-colors duration-200 text-lg"
          >
            Fazer Reserva
          </Link>
        </div>
      </section>
    </>
  )
}

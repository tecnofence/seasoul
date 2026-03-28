import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Users, Building2, Tag, Bed } from 'lucide-react'
import { getResortRooms } from '@/lib/public-api'

function formatKwanza(value: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
  }).format(value)
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

const DEFAULT_AMENITIES: Record<string, string[]> = {
  STANDARD: [
    'Ar condicionado',
    'TV de ecrã plano',
    'Wi-Fi gratuito',
    'Casa de banho privativa',
    'Cofre de segurança',
    'Mini frigorífico',
  ],
  SUPERIOR: [
    'Ar condicionado',
    'TV de ecrã plano',
    'Wi-Fi gratuito',
    'Casa de banho com banheira',
    'Cofre de segurança',
    'Mini frigorífico',
    'Varanda privativa',
    'Roupão e chinelos',
  ],
  DELUXE: [
    'Ar condicionado',
    'TV de ecrã plano 55"',
    'Wi-Fi gratuito de alta velocidade',
    'Casa de banho de luxo com banheira',
    'Cofre de segurança',
    'Mini bar',
    'Varanda com vista para o mar',
    'Roupão e chinelos de luxo',
    'Serviço de quarto 24h',
  ],
  SUITE: [
    'Ar condicionado',
    'TV de ecrã plano 65"',
    'Wi-Fi gratuito premium',
    'Casa de banho com jacuzzi',
    'Cofre de segurança',
    'Mini bar completo',
    'Terraço privativo com vista para o oceano',
    'Roupão e chinelos de luxo',
    'Serviço de quarto 24h',
    'Sala de estar separada',
    'Mordomo privativo',
  ],
  PRESIDENTIAL: [
    'Ar condicionado multizona',
    'TV de ecrã plano 75"',
    'Wi-Fi fibra óptica dedicada',
    'Casa de banho com jacuzzi e duche de chuva',
    'Cofre de segurança premium',
    'Bar completo',
    'Terraço panorâmico',
    'Roupão e chinelos de designer',
    'Serviço de quarto 24h prioritário',
    'Sala de estar e sala de jantar',
    'Mordomo privativo exclusivo',
    'Traslado aeroporto incluído',
  ],
  BUNGALOW: [
    'Ar condicionado',
    'TV de ecrã plano',
    'Wi-Fi gratuito',
    'Casa de banho exterior',
    'Cozinha equipada',
    'Varanda com rede',
    'Churrasco privativo',
    'Acesso direto à praia',
  ],
  VILLA: [
    'Ar condicionado multizona',
    'TV de ecrã plano em todas as divisões',
    'Wi-Fi premium',
    'Casa de banho principal com jacuzzi',
    'Cozinha completa equipada',
    'Piscina privativa',
    'Jardim privativo',
    'Churrasco premium',
    'Serviço de limpeza diário',
    'Mordomo disponível',
  ],
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  AVAILABLE: {
    label: 'Disponível',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  OCCUPIED: {
    label: 'Ocupado',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
  CLEANING: {
    label: 'Limpeza',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  MAINTENANCE: {
    label: 'Manutenção',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
}

interface Tariff {
  price: number | string
  name?: string
}

interface Room {
  id: string
  number: string
  type: string
  floor?: number | null
  maxAdults?: number | null
  maxChildren?: number | null
  status?: string
  description?: string | null
  amenities?: string[]
  tariffs?: Tariff[]
  [key: string]: unknown
}

export default async function RoomDetailPage({
  params,
}: {
  params: { slug: string; roomId: string }
}) {
  const { slug, roomId } = params

  const rooms = (await getResortRooms(slug)) as Room[]
  const room = rooms.find((r) => r.id === roomId)

  if (!room) notFound()

  const tariffPrice =
    room.tariffs && room.tariffs.length > 0
      ? Number(room.tariffs[0].price)
      : null

  const amenities =
    room.amenities && room.amenities.length > 0
      ? room.amenities
      : DEFAULT_AMENITIES[room.type] ?? DEFAULT_AMENITIES['STANDARD']

  const statusInfo = room.status
    ? STATUS_CONFIG[room.status] ?? {
        label: room.status,
        className: 'bg-gray-100 text-gray-500 border-gray-200',
      }
    : null

  const typeLabel = ROOM_TYPE_LABELS[room.type] ?? room.type

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back navigation */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <Link
            href={`/${slug}/quartos`}
            className="inline-flex items-center gap-2 text-blue-700 hover:text-blue-900 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Todos os Quartos
          </Link>
        </div>
      </div>

      {/* Hero banner */}
      <div className="relative w-full h-64 bg-gradient-to-br from-blue-800 via-blue-700 to-teal-600 flex items-end">
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 max-w-6xl mx-auto w-full px-4 pb-8 flex items-end justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full border border-white/30 mb-3">
              {typeLabel}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow">
              Quarto {room.number}
            </h1>
          </div>
          {statusInfo && (
            <span
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border ${statusInfo.className}`}
            >
              {statusInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Room details */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <Tag className="w-5 h-5 text-blue-600 mb-2" />
                <span className="text-xs text-gray-400 mb-1">Tipo</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {typeLabel}
                </span>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <Building2 className="w-5 h-5 text-blue-600 mb-2" />
                <span className="text-xs text-gray-400 mb-1">Piso</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {room.floor != null ? `Piso ${room.floor}` : '—'}
                </span>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <Users className="w-5 h-5 text-blue-600 mb-2" />
                <span className="text-xs text-gray-400 mb-1">Adultos</span>
                <span className="font-semibold text-gray-800 text-sm">
                  Até {room.maxAdults ?? 2}
                </span>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <Bed className="w-5 h-5 text-blue-600 mb-2" />
                <span className="text-xs text-gray-400 mb-1">Crianças</span>
                <span className="font-semibold text-gray-800 text-sm">
                  Até {room.maxChildren ?? 1}
                </span>
              </div>
            </div>

            {/* Description */}
            {room.description && (
              <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  Descrição
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {room.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            <div className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-5">
                Comodidades
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="px-3.5 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-sm font-medium"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Booking card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-2xl shadow-lg border border-gray-100 p-7 flex flex-col gap-5">
              <h3 className="text-lg font-bold text-gray-900">
                Reservar Este Quarto
              </h3>

              {/* Price display */}
              <div className="py-5 px-4 bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl border border-blue-100 text-center">
                {tariffPrice != null ? (
                  <>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      A partir de
                    </p>
                    <p className="text-3xl font-extrabold text-blue-800">
                      {formatKwanza(tariffPrice)}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">por noite</p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm">Preço sob consulta</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Contacte-nos para obter uma proposta personalizada.
                    </p>
                  </>
                )}
              </div>

              {/* Room summary */}
              <ul className="text-sm text-gray-500 space-y-2">
                <li className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  {typeLabel}
                </li>
                {room.floor != null && (
                  <li className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    Piso {room.floor}
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  Até {room.maxAdults ?? 2} adultos
                </li>
              </ul>

              {/* CTA */}
              <Link
                href={`/${slug}/reservar?roomId=${room.id}`}
                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors duration-200 text-base shadow-md"
              >
                Reservar Este Quarto
              </Link>

              <p className="text-xs text-gray-400 text-center">
                Cancelamento gratuito até 48h antes do check-in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

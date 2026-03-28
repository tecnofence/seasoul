import { getResortRooms } from '@/lib/public-api'
import RoomsFilter from './_components/rooms-filter'

interface Room {
  id: string
  number: string
  type: string
  floor?: number | null
  maxAdults?: number | null
  status?: string
  tariffs?: Array<{ price: number | string }>
  [key: string]: unknown
}

export default async function QuartosPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const rooms = (await getResortRooms(slug)) as Room[]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-700 to-teal-600 pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-wide">
            Os Nossos Quartos
          </h1>
          <p className="text-blue-100 text-lg max-w-xl mx-auto">
            Descubra o quarto perfeito para a sua estadia na costa angolana —
            cada espaço pensado para o máximo conforto e elegância.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {rooms.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 text-lg">
              Nenhum quarto disponível de momento.
            </p>
            <p className="text-gray-300 text-sm mt-2">
              Por favor contacte-nos para mais informações.
            </p>
          </div>
        ) : (
          <RoomsFilter rooms={rooms} slug={slug} />
        )}
      </div>
    </div>
  )
}

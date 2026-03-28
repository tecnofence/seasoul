'use client'

import { useState } from 'react'

const ROOM_TYPE_LABELS: Record<string, string> = {
  STANDARD: 'Standard',
  SUPERIOR: 'Superior',
  DELUXE: 'Deluxe',
  SUITE: 'Suite',
  PRESIDENTIAL: 'Presidencial',
  BUNGALOW: 'Bungalow',
  VILLA: 'Villa',
}

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

interface RoomsFilterProps {
  rooms: Room[]
  slug: string
}

function formatKwanza(value: number): string {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value)
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
  OUT_OF_SERVICE: {
    label: 'Fora de Serviço',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
}

export default function RoomsFilter({ rooms, slug }: RoomsFilterProps) {
  const [activeType, setActiveType] = useState<string>('ALL')

  // Derive available types from the room list
  const availableTypes = Array.from(new Set(rooms.map((r) => r.type))).filter(
    (t) => ROOM_TYPE_LABELS[t],
  )

  const filtered =
    activeType === 'ALL' ? rooms : rooms.filter((r) => r.type === activeType)

  return (
    <>
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-10">
        <button
          onClick={() => setActiveType('ALL')}
          className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${
            activeType === 'ALL'
              ? 'bg-blue-700 text-white border-blue-700 shadow'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-700'
          }`}
        >
          Todos
        </button>
        {availableTypes.map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-5 py-2 rounded-full text-sm font-semibold border transition-colors ${
              activeType === type
                ? 'bg-blue-700 text-white border-blue-700 shadow'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-700'
            }`}
          >
            {ROOM_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Room grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-20">
          Nenhum quarto encontrado para este filtro.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((room) => {
            const tariffPrice =
              room.tariffs && room.tariffs.length > 0
                ? Number(room.tariffs[0].price)
                : null
            const statusInfo = room.status
              ? STATUS_CONFIG[room.status] ?? {
                  label: room.status,
                  className: 'bg-gray-100 text-gray-500 border-gray-200',
                }
              : null

            return (
              <a
                key={room.id}
                href={`/${slug}/quartos/${room.id}`}
                className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white flex flex-col group"
              >
                {/* Card header */}
                <div className="relative h-48 bg-gradient-to-br from-blue-800 to-teal-600 flex items-end p-5">
                  <span className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                    {ROOM_TYPE_LABELS[room.type] ?? room.type}
                  </span>
                  <h3 className="text-white text-xl font-bold drop-shadow group-hover:scale-105 transition-transform">
                    Quarto {room.number}
                  </h3>
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">
                      {ROOM_TYPE_LABELS[room.type] ?? room.type}
                    </p>
                    {statusInfo && (
                      <span
                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span>👥 {room.maxAdults ?? 2} adultos</span>
                    {room.floor != null && <span>🏢 Piso {room.floor}</span>}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
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
                    <a
                      href={`/${slug}/reservar?roomId=${room.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Reservar
                    </a>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'

const CATEGORIES = [
  { id: 'TUDO', label: 'Tudo' },
  { id: 'QUARTOS', label: 'Quartos' },
  { id: 'PISCINA', label: 'Piscina' },
  { id: 'RESTAURANTE', label: 'Restaurante' },
  { id: 'SPA', label: 'Spa' },
  { id: 'NATUREZA', label: 'Natureza' },
  { id: 'EVENTOS', label: 'Eventos' },
]

const PHOTOS = [
  { id: 1, category: 'QUARTOS', label: 'Suite Oceano', gradient: 'from-blue-800 to-teal-600', span: 'col-span-2', height: 'h-64' },
  { id: 2, category: 'PISCINA', label: 'Piscina Infinita', gradient: 'from-emerald-700 to-cyan-500', span: 'col-span-1', height: 'h-64' },
  { id: 3, category: 'RESTAURANTE', label: 'Restaurante Vista Mar', gradient: 'from-amber-700 to-orange-500', span: 'col-span-1', height: 'h-48' },
  { id: 4, category: 'SPA', label: 'Sala de Massagens', gradient: 'from-purple-800 to-pink-600', span: 'col-span-1', height: 'h-48' },
  { id: 5, category: 'NATUREZA', label: 'Pôr-do-Sol', gradient: 'from-green-700 to-emerald-500', span: 'col-span-1', height: 'h-48' },
  { id: 6, category: 'EVENTOS', label: 'Salão de Eventos', gradient: 'from-indigo-700 to-blue-500', span: 'col-span-2', height: 'h-48' },
  { id: 7, category: 'QUARTOS', label: 'Quarto Deluxe', gradient: 'from-blue-800 to-teal-600', span: 'col-span-1', height: 'h-64' },
  { id: 8, category: 'PISCINA', label: 'Pool Bar', gradient: 'from-emerald-700 to-cyan-500', span: 'col-span-2', height: 'h-64' },
  { id: 9, category: 'RESTAURANTE', label: 'Mesa Privativa', gradient: 'from-amber-700 to-orange-500', span: 'col-span-1', height: 'h-48' },
  { id: 10, category: 'SPA', label: 'Jacuzzi Exterior', gradient: 'from-purple-800 to-pink-600', span: 'col-span-1', height: 'h-48' },
  { id: 11, category: 'NATUREZA', label: 'Praia Privativa', gradient: 'from-green-700 to-emerald-500', span: 'col-span-2', height: 'h-48' },
  { id: 12, category: 'EVENTOS', label: 'Cerimónia de Casamento', gradient: 'from-indigo-700 to-blue-500', span: 'col-span-1', height: 'h-64' },
]

export default function GaleriaPage() {
  const [activeCategory, setActiveCategory] = useState('TUDO')

  const filtered =
    activeCategory === 'TUDO'
      ? PHOTOS
      : PHOTOS.filter((p) => p.category === activeCategory)

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 to-gray-700 py-24 px-4 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-gray-300 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-6">
            <Camera className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Galeria</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Momentos inesquecíveis no nosso resort
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <div className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Masonry Grid */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">
          {filtered.map((photo) => (
            <div
              key={photo.id}
              className={`relative rounded-xl overflow-hidden cursor-pointer group ${photo.height} ${
                photo.span === 'col-span-2' ? 'sm:col-span-2' : 'col-span-1'
              }`}
            >
              {/* Gradient background as photo placeholder */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${photo.gradient} transition-transform duration-500 group-hover:scale-105`}
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                <span className="text-white text-xs font-medium tracking-wide">
                  {photo.label}
                </span>
              </div>

              {/* Top category badge */}
              <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white/80 text-xs bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                  {CATEGORIES.find((c) => c.id === photo.category)?.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Camera className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma foto nesta categoria</p>
          </div>
        )}
      </section>
    </div>
  )
}

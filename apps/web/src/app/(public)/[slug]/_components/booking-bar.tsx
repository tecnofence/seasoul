'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, Search } from 'lucide-react'

interface BookingBarProps {
  slug: string
}

export default function BookingBar({ slug }: BookingBarProps) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [checkIn, setCheckIn] = useState(today)
  const [checkOut, setCheckOut] = useState(tomorrow)
  const [adults, setAdults] = useState(2)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: String(adults),
    })
    router.push(`/${slug}/reservar?${params.toString()}`)
  }

  return (
    <div className="w-full bg-white shadow-2xl rounded-2xl px-6 py-5">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row items-end gap-4"
      >
        {/* Check-in */}
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Check-in
            </span>
          </label>
          <input
            type="date"
            value={checkIn}
            min={today}
            onChange={(e) => setCheckIn(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Check-out */}
        <div className="flex-1 min-w-0">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Check-out
            </span>
          </label>
          <input
            type="date"
            value={checkOut}
            min={checkIn || today}
            onChange={(e) => setCheckOut(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Adults */}
        <div className="w-full md:w-36">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Adultos
            </span>
          </label>
          <input
            type="number"
            value={adults}
            min={1}
            max={10}
            onChange={(e) => setAdults(Number(e.target.value))}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-xl transition-colors duration-200 whitespace-nowrap"
        >
          <Search className="w-4 h-4" />
          Verificar Disponibilidade
        </button>
      </form>
    </div>
  )
}

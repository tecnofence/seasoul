'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  AVAILABLE: 'success',
  OCCUPIED: 'info',
  MAINTENANCE: 'danger',
  CLEANING: 'warning',
}

const statusLabel: Record<string, string> = {
  AVAILABLE: 'Disponível',
  OCCUPIED: 'Ocupado',
  MAINTENANCE: 'Manutenção',
  CLEANING: 'Limpeza',
}

export default function RoomsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms', { params: { limit: 100 } }).then((r) => r.data),
  })

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar quartos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quartos</h1>
        <Link href="/dashboard/rooms/new">
          <Button>Novo Quarto</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data?.data?.map((room: any) => (
          <Card key={room.id} className="flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = `/dashboard/rooms/${room.id}`}>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">#{room.number}</h3>
                <Badge variant={statusVariant[room.status] ?? 'default'}>
                  {statusLabel[room.status] ?? room.status}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500">{room.type} — Piso {room.floor}</p>
              <p className="text-sm text-gray-500">Capacidade: {room.capacity} pessoas</p>
            </div>
            <p className="mt-3 text-lg font-semibold text-primary">
              {formatKwanza(room.pricePerNight)}<span className="text-sm font-normal text-gray-400">/noite</span>
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}

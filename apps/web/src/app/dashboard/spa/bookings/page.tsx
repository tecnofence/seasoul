'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SkeletonTable } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { CalendarCheck, Plus } from 'lucide-react'

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  PENDING:   { label: 'Pendente',   variant: 'warning' },
  CONFIRMED: { label: 'Confirmado', variant: 'success' },
  COMPLETED: { label: 'Concluído',  variant: 'secondary' },
  CANCELLED: { label: 'Cancelado',  variant: 'destructive' },
}

export default function SpaBookingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['spa-bookings'],
    queryFn: () => api.get('/v1/spa/bookings').then((r) => r.data),
  })

  const bookings: any[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3E6E]">Reservas de Spa</h1>
          <p className="text-sm text-gray-500 mt-1">Gestão de marcações e tratamentos</p>
        </div>
        <Link href="/dashboard/spa/bookings/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Reserva
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarCheck className="w-12 h-12 mb-4 opacity-30" />
            <p className="font-medium">Nenhuma reserva de spa</p>
            <p className="text-sm mt-1">As marcações aparecem aqui após criação</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#1A3E6E] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Hóspede</th>
                    <th className="px-4 py-3 text-left">Serviço</th>
                    <th className="px-4 py-3 text-left">Data/Hora</th>
                    <th className="px-4 py-3 text-left">Terapeuta</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b: any, i: number) => {
                    const st = STATUS_LABELS[b.status] ?? { label: b.status, variant: 'secondary' as const }
                    return (
                      <tr key={b.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 font-medium">{b.guestName ?? b.clientName ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{b.serviceName ?? b.service ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {b.scheduledAt ? formatDateTime(new Date(b.scheduledAt)) : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{b.therapistName ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { BedDouble, TrendingUp, LogIn, LogOut, AlertTriangle, ClipboardList } from 'lucide-react'

export default function DashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data.data),
  })

  const { data: today } = useQuery({
    queryKey: ['reservations-today'],
    queryFn: () => api.get('/reservations/today').then((r) => r.data.data),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">A carregar painel...</p>
      </div>
    )
  }

  const occupancy = dashboard?.occupancy ?? 0
  const revenue = dashboard?.revenue ?? 0
  const checkInsToday = today?.checkIns?.length ?? 0
  const checkOutsToday = today?.checkOuts?.length ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Painel de Controlo</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Taxa de Ocupação"
          value={`${Math.round(occupancy)}%`}
          icon={<BedDouble className="h-8 w-8" />}
        />
        <StatCard
          title="Receita (mês)"
          value={formatKwanza(revenue)}
          icon={<TrendingUp className="h-8 w-8" />}
        />
        <StatCard
          title="Check-ins Hoje"
          value={checkInsToday}
          icon={<LogIn className="h-8 w-8" />}
        />
        <StatCard
          title="Check-outs Hoje"
          value={checkOutsToday}
          icon={<LogOut className="h-8 w-8" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Check-ins Esperados Hoje</CardTitle>
          <CardContent>
            {today?.checkIns?.length ? (
              <ul className="space-y-2">
                {today.checkIns.map((r: any) => (
                  <li key={r.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{r.guestName}</p>
                      <p className="text-sm text-gray-500">Quarto {r.room?.number}</p>
                    </div>
                    <span className="text-sm text-gray-400">{r.room?.type}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum check-in hoje</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Check-outs Esperados Hoje</CardTitle>
          <CardContent>
            {today?.checkOuts?.length ? (
              <ul className="space-y-2">
                {today.checkOuts.map((r: any) => (
                  <li key={r.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{r.guestName}</p>
                      <p className="text-sm text-gray-500">Quarto {r.room?.number}</p>
                    </div>
                    <span className="text-sm text-gray-400">{r.room?.type}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhum check-out hoje</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

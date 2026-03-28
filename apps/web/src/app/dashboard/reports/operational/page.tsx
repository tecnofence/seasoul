'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import api from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const COLORS = ['#F59E0B', '#0A5C8A', '#10B981', '#EF4444', '#6366F1', '#EC4899']

// Dados de amostra hoteleiros
const sampleMaintenanceByStatus = [
  { status: 'Aberto', quantidade: 14 },
  { status: 'Em Progresso', quantidade: 9 },
  { status: 'Concluído', quantidade: 32 },
  { status: 'Cancelado', quantidade: 4 },
]

const sampleMaintenanceByType = [
  { name: 'Canalização', value: 18 },
  { name: 'Elétrico', value: 14 },
  { name: 'AC / Climatização', value: 11 },
  { name: 'Mobiliário', value: 8 },
  { name: 'Outro', value: 7 },
]

const sampleHousekeepingTrend = [
  { day: 'Seg', quartos: 28 },
  { day: 'Ter', quartos: 31 },
  { day: 'Qua', quartos: 26 },
  { day: 'Qui', quartos: 33 },
  { day: 'Sex', quartos: 35 },
  { day: 'Sáb', quartos: 38 },
  { day: 'Dom', quartos: 30 },
]

const samplePatrolsByRoute = [
  { route: 'Perimetral Norte', rondas: 14 },
  { route: 'Zona de Piscinas', rondas: 18 },
  { route: 'Acesso Principal', rondas: 21 },
  { route: 'Bloco B', rondas: 12 },
  { route: 'Praia Privada', rondas: 9 },
]

const sampleInspectionsByResult = [
  { name: 'Aprovado', value: 42 },
  { name: 'Aprovado c/ Ressalvas', value: 11 },
  { name: 'Reprovado', value: 4 },
]

export default function OperationalReportsPage() {
  const { data: maintenanceData } = useQuery({
    queryKey: ['reports-maintenance'],
    queryFn: () => api.get('/maintenance?limit=200').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const { data: patrols } = useQuery({
    queryKey: ['reports-patrols'],
    queryFn: () => api.get('/security/patrols?limit=200').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const maintenanceByStatus = maintenanceData
    ? groupByField(maintenanceData, 'status', { OPEN: 'Aberto', IN_PROGRESS: 'Em Progresso', RESOLVED: 'Concluído', CANCELLED: 'Cancelado' })
    : sampleMaintenanceByStatus

  const maintenanceByType = maintenanceData
    ? groupByField(maintenanceData, 'type', { PLUMBING: 'Canalização', ELECTRICAL: 'Elétrico', AC: 'AC / Climatização', FURNITURE: 'Mobiliário', OTHER: 'Outro' })
    : sampleMaintenanceByType

  const patrolsByRoute = patrols
    ? groupPatrolsByRoute(patrols)
    : samplePatrolsByRoute

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/reports" className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Operacionais</h1>
          <p className="mt-1 text-sm text-gray-500">Manutenção, housekeeping, segurança e inspeções</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Manutenção por Estado */}
        <Card>
          <CardHeader><CardTitle>Tickets de Manutenção por Estado</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintenanceByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" name="Tickets" radius={[4, 4, 0, 0]}>
                    {maintenanceByStatus.map((_, i) => (
                      <Cell key={i} fill={['#F59E0B', '#0A5C8A', '#10B981', '#EF4444'][i] || '#6366F1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Manutenção por Tipo */}
        <Card>
          <CardHeader><CardTitle>Tipo de Avaria — Distribuição</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={maintenanceByType} cx="50%" cy="50%" outerRadius={100}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    dataKey="value">
                    {maintenanceByType.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Housekeeping — quartos limpos por dia */}
        <Card>
          <CardHeader><CardTitle>Housekeeping — Quartos Limpos / Dia</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleHousekeepingTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quartos" name="Quartos Limpos" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Inspeções por Resultado */}
        <Card>
          <CardHeader><CardTitle>Inspeções por Resultado</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sampleInspectionsByResult} cx="50%" cy="50%" outerRadius={100}
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    dataKey="value">
                    {sampleInspectionsByResult.map((_, i) => (
                      <Cell key={i} fill={['#10B981', '#F59E0B', '#EF4444'][i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rondas de Segurança por Rota */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Rondas de Segurança por Rota — Este Mês</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patrolsByRoute} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="route" type="category" width={160} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rondas" name="Rondas Realizadas" fill="#1A3E6E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function groupByField(items: any[], field: string, labelMap: Record<string, string>) {
  const map: Record<string, number> = {}
  items.forEach((item: any) => {
    const key = item[field] || 'OTHER'
    map[key] = (map[key] || 0) + 1
  })
  return Object.entries(map).map(([key, value]) => ({
    status: labelMap[key] || key,
    name: labelMap[key] || key,
    value,
    quantidade: value,
  }))
}

function groupPatrolsByRoute(patrols: any[]) {
  const map: Record<string, number> = {}
  patrols.forEach((p: any) => {
    const route = p.route || p.routeName || 'Sem Rota'
    map[route] = (map[route] || 0) + 1
  })
  return Object.entries(map).map(([route, rondas]) => ({ route, rondas }))
}

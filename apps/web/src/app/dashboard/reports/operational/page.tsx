'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import api from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const COLORS = ['#0A5C8A', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899']

// Dados de amostra
const sampleProjectsByStatus = [
  { name: 'Em Curso', value: 12 },
  { name: 'Concluído', value: 28 },
  { name: 'Pendente', value: 7 },
  { name: 'Cancelado', value: 3 },
]

const sampleIncidentsBySeverity = [
  { severity: 'Crítica', quantidade: 3 },
  { severity: 'Alta', quantidade: 8 },
  { severity: 'Média', quantidade: 15 },
  { severity: 'Baixa', quantidade: 22 },
]

const sampleVehiclesStatus = [
  { name: 'Disponível', value: 18 },
  { name: 'Em Uso', value: 12 },
  { name: 'Manutenção', value: 5 },
  { name: 'Inativo', value: 2 },
]

const sampleMaintenanceByStatus = [
  { status: 'Aberto', quantidade: 14 },
  { status: 'Em Progresso', quantidade: 9 },
  { status: 'Concluído', quantidade: 32 },
  { status: 'Cancelado', quantidade: 4 },
]

const sampleContractsTrend = [
  { month: 'Jan', ativos: 22 },
  { month: 'Fev', ativos: 24 },
  { month: 'Mar', ativos: 23 },
  { month: 'Abr', ativos: 26 },
  { month: 'Mai', ativos: 28 },
  { month: 'Jun', ativos: 30 },
  { month: 'Jul', ativos: 32 },
  { month: 'Ago', ativos: 31 },
  { month: 'Set', ativos: 34 },
  { month: 'Out', ativos: 36 },
  { month: 'Nov', ativos: 38 },
  { month: 'Dez', ativos: 41 },
]

export default function OperationalReportsPage() {
  const { data: projects } = useQuery({
    queryKey: ['reports-projects'],
    queryFn: () => api.get('/projects?limit=200').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const { data: incidents } = useQuery({
    queryKey: ['reports-incidents'],
    queryFn: () => api.get('/incidents?limit=200').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const { data: vehicles } = useQuery({
    queryKey: ['reports-vehicles'],
    queryFn: () => api.get('/vehicles?limit=200').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const projectsByStatus = projects
    ? groupByField(projects, 'status', { IN_PROGRESS: 'Em Curso', COMPLETED: 'Concluído', PENDING: 'Pendente', CANCELLED: 'Cancelado' })
    : sampleProjectsByStatus

  const incidentsBySeverity = incidents
    ? groupBySeverity(incidents)
    : sampleIncidentsBySeverity

  const vehiclesStatus = vehicles
    ? groupByField(vehicles, 'status', { AVAILABLE: 'Disponível', IN_USE: 'Em Uso', MAINTENANCE: 'Manutenção', INACTIVE: 'Inativo' })
    : sampleVehiclesStatus

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/reports"
          className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Operacionais</h1>
          <p className="mt-1 text-sm text-gray-500">
            Projetos, incidentes, frota e manutenção
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Projetos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Projetos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {projectsByStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Incidentes por Severidade */}
        <Card>
          <CardHeader>
            <CardTitle>Incidentes por Severidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incidentsBySeverity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" name="Quantidade" fill="#EF4444" radius={[4, 4, 0, 0]}>
                    {incidentsBySeverity.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#EF4444', '#F59E0B', '#0A5C8A', '#10B981'][index] || '#6366F1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Veículos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Estado da Frota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehiclesStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {vehiclesStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Manutenção por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets de Manutenção por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleMaintenanceByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" name="Quantidade" fill="#6366F1" radius={[4, 4, 0, 0]}>
                    {sampleMaintenanceByStatus.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={['#F59E0B', '#0A5C8A', '#10B981', '#EF4444'][index] || '#6366F1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tendência de Contratos Ativos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tendência de Contratos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sampleContractsTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ativos"
                    name="Contratos Ativos"
                    stroke="#0A5C8A"
                    strokeWidth={2}
                    dot={{ fill: '#0A5C8A' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Funções auxiliares
function groupByField(items: any[], field: string, labelMap: Record<string, string>) {
  const map: Record<string, number> = {}
  items.forEach((item: any) => {
    const key = item[field] || 'UNKNOWN'
    map[key] = (map[key] || 0) + 1
  })
  return Object.entries(map).map(([key, value]) => ({
    name: labelMap[key] || key,
    value,
  }))
}

function groupBySeverity(incidents: any[]) {
  const severityMap: Record<string, string> = {
    CRITICAL: 'Crítica',
    HIGH: 'Alta',
    MEDIUM: 'Média',
    LOW: 'Baixa',
  }
  const map: Record<string, number> = {}
  incidents.forEach((inc: any) => {
    const sev = inc.severity || 'MEDIUM'
    map[sev] = (map[sev] || 0) + 1
  })
  return Object.entries(map).map(([key, value]) => ({
    severity: severityMap[key] || key,
    quantidade: value,
  }))
}

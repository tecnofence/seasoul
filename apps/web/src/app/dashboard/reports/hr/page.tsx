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
import { formatKwanza } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const COLORS = ['#0A5C8A', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899']

// Dados de amostra
const sampleEmployeesByDepartment = [
  { name: 'Engenharia', value: 18 },
  { name: 'Segurança', value: 24 },
  { name: 'Eletricidade', value: 12 },
  { name: 'Administrativo', value: 8 },
  { name: 'Comercial', value: 6 },
  { name: 'RH', value: 4 },
]

const sampleAttendanceRate = [
  { week: 'Sem 1', taxa: 95 },
  { week: 'Sem 2', taxa: 92 },
  { week: 'Sem 3', taxa: 97 },
  { week: 'Sem 4', taxa: 94 },
  { week: 'Sem 5', taxa: 96 },
  { week: 'Sem 6', taxa: 91 },
  { week: 'Sem 7', taxa: 93 },
  { week: 'Sem 8', taxa: 98 },
  { week: 'Sem 9', taxa: 95 },
  { week: 'Sem 10', taxa: 94 },
  { week: 'Sem 11', taxa: 96 },
  { week: 'Sem 12', taxa: 97 },
]

const samplePayrollByDepartment = [
  { department: 'Engenharia', salarios: 8500000 },
  { department: 'Segurança', salarios: 7200000 },
  { department: 'Eletricidade', salarios: 5800000 },
  { department: 'Administrativo', salarios: 3200000 },
  { department: 'Comercial', salarios: 3600000 },
  { department: 'RH', salarios: 2100000 },
]

const sampleTrainingCompletion = [
  { course: 'Segurança no Trabalho', concluido: 85, pendente: 15 },
  { course: 'Primeiros Socorros', concluido: 72, pendente: 28 },
  { course: 'Elétrica Básica', concluido: 90, pendente: 10 },
  { course: 'Gestão de Projetos', concluido: 60, pendente: 40 },
  { course: 'Atendimento Cliente', concluido: 78, pendente: 22 },
]

const kwanzaFormatter = (value: number) => formatKwanza(value)

export default function HRReportsPage() {
  const { data: employees } = useQuery({
    queryKey: ['reports-employees'],
    queryFn: () => api.get('/hr?limit=200').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const { data: attendance } = useQuery({
    queryKey: ['reports-attendance'],
    queryFn: () => api.get('/attendance?limit=200').then((r) => r.data.data),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  })

  const employeesByDepartment = employees
    ? processEmployeesByDepartment(employees)
    : sampleEmployeesByDepartment

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
          <h1 className="text-2xl font-bold text-gray-900">Relatórios de RH</h1>
          <p className="mt-1 text-sm text-gray-500">
            Colaboradores, assiduidade, salários e formação
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Colaboradores por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle>Colaboradores por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={employeesByDepartment}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {employeesByDepartment.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Assiduidade */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Assiduidade — Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sampleAttendanceRate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[80, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="taxa"
                    name="Taxa de Assiduidade"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Salários por Departamento */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Massa Salarial por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={samplePayrollByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis tickFormatter={kwanzaFormatter} />
                  <Tooltip formatter={(value: number) => formatKwanza(value)} />
                  <Legend />
                  <Bar dataKey="salarios" name="Salários" fill="#6366F1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Conclusão de Formação */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Taxa de Conclusão de Formações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sampleTrainingCompletion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="course" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(value: number) => `${value}%`} />
                  <Legend />
                  <Bar
                    dataKey="concluido"
                    name="Concluído"
                    stackId="a"
                    fill="#10B981"
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="pendente"
                    name="Pendente"
                    stackId="a"
                    fill="#F59E0B"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Funções de processamento
function processEmployeesByDepartment(employees: any[]) {
  const deptMap: Record<string, string> = {
    ENGINEERING: 'Engenharia',
    SECURITY: 'Segurança',
    ELECTRICAL: 'Eletricidade',
    ADMIN: 'Administrativo',
    COMMERCIAL: 'Comercial',
    HR: 'RH',
  }
  const map: Record<string, number> = {}
  employees.forEach((emp: any) => {
    const dept = emp.department || 'ADMIN'
    map[dept] = (map[dept] || 0) + 1
  })
  return Object.entries(map).map(([key, value]) => ({
    name: deptMap[key] || key,
    value,
  }))
}

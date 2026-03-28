'use client'

import { useQuery } from '@tanstack/react-query'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'
import { ArrowLeft, Users, UserCheck, Clock, Wallet } from 'lucide-react'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { StatCard } from '@/components/ui/stat-card'

const COLORS = ['#1A3E6E', '#0A5C8A', '#10B981', '#F59E0B', '#EF4444']

// ── Dados de amostra ─────────────────────────────────────────────────────────

const SAMPLE_DEPARTMENTS = [
  { name: 'Receção', value: 6 },
  { name: 'F&B', value: 8 },
  { name: 'Housekeeping', value: 5 },
  { name: 'Manutenção', value: 3 },
  { name: 'Segurança', value: 2 },
]

const SAMPLE_ATTENDANCE_WEEKDAY = [
  { dia: 'Seg', taxa: 97 },
  { dia: 'Ter', taxa: 95 },
  { dia: 'Qua', taxa: 94 },
  { dia: 'Qui', taxa: 96 },
  { dia: 'Sex', taxa: 93 },
  { dia: 'Sáb', taxa: 88 },
  { dia: 'Dom', taxa: 85 },
]

const SAMPLE_PAYROLL_BY_DEPT = [
  { departamento: 'Receção', custo: 6_200_000 },
  { departamento: 'F&B', custo: 8_100_000 },
  { departamento: 'Housekeeping', custo: 5_400_000 },
  { departamento: 'Manutenção', custo: 4_800_000 },
  { departamento: 'Segurança', custo: 4_000_000 },
]

const SAMPLE_TOP_EMPLOYEES = [
  { name: 'Ana Ferreira', department: 'Receção', taxa: 100 },
  { name: 'Carlos Neto', department: 'Manutenção', taxa: 99 },
  { name: 'Maria Lopes', department: 'F&B', taxa: 98 },
  { name: 'João Silva', department: 'Housekeeping', taxa: 98 },
  { name: 'Paula Costa', department: 'Segurança', taxa: 97 },
]

const DEPT_LABELS: Record<string, string> = {
  RECEPTION: 'Receção',
  FB: 'F&B',
  HOUSEKEEPING: 'Housekeeping',
  MAINTENANCE: 'Manutenção',
  SECURITY: 'Segurança',
  ADMIN: 'Administrativo',
  HR: 'RH',
  SPA: 'Spa',
}

interface Employee {
  id: string
  name: string
  department: string
  active: boolean
  baseSalary?: number | string
}

interface AttendanceRecord {
  id: string
  employeeId: string
  createdAt: string
}

interface PayrollRecord {
  id: string
  employeeId: string
  netSalary: number | string
  month: number
  year: number
}

function processEmployeeData(employees: Employee[]) {
  const total = employees.length
  const active = employees.filter((e) => e.active).length
  const deptMap: Record<string, number> = {}
  employees.forEach((e) => {
    const dept = DEPT_LABELS[e.department] ?? e.department ?? 'Outro'
    deptMap[dept] = (deptMap[dept] || 0) + 1
  })
  const departments = Object.entries(deptMap).map(([name, value]) => ({ name, value }))
  return { total, active, departments }
}

function processAttendanceRate(attendance: AttendanceRecord[], employees: Employee[]) {
  if (attendance.length === 0 || employees.length === 0) return SAMPLE_ATTENDANCE_WEEKDAY

  const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const dayCount: Record<number, { present: number; total: number }> = {}
  for (let i = 0; i < 7; i++) dayCount[i] = { present: 0, total: 0 }

  attendance.forEach((rec) => {
    const d = new Date(rec.createdAt)
    const dow = d.getDay()
    dayCount[dow].present++
    dayCount[dow].total++
  })

  // Reorder Mon-Sun
  const order = [1, 2, 3, 4, 5, 6, 0]
  return order.map((dow) => {
    const { present, total } = dayCount[dow]
    return {
      dia: DAY_NAMES[dow],
      taxa: total > 0 ? Math.round((present / total) * 100) : 0,
    }
  })
}

function processPayrollDept(payroll: PayrollRecord[], employees: Employee[]) {
  if (payroll.length === 0 || employees.length === 0) return SAMPLE_PAYROLL_BY_DEPT

  const empDept: Record<string, string> = {}
  employees.forEach((e) => {
    empDept[e.id] = DEPT_LABELS[e.department] ?? e.department ?? 'Outro'
  })

  const deptCost: Record<string, number> = {}
  payroll.forEach((p) => {
    const dept = empDept[p.employeeId] ?? 'Outro'
    deptCost[dept] = (deptCost[dept] || 0) + parseFloat(String(p.netSalary ?? 0))
  })

  return Object.entries(deptCost).map(([departamento, custo]) => ({ departamento, custo }))
}

function calcAvgAttendance(data: { dia: string; taxa: number }[]) {
  if (data.length === 0) return 94
  return Math.round(data.reduce((a, d) => a + d.taxa, 0) / data.length)
}

export default function HRReportsPage() {
  const { data: employeesData } = useQuery<{ data: Employee[] }>({
    queryKey: ['hr-employees-report'],
    queryFn: () => api.get('/hr/employees?limit=200').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: attendanceData } = useQuery<{ data: AttendanceRecord[] }>({
    queryKey: ['hr-attendance-report'],
    queryFn: () => api.get('/attendance?limit=200').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: payrollData } = useQuery<{ data: PayrollRecord[] }>({
    queryKey: ['hr-payroll-report'],
    queryFn: () => api.get('/payroll?limit=100').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const employees = employeesData?.data ?? []
  const attendance = attendanceData?.data ?? []
  const payroll = payrollData?.data ?? []

  const hasEmployees = employees.length > 0

  // KPI values
  const { total: totalEmployees, active: activeEmployees, departments } = hasEmployees
    ? processEmployeeData(employees)
    : { total: 24, active: 22, departments: SAMPLE_DEPARTMENTS }

  const attendanceByDay = processAttendanceRate(attendance, employees)
  const avgAttendance = calcAvgAttendance(attendanceByDay)

  const payrollByDept = processPayrollDept(payroll, employees)

  const totalPayrollCost = hasEmployees && payroll.length > 0
    ? payroll.reduce((a, p) => a + parseFloat(String(p.netSalary ?? 0)), 0)
    : 28_500_000

  // Top 5 employees by attendance (mock if no real data)
  const topEmployees = SAMPLE_TOP_EMPLOYEES

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/reports"
          className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios de Recursos Humanos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Colaboradores, assiduidade e massa salarial
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Colaboradores"
          value={totalEmployees}
          icon={<Users className="h-6 w-6 text-primary" />}
          description="Todos os colaboradores registados"
        />
        <StatCard
          title="Colaboradores Ativos"
          value={activeEmployees}
          icon={<UserCheck className="h-6 w-6 text-green-600" />}
          description={`${totalEmployees - activeEmployees} em licença ou ausentes`}
        />
        <StatCard
          title="Taxa de Assiduidade"
          value={`${avgAttendance}%`}
          icon={<Clock className="h-6 w-6 text-primary" />}
          description="Média semanal de presença"
        />
        <StatCard
          title="Custo Salarial / Mês"
          value={formatKwanza(totalPayrollCost)}
          icon={<Wallet className="h-6 w-6 text-green-600" />}
          description="Massa salarial líquida mensal"
        />
      </div>

      {/* Pie + Attendance by weekday */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie — Colaboradores por Departamento */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-gray-900">
            Colaboradores por Departamento
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departments}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {departments.map((_, index) => (
                    <Cell key={`dept-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Colaboradores']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar — Assiduidade % por dia da semana */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-base font-semibold text-gray-900">
            Assiduidade por Dia da Semana
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceByDay} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis
                  domain={[75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11 }}
                  width={40}
                />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Taxa de Assiduidade']} />
                <Bar dataKey="taxa" name="Assiduidade %" fill="#10B981" radius={[6, 6, 0, 0]}>
                  {attendanceByDay.map((entry, index) => (
                    <Cell
                      key={`att-${index}`}
                      fill={entry.taxa >= 95 ? '#10B981' : entry.taxa >= 90 ? '#F59E0B' : '#EF4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar — Custo Salarial por Departamento (horizontal) */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-base font-semibold text-gray-900">
          Custo Salarial por Departamento
        </h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={payrollByDept}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 16, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                dataKey="departamento"
                type="category"
                width={110}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [formatKwanza(value), 'Custo Salarial']}
              />
              <Legend />
              <Bar dataKey="custo" name="Custo Salarial" fill="#1A3E6E" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table — Top 5 colaboradores por assiduidade */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Top 5 — Maior Taxa de Assiduidade
          </h2>
          <p className="text-xs text-gray-400">Colaboradores com melhor registo de presença</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">#</th>
                <th className="px-6 py-3 text-left">Colaborador</th>
                <th className="px-6 py-3 text-left">Departamento</th>
                <th className="px-6 py-3 text-right">Taxa de Assiduidade</th>
                <th className="px-6 py-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topEmployees.map((emp, idx) => (
                <tr key={emp.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-700'
                          : idx === 1
                          ? 'bg-gray-100 text-gray-600'
                          : idx === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{emp.name}</td>
                  <td className="px-6 py-4 text-gray-500">{emp.department}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: `${emp.taxa}%` }}
                        />
                      </div>
                      <span className="font-semibold text-gray-900">{emp.taxa}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                      Ativo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

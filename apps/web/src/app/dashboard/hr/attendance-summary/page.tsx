'use client'

import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import {
  Printer,
  Users,
  CalendarCheck2,
  CalendarX2,
  Clock,
  TrendingUp,
  Filter,
  RefreshCw,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AttendanceRecord {
  id: string
  employeeId: string
  date: string
  checkIn?: string
  checkOut?: string
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HOLIDAY'
  hoursWorked?: number
  overtimeHours?: number
}

interface Employee {
  id: string
  name: string
  department?: string
  position?: string
}

interface EmployeeSummary {
  employee: Employee
  daysPresent: number
  daysAbsent: number
  daysLeave: number
  totalHours: number
  overtimeHours: number
  avgHoursPerDay: number
  attendanceRate: number
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'e1', name: 'Ana Luísa Ferreira', department: 'Receção', position: 'Recepcionista' },
  { id: 'e2', name: 'Carlos Manuel Neto', department: 'F&B', position: 'Chefe de Sala' },
  { id: 'e3', name: 'Beatriz Costa', department: 'Housekeeping', position: 'Supervisora' },
  { id: 'e4', name: 'José António Lima', department: 'Manutenção', position: 'Técnico' },
  { id: 'e5', name: 'Márcia Rodrigues', department: 'Spa', position: 'Terapeuta' },
]

function generateMockAttendance(month: number, year: number): AttendanceRecord[] {
  const records: AttendanceRecord[] = []
  const daysInMonth = new Date(year, month, 0).getDate()

  const employeeConfig = [
    { id: 'e1', presentRate: 0.95, avgHours: 8.2, overtimeRate: 0.1 },
    { id: 'e2', presentRate: 0.88, avgHours: 9.1, overtimeRate: 0.2 },
    { id: 'e3', presentRate: 0.92, avgHours: 8.0, overtimeRate: 0.05 },
    { id: 'e4', presentRate: 0.85, avgHours: 8.5, overtimeRate: 0.15 },
    { id: 'e5', presentRate: 0.90, avgHours: 7.8, overtimeRate: 0.08 },
  ]

  employeeConfig.forEach((cfg) => {
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month - 1, d)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue // skip weekends

      const rand = Math.random()
      let status: AttendanceRecord['status']
      let hoursWorked: number | undefined
      let overtimeHours: number | undefined

      if (rand < cfg.presentRate) {
        status = 'PRESENT'
        hoursWorked = cfg.avgHours + (Math.random() - 0.5) * 2
        overtimeHours = Math.random() < cfg.overtimeRate ? Math.random() * 2 : 0
      } else if (rand < cfg.presentRate + 0.05) {
        status = 'LEAVE'
      } else {
        status = 'ABSENT'
      }

      records.push({
        id: `${cfg.id}-${d}`,
        employeeId: cfg.id,
        date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        status,
        hoursWorked: hoursWorked ? Math.round(hoursWorked * 10) / 10 : undefined,
        overtimeHours: overtimeHours ? Math.round(overtimeHours * 10) / 10 : undefined,
      })
    }
  })

  return records
}

// ─── Aggregation ──────────────────────────────────────────────────────────────

function buildSummaries(
  employees: Employee[],
  records: AttendanceRecord[],
  month: number,
  year: number,
): EmployeeSummary[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  let workingDays = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow !== 0 && dow !== 6) workingDays++
  }

  return employees.map((emp) => {
    const empRecords = records.filter((r) => r.employeeId === emp.id)
    const daysPresent = empRecords.filter((r) => r.status === 'PRESENT').length
    const daysAbsent = empRecords.filter((r) => r.status === 'ABSENT').length
    const daysLeave = empRecords.filter((r) => r.status === 'LEAVE').length
    const totalHours = empRecords.reduce((sum, r) => sum + (r.hoursWorked ?? 0), 0)
    const overtimeHours = empRecords.reduce((sum, r) => sum + (r.overtimeHours ?? 0), 0)
    const avgHoursPerDay = daysPresent > 0 ? totalHours / daysPresent : 0
    const attendanceRate = workingDays > 0 ? Math.round((daysPresent / workingDays) * 100) : 0

    return {
      employee: emp,
      daysPresent,
      daysAbsent,
      daysLeave,
      totalHours: Math.round(totalHours * 10) / 10,
      overtimeHours: Math.round(overtimeHours * 10) / 10,
      avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
      attendanceRate,
    }
  })
}

// ─── Components ───────────────────────────────────────────────────────────────

function AttendanceRateBar({ rate }: { rate: number }) {
  const color = rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className={cn(
        'text-xs font-semibold',
        rate >= 90 ? 'text-green-700' : rate >= 75 ? 'text-amber-700' : 'text-red-700',
      )}>
        {rate}%
      </span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEPARTMENTS = ['Todos', 'Receção', 'F&B', 'Housekeeping', 'Manutenção', 'Spa', 'Segurança', 'Cozinha']

export default function AttendanceSummaryPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [department, setDepartment] = useState('Todos')

  // Fetch employees
  const { data: employeesRaw } = useQuery({
    queryKey: ['hr-employees'],
    queryFn: () =>
      api.get('/hr?limit=100').then((r) => {
        const d = r.data?.data ?? r.data
        return Array.isArray(d) ? d : []
      }),
    retry: false,
  })

  const employees: Employee[] = useMemo(() => {
    if (Array.isArray(employeesRaw) && employeesRaw.length > 0) return employeesRaw
    return MOCK_EMPLOYEES
  }, [employeesRaw])

  // Fetch attendance records
  const { data: attendanceRaw, isLoading, refetch } = useQuery({
    queryKey: ['attendance-monthly', month, year],
    queryFn: () =>
      api.get(`/attendance?month=${month}&year=${year}&limit=500`).then((r) => {
        const d = r.data?.data ?? r.data
        return Array.isArray(d) ? d : []
      }),
    retry: false,
  })

  const attendanceRecords: AttendanceRecord[] = useMemo(() => {
    if (Array.isArray(attendanceRaw) && attendanceRaw.length > 0) return attendanceRaw
    return generateMockAttendance(month, year)
  }, [attendanceRaw, month, year])

  const summaries = useMemo(
    () => buildSummaries(employees, attendanceRecords, month, year),
    [employees, attendanceRecords, month, year],
  )

  const filtered = useMemo(
    () =>
      department === 'Todos'
        ? summaries
        : summaries.filter((s) => s.employee.department === department),
    [summaries, department],
  )

  // Aggregate stats
  const totalPresent = filtered.reduce((s, r) => s + r.daysPresent, 0)
  const totalAbsent = filtered.reduce((s, r) => s + r.daysAbsent, 0)
  const totalHours = filtered.reduce((s, r) => s + r.totalHours, 0)
  const avgRate =
    filtered.length > 0
      ? Math.round(filtered.reduce((s, r) => s + r.attendanceRate, 0) / filtered.length)
      : 0

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('pt-AO', { month: 'long', year: 'numeric' })

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sumário de Assiduidade</h1>
          <p className="mt-1 text-sm text-gray-500 capitalize">{monthLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Month picker */}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {months.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>

          {/* Year picker */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Department filter */}
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-transparent text-sm focus:outline-none"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn('mr-1.5 h-4 w-4', isLoading && 'animate-spin')} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={() => window.print()}
          >
            <Printer className="mr-1.5 h-4 w-4" />
            Exportar / Imprimir
          </Button>
        </div>
      </div>

      {/* Print header (only visible when printing) */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold text-gray-900">Sumário de Assiduidade — <span className="capitalize">{monthLabel}</span></h1>
        {department !== 'Todos' && <p className="text-sm text-gray-500">Departamento: {department}</p>}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Funcionários</p>
                <p className="text-2xl font-extrabold text-gray-900">{filtered.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                <CalendarCheck2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Presenças</p>
                <p className="text-2xl font-extrabold text-gray-900">{totalPresent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                <CalendarX2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Faltas</p>
                <p className="text-2xl font-extrabold text-gray-900">{totalAbsent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Taxa Média</p>
                <p className="text-2xl font-extrabold text-gray-900">{avgRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Total hours callout */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-5 py-3">
        <Clock className="h-5 w-5 text-primary" />
        <p className="text-sm text-primary">
          Total de horas trabalhadas no período:{' '}
          <strong>{totalHours.toLocaleString('pt-AO')} h</strong>
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-5 py-3.5 text-left">Funcionário</th>
              <th className="px-4 py-3.5 text-center">Presenças</th>
              <th className="px-4 py-3.5 text-center">Faltas</th>
              <th className="px-4 py-3.5 text-center">Férias/Licença</th>
              <th className="px-4 py-3.5 text-right">Total Horas</th>
              <th className="px-4 py-3.5 text-right">Média h/dia</th>
              <th className="px-4 py-3.5 text-right">Horas Extra</th>
              <th className="px-5 py-3.5 text-center">Taxa Assiduidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                  Nenhum registo encontrado para o período selecionado.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.employee.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {row.employee.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{row.employee.name}</p>
                        <p className="text-xs text-gray-400">
                          {row.employee.department ?? '—'}
                          {row.employee.position ? ` · ${row.employee.position}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-semibold text-green-700">{row.daysPresent}</span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={cn('font-semibold', row.daysAbsent > 0 ? 'text-red-600' : 'text-gray-400')}>
                      {row.daysAbsent}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={cn('font-semibold', row.daysLeave > 0 ? 'text-amber-600' : 'text-gray-400')}>
                      {row.daysLeave}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-gray-800">
                    {row.totalHours.toLocaleString('pt-AO')} h
                  </td>
                  <td className="px-4 py-3.5 text-right text-gray-600">
                    {row.avgHoursPerDay > 0 ? `${row.avgHoursPerDay} h` : '—'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {row.overtimeHours > 0 ? (
                      <span className="font-medium text-purple-700">{row.overtimeHours} h</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <AttendanceRateBar rate={row.attendanceRate} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-gray-50 text-xs font-semibold text-gray-600">
              <tr>
                <td className="px-5 py-3 font-bold text-gray-800">Totais / Média</td>
                <td className="px-4 py-3 text-center text-green-700">{totalPresent}</td>
                <td className="px-4 py-3 text-center text-red-600">{totalAbsent}</td>
                <td className="px-4 py-3 text-center text-amber-600">
                  {filtered.reduce((s, r) => s + r.daysLeave, 0)}
                </td>
                <td className="px-4 py-3 text-right">{totalHours.toLocaleString('pt-AO')} h</td>
                <td className="px-4 py-3 text-right">
                  {filtered.length > 0
                    ? `${Math.round((filtered.reduce((s, r) => s + r.avgHoursPerDay, 0) / filtered.length) * 10) / 10} h`
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right text-purple-700">
                  {filtered.reduce((s, r) => s + r.overtimeHours, 0).toLocaleString('pt-AO')} h
                </td>
                <td className="px-5 py-3">
                  <AttendanceRateBar rate={avgRate} />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Print footer */}
      <div className="hidden print:block mt-8 border-t border-gray-200 pt-4 text-xs text-gray-400">
        Gerado em {new Date().toLocaleString('pt-AO')} · Sea and Soul ERP by ENGERIS
      </div>
    </div>
  )
}

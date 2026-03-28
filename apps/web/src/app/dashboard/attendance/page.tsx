'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Users, Clock, TrendingUp, AlertCircle, LayoutList, Table2, Plus } from 'lucide-react'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

// ─── Types ───────────────────────────────────────────────────────────────────

type AttendanceType = 'ENTRY' | 'EXIT' | 'BREAK_START' | 'BREAK_END'

interface AttendanceRecord {
  id: string
  type: AttendanceType
  createdAt: string
  validGps: boolean
  employee?: {
    id: string
    name: string
    department: string
    avatar?: string
  }
  checkIn?: string
  checkOut?: string
  hoursWorked?: number
}

interface DailySummary {
  employeeId: string
  employeeName: string
  department: string
  checkIn?: string
  checkOut?: string
  hoursWorked?: number
  present: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<AttendanceType, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Saída',
  BREAK_START: 'Início Pausa',
  BREAK_END: 'Fim Pausa',
}

const TYPE_VARIANT: Record<AttendanceType, 'info' | 'default' | 'warning' | 'success'> = {
  ENTRY: 'info',
  EXIT: 'default',
  BREAK_START: 'warning',
  BREAK_END: 'success',
}

const DEPARTMENTS = [
  'Receção',
  'Restauração',
  'Limpeza',
  'Manutenção',
  'Segurança',
  'Cozinha',
  'Spa',
  'Administração',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toInputDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatHours(h?: number): string {
  if (h == null) return '—'
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return `${hrs}h${mins > 0 ? `${mins.toString().padStart(2, '0')}m` : ''}`
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

// ─── Timeline Entry ───────────────────────────────────────────────────────────

function TimelineEntry({ record }: { record: AttendanceRecord }) {
  const colors: Record<AttendanceType, string> = {
    ENTRY: 'bg-primary border-primary',
    EXIT: 'bg-gray-400 border-gray-400',
    BREAK_START: 'bg-amber-400 border-amber-400',
    BREAK_END: 'bg-green-500 border-green-500',
  }
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${colors[record.type]}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {record.employee?.name ?? '—'}
          </p>
          <span className="text-xs text-gray-400 shrink-0">
            {formatDateTime(record.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-500">{record.employee?.department ?? '—'}</span>
          <Badge variant={TYPE_VARIANT[record.type]}>
            {TYPE_LABEL[record.type]}
          </Badge>
          {!record.validGps && (
            <Badge variant="warning">GPS Fora</Badge>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<string>(toInputDate(new Date()))
  const [department, setDepartment] = useState('')
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', selectedDate, department],
    queryFn: () =>
      api.get('/attendance', {
        params: {
          date: selectedDate,
          department: department || undefined,
          limit: 100,
        },
      }).then((r) => r.data),
  })

  const records: AttendanceRecord[] = data?.data ?? []

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (data?.stats) return data.stats

    // Group by employee to build daily summaries
    const byEmployee: Record<string, { records: AttendanceRecord[]; name: string; dept: string }> = {}
    records.forEach((r) => {
      const id = r.employee?.id ?? r.id
      if (!byEmployee[id]) {
        byEmployee[id] = { records: [], name: r.employee?.name ?? '—', dept: r.employee?.department ?? '—' }
      }
      byEmployee[id].records.push(r)
    })

    const employees = Object.values(byEmployee)
    const present = employees.filter((e) => e.records.some((r) => r.type === 'ENTRY')).length
    const totalEmployees = data?.totalEmployees ?? present + Math.max(0, 2) // fallback
    const absent = Math.max(0, totalEmployees - present)
    const hoursArr = records
      .filter((r) => r.hoursWorked != null)
      .map((r) => r.hoursWorked!)
    const avgHours = hoursArr.length > 0 ? hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length : 0
    const attendance = totalEmployees > 0 ? Math.round((present / totalEmployees) * 100) : 0

    return { present, absent, avgHours, attendance }
  }, [data, records])

  // ── Daily summaries (for table view) ──────────────────────────────────────

  const dailySummaries = useMemo((): DailySummary[] => {
    if (data?.summaries) return data.summaries

    const map: Record<string, DailySummary> = {}
    records.forEach((r) => {
      const id = r.employee?.id ?? r.id
      if (!map[id]) {
        map[id] = {
          employeeId: id,
          employeeName: r.employee?.name ?? '—',
          department: r.employee?.department ?? '—',
          present: false,
        }
      }
      if (r.type === 'ENTRY') {
        map[id].checkIn = r.createdAt
        map[id].present = true
      }
      if (r.type === 'EXIT') {
        map[id].checkOut = r.createdAt
      }
      if (r.hoursWorked != null) {
        map[id].hoursWorked = r.hoursWorked
      }
    })
    return Object.values(map)
  }, [data, records])

  // ── Missing entries ────────────────────────────────────────────────────────

  const missingEntries = useMemo((): string[] => {
    if (data?.missingEntries) return data.missingEntries
    return []
  }, [data])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assiduidade</h1>
          <p className="mt-0.5 text-sm text-gray-500">Controlo de presenças e pontualidade</p>
        </div>
        <Link href="/dashboard/attendance/new">
          <Button size="sm">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Registar Ponto
          </Button>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Presentes Hoje"
          value={stats.present ?? 0}
          icon={<Users size={22} />}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="Ausentes"
          value={stats.absent ?? 0}
          icon={<AlertCircle size={22} />}
          className="border-l-4 border-l-red-500"
        />
        <StatCard
          title="Média Horas/Dia"
          value={formatHours(stats.avgHours)}
          icon={<Clock size={22} />}
          className="border-l-4 border-l-primary"
        />
        <StatCard
          title="% Assiduidade"
          value={`${stats.attendance ?? 0}%`}
          icon={<TrendingUp size={22} />}
          className="border-l-4 border-l-amber-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Date filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 shrink-0">Data:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={() => setSelectedDate(toInputDate(new Date()))}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Hoje
          </button>
        </div>

        {/* Department filter */}
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Todos os departamentos</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* View mode toggle */}
        <div className="ml-auto flex items-center rounded-md border border-gray-200 bg-white">
          <button
            onClick={() => setViewMode('table')}
            className={`flex h-9 items-center gap-1.5 rounded-l-md px-3 text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            Tabela
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex h-9 items-center gap-1.5 rounded-r-md border-l border-gray-200 px-3 text-sm font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Linha de Tempo
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <span className="text-sm">A carregar registos...</span>
          </div>
        </div>
      )}

      {/* Table view */}
      {!isLoading && viewMode === 'table' && (
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead className="text-center">Horas</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailySummaries.map((s) => (
                <TableRow key={s.employeeId}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(s.employeeName)}
                      </div>
                      <span className="font-medium text-gray-900">{s.employeeName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{s.department}</TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {s.checkIn ? formatDateTime(s.checkIn) : <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {s.checkOut ? formatDateTime(s.checkOut) : <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex h-6 items-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">
                      {formatHours(s.hoursWorked)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {s.checkIn && s.checkOut ? (
                      <Badge variant="default">Completo</Badge>
                    ) : s.checkIn ? (
                      <Badge variant="info">Em serviço</Badge>
                    ) : (
                      <Badge variant="warning">Sem entrada</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.present ? (
                      <Badge variant="success">Presente</Badge>
                    ) : (
                      <Badge variant="danger">Ausente</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}

              {dailySummaries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-gray-400">
                    Sem registos para os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Timeline view */}
      {!isLoading && viewMode === 'timeline' && (
        <Card>
          {records.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-gray-400">
              Sem registos de ponto para este dia.
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <TimelineEntry key={record.id} record={record} />
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Missing entries */}
      {!isLoading && missingEntries.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-gray-700">
              Colaboradores sem registo de entrada hoje ({missingEntries.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingEntries.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200"
              >
                {name}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

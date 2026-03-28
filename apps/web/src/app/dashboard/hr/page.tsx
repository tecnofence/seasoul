'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { StatCard } from '@/components/ui/stat-card'
import {
  Users,
  UserCheck,
  Building2,
  Banknote,
  Search,
  Phone,
  Mail,
  Plus,
  Eye,
} from 'lucide-react'

const DEPARTMENTS = [
  { key: '', label: 'Todos' },
  { key: 'RECEPCAO', label: 'Receção' },
  { key: 'FB', label: 'F&B' },
  { key: 'HOUSEKEEPING', label: 'Housekeeping' },
  { key: 'MANUTENCAO', label: 'Manutenção' },
  { key: 'SEGURANCA', label: 'Segurança' },
  { key: 'ADMIN', label: 'Admin' },
]

const DEPARTMENT_LABELS: Record<string, string> = {
  RECEPCAO: 'Receção',
  FB: 'F&B',
  HOUSEKEEPING: 'Housekeeping',
  MANUTENCAO: 'Manutenção',
  SEGURANCA: 'Segurança',
  ADMIN: 'Admin',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

interface Employee {
  id: string
  name: string
  role: string
  department: string
  phone?: string
  email?: string
  active: boolean
  baseSalary: number | string
}

interface StatsData {
  total: number
  active: number
  departments: number
  monthlyPayroll: number | string
}

export default function HrPage() {
  const [department, setDepartment] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['employees', department, search],
    queryFn: () =>
      api
        .get('/hr', {
          params: {
            limit: 50,
            department: department || undefined,
            search: search || undefined,
          },
        })
        .then((r) => r.data),
  })

  const { data: statsData } = useQuery({
    queryKey: ['employees-stats'],
    queryFn: () => api.get('/hr/stats').then((r) => r.data),
  })

  const employees: Employee[] = data?.data ?? []
  const stats: StatsData = statsData?.data ?? {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recursos Humanos</h1>
          <p className="mt-1 text-sm text-gray-500">Gestão de colaboradores e equipas</p>
        </div>
        <Link href="/dashboard/hr/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Colaborador
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Colaboradores"
          value={stats.total ?? '—'}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Ativos"
          value={stats.active ?? '—'}
          icon={<UserCheck className="h-5 w-5" />}
        />
        <StatCard
          title="Departamentos"
          value={stats.departments ?? '—'}
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          title="Folha Salarial/Mês"
          value={stats.monthlyPayroll ? formatKwanza(stats.monthlyPayroll) : '—'}
          icon={<Banknote className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Department tabs */}
        <div className="flex flex-wrap gap-2">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.key}
              onClick={() => setDepartment(dept.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                department === dept.key
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Pesquisar colaborador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 sm:w-72"
          />
        </div>
      </div>

      {/* Employee Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <Card className="flex h-40 items-center justify-center">
          <div className="text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Nenhum colaborador encontrado</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {employees.map((emp) => (
            <Card key={emp.id} className="flex flex-col gap-4 p-4 transition-shadow hover:shadow-md">
              {/* Top row: avatar + name + department */}
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {getInitials(emp.name)}
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900">{emp.name}</p>
                  <p className="truncate text-xs text-gray-500">{emp.role}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {emp.department && (
                      <Badge variant="default" className="text-xs">
                        {DEPARTMENT_LABELS[emp.department] ?? emp.department}
                      </Badge>
                    )}
                    {!emp.active && (
                      <Badge variant="danger" className="text-xs">
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-1">
                {emp.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{emp.phone}</span>
                  </div>
                )}
                {emp.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <Link href={`/dashboard/hr/${emp.id}`} className="mt-auto">
                <Button variant="outline" size="sm" className="w-full">
                  <Eye className="mr-2 h-3 w-3" />
                  Ver
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

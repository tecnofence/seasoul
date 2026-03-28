'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'
import { formatKwanza, formatDate, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Pencil,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  FileX,
  Banknote,
  Clock,
  AlertCircle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Zod schema for edit form
// ---------------------------------------------------------------------------

const editSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  position: z.string().min(1, 'Cargo obrigatório'),
  department: z.string().min(1, 'Departamento obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  baseSalary: z.coerce.number().positive('Salário deve ser positivo'),
})

type EditFormData = z.infer<typeof editSchema>

const DEPARTMENTS = [
  'RECEÇÃO',
  'COZINHA',
  'BAR',
  'HOUSEKEEPING',
  'SPA',
  'SEGURANÇA',
  'MANUTENÇÃO',
  'ADMINISTRAÇÃO',
  'JARDINAGEM',
  'EVENTOS',
  'VENDAS',
  'FINANCEIRO',
  'TI',
]

const PAYROLL_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  PAID: 'success',
  PENDING: 'warning',
  PROCESSING: 'info' as any,
  CANCELLED: 'danger',
}

const PAYROLL_STATUS_LABEL: Record<string, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  PROCESSING: 'Em Processamento',
  CANCELLED: 'Cancelado',
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [serverError, setServerError] = useState('')

  // Main employee data
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/hr/${id}`).then((r) => r.data.data),
  })

  // Attendance last 30 days
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', id],
    queryFn: () =>
      api.get(`/attendance?employeeId=${id}&limit=30`).then((r) => r.data.data ?? r.data),
    enabled: !!id,
  })

  // Recent payroll (last 3)
  const { data: payrollData } = useQuery({
    queryKey: ['payroll', id],
    queryFn: () =>
      api.get(`/payroll?employeeId=${id}&limit=3`).then((r) => r.data.data ?? r.data),
    enabled: !!id,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  })

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) => api.patch(`/hr/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] })
      setEditOpen(false)
      setServerError('')
    },
    onError: (err: any) =>
      setServerError(err.response?.data?.error || 'Erro ao actualizar colaborador.'),
  })

  const openEdit = () => {
    if (employee) {
      reset({
        name: employee.name ?? '',
        position: employee.position ?? employee.role ?? '',
        department: employee.department ?? '',
        phone: employee.phone ?? '',
        email: employee.email ?? '',
        baseSalary: parseFloat(employee.baseSalary ?? employee.salary ?? 0),
      })
    }
    setEditOpen(true)
    setServerError('')
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        A carregar colaborador...
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Colaborador não encontrado.
      </div>
    )
  }

  // Attendance stats
  const attendanceList: any[] = Array.isArray(attendanceData)
    ? attendanceData
    : (attendanceData?.items ?? [])
  const totalShifts = attendanceList.length
  const avgHours =
    totalShifts > 0
      ? (
          attendanceList.reduce((acc: number, a: any) => acc + parseFloat(a.hoursWorked ?? 0), 0) /
          totalShifts
        ).toFixed(1)
      : '—'
  const absences = attendanceList.filter((a: any) => a.status === 'ABSENT').length

  // Payroll list
  const payrollList: any[] = Array.isArray(payrollData)
    ? payrollData
    : (payrollData?.items ?? [])

  // Salary calc (estimated)
  const baseSalary = parseFloat(employee.baseSalary ?? employee.salary ?? 0)
  const benefits = parseFloat(employee.benefits ?? employee.allowances ?? 0)
  const IRT_ESTIMATE = 0.14 // rough withholding placeholder
  const netSalary = (baseSalary + benefits) * (1 - IRT_ESTIMATE)

  // Initials
  const initials = (employee.name ?? '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0].toUpperCase())
    .join('')

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 text-2xl font-bold text-gray-900">{employee.name}</h1>
        {employee.department && (
          <Badge variant="info" className="px-3 py-1 text-sm">
            {employee.department}
          </Badge>
        )}
        <Badge variant={employee.active ? 'success' : 'danger'} className="px-3 py-1 text-sm">
          {employee.active ? 'Activo' : 'Inactivo'}
        </Badge>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column layout                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---- LEFT COLUMN ---- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile card */}
          <Card>
            <CardTitle className="mb-4">Perfil do Colaborador</CardTitle>
            <CardContent>
              <div className="flex flex-wrap items-start gap-6">
                {/* Avatar */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                  {initials}
                </div>

                {/* Details */}
                <dl className="grid flex-1 grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                  <InfoRow
                    icon={<span className="mr-1 text-gray-400">👤</span>}
                    label="Nome completo"
                    value={employee.name}
                    strong
                  />
                  <InfoRow label="Cargo / Função" value={employee.position ?? employee.role} />
                  <InfoRow label="Departamento" value={employee.department} />
                  <div>
                    <dt className="flex items-center gap-1 text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      Data de contratação
                    </dt>
                    <dd className="font-medium text-gray-800">
                      {employee.hireDate ?? employee.startDate
                        ? formatDate(employee.hireDate ?? employee.startDate)
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-gray-500">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </dt>
                    <dd className="text-gray-800">{employee.email ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-gray-500">
                      <Phone className="h-3.5 w-3.5" />
                      Telefone
                    </dt>
                    <dd className="text-gray-800">{employee.phone ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-gray-500">
                      <CreditCard className="h-3.5 w-3.5" />
                      Nº Documento
                    </dt>
                    <dd className="text-gray-800">
                      {employee.documentNumber ?? employee.nif ?? '—'}
                    </dd>
                  </div>
                  <InfoRow label="Resort" value={employee.resort?.name} />
                </dl>
              </div>
            </CardContent>
          </Card>

          {/* Edit form (collapsible) */}
          <Card>
            <div className="flex items-center justify-between">
              <CardTitle>Editar Colaborador</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => (editOpen ? setEditOpen(false) : openEdit())}
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                {editOpen ? (
                  <>
                    Fechar
                    <ChevronUp className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Editar
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {editOpen && (
              <CardContent className="mt-5">
                <form
                  onSubmit={handleSubmit((data) => updateMutation.mutate(data))}
                  className="space-y-4"
                >
                  {serverError && (
                    <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
                      {serverError}
                    </p>
                  )}

                  {/* Name */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Nome completo
                    </label>
                    <input
                      {...register('name')}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Position */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Cargo</label>
                      <input
                        {...register('position')}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                      {errors.position && (
                        <p className="mt-1 text-xs text-red-500">{errors.position.message}</p>
                      )}
                    </div>

                    {/* Department */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Departamento
                      </label>
                      <select
                        {...register('department')}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      {errors.department && (
                        <p className="mt-1 text-xs text-red-500">{errors.department.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Phone */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Telefone</label>
                      <input
                        {...register('phone')}
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                        placeholder="+244 9xx xxx xxx"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                      <input
                        {...register('email')}
                        type="email"
                        className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Salary */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Salário Base (AOA)
                    </label>
                    <input
                      {...register('baseSalary')}
                      type="number"
                      min={0}
                      step="0.01"
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    {errors.baseSalary && (
                      <p className="mt-1 text-xs text-red-500">{errors.baseSalary.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'A guardar...' : 'Guardar Alterações'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditOpen(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          {/* Documents */}
          <Card>
            <CardTitle className="mb-4">Documentos</CardTitle>
            <CardContent>
              {employee.documents?.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {employee.documents.map((doc: any) => (
                    <li key={doc.id} className="flex items-center gap-3 py-2.5 text-sm">
                      <FileX className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="flex-1 text-gray-800">{doc.name ?? doc.type}</span>
                      {doc.url && (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          Ver
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-gray-400">
                  <FileX className="h-8 w-8" />
                  <p className="text-sm">Sem documentos registados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ---- RIGHT COLUMN ---- */}
        <div className="space-y-6">
          {/* Salary card */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Remuneração
            </CardTitle>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Salário base</span>
                <span className="font-medium text-gray-900">{formatKwanza(baseSalary)}</span>
              </div>
              {benefits > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Subsídios / benefícios</span>
                  <span className="font-medium text-gray-900">{formatKwanza(benefits)}</span>
                </div>
              )}
              <div className="my-1 border-t border-gray-100" />
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">IRT estimado (14%)</span>
                <span className="text-gray-400 text-xs">
                  − {formatKwanza((baseSalary + benefits) * IRT_ESTIMATE)}
                </span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span className="text-gray-900">Salário líquido estimado</span>
                <span className="text-primary">{formatKwanza(netSalary)}</span>
              </div>
              <p className="text-xs text-gray-400">* Estimativa. Valores exactos no processamento salarial.</p>
            </CardContent>
          </Card>

          {/* Attendance summary */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Assiduidade (últimos 30 dias)
            </CardTitle>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 text-center">
                <StatBox label="Turnos" value={String(totalShifts)} />
                <StatBox label="Média h/dia" value={String(avgHours)} />
                <StatBox label="Faltas" value={String(absences)} danger={absences > 2} />
              </div>
            </CardContent>
          </Card>

          {/* Recent payroll */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Processamento Salarial Recente
            </CardTitle>
            <CardContent>
              {payrollList.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {payrollList.map((p: any) => (
                    <li key={p.id} className="py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          {p.month
                            ? new Date(p.month).toLocaleDateString('pt-AO', {
                                month: 'long',
                                year: 'numeric',
                              })
                            : p.period ?? '—'}
                        </span>
                        <Badge
                          variant={PAYROLL_STATUS_VARIANT[p.status] ?? 'default'}
                        >
                          {PAYROLL_STATUS_LABEL[p.status] ?? p.status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-primary font-semibold">
                        {formatKwanza(p.netAmount ?? p.amount)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-gray-400">
                  <AlertCircle className="h-7 w-7" />
                  <p className="text-sm">Sem registos de processamento</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Local helpers
// ---------------------------------------------------------------------------

function InfoRow({
  label,
  value,
  icon,
  strong,
}: {
  label: string
  value?: string | null
  icon?: React.ReactNode
  strong?: boolean
}) {
  return (
    <div>
      <dt className="flex items-center text-gray-500">
        {icon}
        {label}
      </dt>
      <dd className={strong ? 'font-semibold text-gray-900' : 'text-gray-800'}>{value ?? '—'}</dd>
    </div>
  )
}

function StatBox({
  label,
  value,
  danger,
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div className="rounded-lg bg-gray-50 px-2 py-3">
      <p className={`text-xl font-bold ${danger ? 'text-red-600' : 'text-primary'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  )
}

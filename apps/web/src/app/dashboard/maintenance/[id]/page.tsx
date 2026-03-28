'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import {
  ArrowLeft,
  Wrench,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Clock,
  User,
  CalendarClock,
  ChevronRight,
  UserCheck,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type TicketPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW'
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

const PRIORITY_VARIANT: Record<TicketPriority, 'danger' | 'warning' | 'info' | 'default'> = {
  URGENT: 'danger',
  HIGH: 'warning',
  NORMAL: 'info',
  LOW: 'default',
}

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  URGENT: 'Urgente',
  HIGH: 'Alta',
  NORMAL: 'Normal',
  LOW: 'Baixa',
}

const PRIORITY_EMOJI: Record<TicketPriority, string> = {
  URGENT: '🔴',
  HIGH: '🟠',
  NORMAL: '🟡',
  LOW: '🟢',
}

const STATUS_VARIANT: Record<TicketStatus, 'danger' | 'warning' | 'success' | 'default'> = {
  OPEN: 'danger',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
}

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: 'Aberto',
  IN_PROGRESS: 'Em Progresso',
  RESOLVED: 'Resolvido',
  CLOSED: 'Fechado',
}

const TICKET_TYPE_EMOJI: Record<string, string> = {
  ELECTRICAL: '⚡',
  PLUMBING: '🔧',
  HVAC: '❄️',
  CLEANING: '🧹',
  CARPENTRY: '🪵',
  PAINTING: '🎨',
  APPLIANCE: '📺',
  SECURITY: '🔒',
  LANDSCAPING: '🌿',
  OTHER: '🛠️',
}

// ---------------------------------------------------------------------------
// Timeline component
// ---------------------------------------------------------------------------

const STATUS_STEPS: { key: TicketStatus; label: string }[] = [
  { key: 'OPEN', label: 'Aberto' },
  { key: 'IN_PROGRESS', label: 'Em Progresso' },
  { key: 'RESOLVED', label: 'Resolvido' },
  { key: 'CLOSED', label: 'Fechado' },
]

function StatusHistory({ current }: { current: TicketStatus }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === current)
  return (
    <div className="space-y-3">
      {STATUS_STEPS.map((step, idx) => {
        const done = idx < currentIdx
        const active = idx === currentIdx
        const future = idx > currentIdx
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 ${
                active
                  ? 'border-primary bg-primary text-white'
                  : done
                  ? 'border-primary/50 bg-primary/10 text-primary'
                  : 'border-gray-200 bg-white text-gray-300'
              }`}
            >
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
            </div>
            <div className="flex flex-1 items-center justify-between">
              <span
                className={`text-sm ${
                  active ? 'font-semibold text-primary' : done ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
              {active && (
                <Badge variant={STATUS_VARIANT[step.key]} className="text-xs">
                  Actual
                </Badge>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [resolutionNotes, setResolutionNotes] = useState('')
  const [techNotes, setTechNotes] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | ''>('')
  const [selectedEmployee, setSelectedEmployee] = useState('')

  // Main ticket
  const { data: ticket, isLoading } = useQuery({
    queryKey: ['maintenance', id],
    queryFn: () => api.get(`/maintenance/${id}`).then((r) => r.data.data),
  })

  // Employees for assign dropdown
  const { data: employeesData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => api.get('/hr?limit=50').then((r) => r.data.data ?? r.data),
  })

  const employees: any[] = Array.isArray(employeesData)
    ? employeesData
    : (employeesData?.items ?? [])

  // ---- Mutations ----

  const assumeMutation = useMutation({
    mutationFn: () => api.patch(`/maintenance/${id}`, { status: 'IN_PROGRESS' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  })

  const resolveMutation = useMutation({
    mutationFn: () =>
      api.patch(`/maintenance/${id}`, {
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString(),
        notes: resolutionNotes,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  })

  const reopenMutation = useMutation({
    mutationFn: () => api.patch(`/maintenance/${id}`, { status: 'OPEN' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  })

  const priorityMutation = useMutation({
    mutationFn: (priority: TicketPriority) =>
      api.patch(`/maintenance/${id}`, { priority }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  })

  const assignMutation = useMutation({
    mutationFn: (assignedTo: string) =>
      api.patch(`/maintenance/${id}`, { assignedTo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance', id] }),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        A carregar ticket...
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Ticket não encontrado.
      </div>
    )
  }

  const priority: TicketPriority = ticket.priority ?? 'NORMAL'
  const status: TicketStatus = ticket.status ?? 'OPEN'
  const typeEmoji = TICKET_TYPE_EMOJI[ticket.type ?? 'OTHER'] ?? '🛠️'

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap items-start gap-3">
        <button
          onClick={() => router.back()}
          className="mt-0.5 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 min-w-0">
          <p className="truncate text-2xl font-bold text-gray-900">
            {ticket.title ?? ticket.description ?? 'Ticket de Manutenção'}
          </p>
          {ticket.description && ticket.title && (
            <p className="mt-0.5 truncate text-sm text-gray-500">{ticket.description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge
            variant={PRIORITY_VARIANT[priority] ?? 'default'}
            className="px-3 py-1 text-sm"
          >
            {PRIORITY_EMOJI[priority]} {PRIORITY_LABEL[priority] ?? priority}
          </Badge>
          <Badge
            variant={STATUS_VARIANT[status] ?? 'default'}
            className="px-3 py-1 text-sm"
          >
            {STATUS_LABEL[status] ?? status}
          </Badge>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Two-column layout                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---- LEFT COLUMN ---- */}
        <div className="space-y-6 lg:col-span-2">
          {/* Ticket details */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Detalhes do Ticket
            </CardTitle>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-gray-500">Tipo</dt>
                  <dd className="font-medium text-gray-900">
                    {typeEmoji}{' '}
                    {ticket.type
                      ? ticket.type.charAt(0) + ticket.type.slice(1).toLowerCase()
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-gray-500">
                    <MapPin className="h-3.5 w-3.5" />
                    Local / Quarto
                  </dt>
                  <dd className="font-medium text-gray-900">
                    {ticket.room
                      ? `Quarto #${ticket.room.number}`
                      : ticket.location ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-gray-500">
                    <User className="h-3.5 w-3.5" />
                    Reportado por
                  </dt>
                  <dd className="text-gray-800">
                    {ticket.reportedBy?.name ?? ticket.reportedByName ?? '—'}
                  </dd>
                </div>
                {ticket.assignedTo && (
                  <div>
                    <dt className="flex items-center gap-1 text-gray-500">
                      <UserCheck className="h-3.5 w-3.5" />
                      Atribuído a
                    </dt>
                    <dd className="font-medium text-gray-800">
                      {ticket.assignedTo?.name ?? ticket.assignedToName ?? ticket.assignedTo}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="flex items-center gap-1 text-gray-500">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Criado em
                  </dt>
                  <dd className="text-gray-800">{formatDateTime(ticket.createdAt)}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    Atualizado em
                  </dt>
                  <dd className="text-gray-800">{formatDateTime(ticket.updatedAt)}</dd>
                </div>
              </dl>

              {ticket.description && (
                <div className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm">
                  <p className="mb-1 font-medium text-gray-500">Descrição completa</p>
                  <p className="whitespace-pre-wrap text-gray-700">{ticket.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resolution / Notes */}
          <Card>
            <CardTitle className="mb-4">
              {status === 'RESOLVED' || status === 'CLOSED'
                ? 'Resolução'
                : 'Notas Técnicas'}
            </CardTitle>
            <CardContent>
              {(status === 'RESOLVED' || status === 'CLOSED') ? (
                <div className="space-y-3 text-sm">
                  {ticket.resolvedAt && (
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span>
                        Resolvido em{' '}
                        <strong>{formatDateTime(ticket.resolvedAt)}</strong>
                      </span>
                    </div>
                  )}
                  {ticket.notes ? (
                    <div className="rounded-lg bg-green-50 px-4 py-3 text-green-900">
                      <p className="mb-1 font-medium">Notas de resolução</p>
                      <p className="whitespace-pre-wrap">{ticket.notes}</p>
                    </div>
                  ) : (
                    <p className="text-gray-400">Sem notas de resolução registadas.</p>
                  )}
                </div>
              ) : status === 'IN_PROGRESS' ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Registe notas técnicas sobre o progresso do trabalho.
                  </p>
                  <textarea
                    className="min-h-[100px] w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                    placeholder="Descreva o progresso, materiais utilizados, etc..."
                    value={techNotes}
                    onChange={(e) => setTechNotes(e.target.value)}
                  />
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Ticket ainda não foi assumido. Clique em "Assumir Ticket" para começar.
                </p>
              )}
            </CardContent>
          </Card>

          {/* History timeline */}
          <Card>
            <CardTitle className="mb-4">Histórico de Estado</CardTitle>
            <CardContent>
              <StatusHistory current={status} />
            </CardContent>
          </Card>
        </div>

        {/* ---- RIGHT COLUMN ---- */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardTitle className="mb-4">Ações</CardTitle>
            <CardContent className="space-y-3">
              {/* OPEN → assume */}
              {status === 'OPEN' && (
                <Button
                  className="w-full"
                  onClick={() => assumeMutation.mutate()}
                  disabled={assumeMutation.isPending}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  {assumeMutation.isPending ? 'A processar...' : 'Assumir Ticket'}
                </Button>
              )}

              {/* IN_PROGRESS → resolve */}
              {status === 'IN_PROGRESS' && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Notas de resolução
                    </label>
                    <textarea
                      className="min-h-[80px] w-full resize-y rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                      placeholder="Descreva como o problema foi resolvido..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => resolveMutation.mutate()}
                    disabled={resolveMutation.isPending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {resolveMutation.isPending ? 'A processar...' : 'Marcar como Resolvido'}
                  </Button>
                </div>
              )}

              {/* RESOLVED → show info + reopen */}
              {(status === 'RESOLVED' || status === 'CLOSED') && (
                <div className="space-y-3">
                  <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                    <p className="font-medium">Ticket resolvido</p>
                    {ticket.resolvedAt && (
                      <p className="mt-0.5 text-green-700">
                        {formatDateTime(ticket.resolvedAt)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      if (
                        window.confirm('Tem a certeza que pretende reabrir este ticket?')
                      ) {
                        reopenMutation.mutate()
                      }
                    }}
                    disabled={reopenMutation.isPending}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {reopenMutation.isPending ? 'A processar...' : 'Reabrir Ticket'}
                  </Button>
                </div>
              )}

              {/* Change priority */}
              <div className="border-t border-gray-100 pt-3">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Alterar Prioridade
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                    value={selectedPriority || priority}
                    onChange={(e) => setSelectedPriority(e.target.value as TicketPriority)}
                  >
                    {(Object.keys(PRIORITY_LABEL) as TicketPriority[]).map((p) => (
                      <option key={p} value={p}>
                        {PRIORITY_EMOJI[p]} {PRIORITY_LABEL[p]}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const val = (selectedPriority || priority) as TicketPriority
                      priorityMutation.mutate(val)
                    }}
                    disabled={priorityMutation.isPending}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {priorityMutation.isSuccess && (
                  <p className="mt-1 text-xs text-green-600">Prioridade actualizada.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assign */}
          <Card>
            <CardTitle className="mb-4 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Atribuição
            </CardTitle>
            <CardContent className="space-y-3">
              {ticket.assignedTo && (
                <div className="rounded-lg bg-primary/5 px-3 py-2 text-sm">
                  <span className="text-gray-500">Actualmente atribuído a: </span>
                  <span className="font-medium text-primary">
                    {ticket.assignedTo?.name ?? ticket.assignedToName ?? ticket.assignedTo}
                  </span>
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Atribuir a
                </label>
                <select
                  className="w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                >
                  <option value="">— Seleccionar colaborador —</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                      {emp.department ? ` (${emp.department})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  if (selectedEmployee) assignMutation.mutate(selectedEmployee)
                }}
                disabled={!selectedEmployee || assignMutation.isPending}
              >
                <UserCheck className="mr-2 h-4 w-4" />
                {assignMutation.isPending ? 'A atribuir...' : 'Confirmar Atribuição'}
              </Button>
              {assignMutation.isSuccess && (
                <p className="text-xs text-green-600">Ticket atribuído com sucesso.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

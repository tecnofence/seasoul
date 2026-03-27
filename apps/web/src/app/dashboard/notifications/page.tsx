'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Bell,
  CheckCheck,
  Mail,
  MailOpen,
  Trash2,
  Filter,
  Plus,
  Power,
  PowerOff,
  Pencil,
  X,
  AlertTriangle,
  Package,
  FileText,
  Calendar,
  Wrench,
  ShieldAlert,
  Car,
  Award,
} from 'lucide-react'

// ── Constantes ───────────────────────────────────
type TabKey = 'todas' | 'nao_lidas' | 'alertas'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'nao_lidas', label: 'Não lidas' },
  { key: 'alertas', label: 'Alertas' },
]

const channelLabel: Record<string, string> = {
  SYSTEM: 'Sistema',
  EMAIL: 'Email',
  SMS: 'SMS',
  PUSH: 'Push',
  IN_APP: 'In-App',
}

const moduleLabel: Record<string, string> = {
  contracts: 'Contratos',
  stock: 'Stock',
  invoicing: 'Faturação',
  security: 'Segurança',
  fleet: 'Frota',
  hr: 'RH',
  maintenance: 'Manutenção',
  pms: 'PMS',
}

const alertTypeLabel: Record<string, string> = {
  CONTRACT_EXPIRING_30D: 'Contrato a expirar em 30 dias',
  STOCK_BELOW_MINIMUM: 'Stock abaixo do mínimo',
  INVOICE_OVERDUE: 'Fatura em atraso',
  INCIDENT_HIGH_CRITICAL: 'Incidente HIGH/CRITICAL',
  VEHICLE_MAINTENANCE_DUE: 'Manutenção de veículo pendente',
  CERTIFICATION_EXPIRING: 'Certificação a expirar',
}

const alertChannelOptions = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'push', label: 'Push' },
  { value: 'in_app', label: 'In-App' },
]

const moduleOptions = Object.entries(moduleLabel).map(([value, label]) => ({ value, label }))
const alertTypeOptions = Object.entries(alertTypeLabel).map(([value, label]) => ({ value, label }))

const typeIconMap: Record<string, typeof Bell> = {
  RESERVATION_CONFIRMED: Calendar,
  RESERVATION_REMINDER: Calendar,
  CHECKIN_READY: Calendar,
  PIN_GENERATED: ShieldAlert,
  CHECKOUT_REMINDER: Calendar,
  INVOICE_READY: FileText,
  STOCK_ALERT: Package,
  ATTENDANCE_MISSING: AlertTriangle,
  PAYROLL_PROCESSED: FileText,
  MAINTENANCE_ASSIGNED: Wrench,
  CONTRACT_EXPIRING: FileText,
  VEHICLE_MAINTENANCE_DUE: Car,
  CERTIFICATION_EXPIRING: Award,
  INCIDENT_SEVERITY: ShieldAlert,
}

// ── Componente principal ─────────────────────────
export default function NotificationsPage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabKey>('todas')
  const [moduleFilter, setModuleFilter] = useState<string>('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [editingAlert, setEditingAlert] = useState<any>(null)

  // ── Queries ──────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['notifications-me'],
    queryFn: () => api.get('/notifications/me').then((r) => r.data),
  })

  const { data: alertsData, isLoading: alertsLoading } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: () => api.get('/alerts').then((r) => r.data),
  })

  // ── Mutations ────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-me'] }),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-me'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-me'] }),
  })

  const createAlertMutation = useMutation({
    mutationFn: (data: any) => api.post('/alerts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] })
      setShowAlertForm(false)
      setEditingAlert(null)
    },
  })

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/alerts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] })
      setShowAlertForm(false)
      setEditingAlert(null)
    },
  })

  const deleteAlertMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert-rules'] }),
  })

  const toggleAlertMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/alerts/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alert-rules'] }),
  })

  // ── Dados filtrados ──────────────────────────
  const notifications = data?.data ?? []
  const unread = data?.unread ?? 0
  const alertRules = alertsData?.data ?? []

  const filteredNotifications = notifications.filter((n: any) => {
    if (activeTab === 'nao_lidas' && n.readAt) return false
    if (moduleFilter && n.type) {
      const moduleMap: Record<string, string> = {
        STOCK_ALERT: 'stock',
        INVOICE_READY: 'invoicing',
        MAINTENANCE_ASSIGNED: 'maintenance',
        RESERVATION_CONFIRMED: 'pms',
        RESERVATION_REMINDER: 'pms',
        CHECKIN_READY: 'pms',
        CHECKOUT_REMINDER: 'pms',
        ATTENDANCE_MISSING: 'hr',
        PAYROLL_PROCESSED: 'hr',
      }
      if (moduleMap[n.type] !== moduleFilter) return false
    }
    return true
  })

  // ── Acções em massa ──────────────────────────
  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n: any) => n.id)))
    }
  }

  const handleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleBulkMarkRead = () => {
    selectedIds.forEach((id) => markReadMutation.mutate(id))
    setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteMutation.mutate(id))
    setSelectedIds(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notificações</h1>
          {unread > 0 && (
            <Badge variant="danger">
              {unread} não lida{unread > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {unread > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Marcar Todas como Lidas
          </Button>
        )}
      </div>

      {/* Separadores (Tabs) */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              setSelectedIds(new Set())
            }}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Alertas — Configuração de regras */}
      {activeTab === 'alertas' ? (
        <AlertRulesSection
          alertRules={alertRules}
          isLoading={alertsLoading}
          showForm={showAlertForm}
          editingAlert={editingAlert}
          onShowForm={() => {
            setEditingAlert(null)
            setShowAlertForm(true)
          }}
          onEdit={(alert: any) => {
            setEditingAlert(alert)
            setShowAlertForm(true)
          }}
          onCancelForm={() => {
            setShowAlertForm(false)
            setEditingAlert(null)
          }}
          onSave={(data: any) => {
            if (editingAlert) {
              updateAlertMutation.mutate({ id: editingAlert.id, data })
            } else {
              createAlertMutation.mutate(data)
            }
          }}
          onDelete={(id: string) => deleteAlertMutation.mutate(id)}
          onToggle={(id: string, active: boolean) =>
            toggleAlertMutation.mutate({ id, active })
          }
          isSaving={createAlertMutation.isPending || updateAlertMutation.isPending}
        />
      ) : (
        <>
          {/* Filtros e acções em massa */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="rounded-md border bg-white px-3 py-1.5 text-sm text-gray-700"
              >
                <option value="">Todos os módulos</option>
                {moduleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {selectedIds.size} selecionada{selectedIds.size > 1 ? 's' : ''}
                </span>
                <Button variant="secondary" size="sm" onClick={handleBulkMarkRead}>
                  <CheckCheck className="mr-1 h-3.5 w-3.5" />
                  Marcar como lidas
                </Button>
                <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>

          {/* Lista de notificações */}
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-gray-500">
              A carregar...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Bell className="mb-3 h-12 w-12" />
              <p className="text-lg font-medium">Sem notificações</p>
              <p className="text-sm">
                {activeTab === 'nao_lidas'
                  ? 'Todas as notificações foram lidas!'
                  : 'Está tudo em dia!'}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {/* Selecionar todas */}
              <div className="flex items-center gap-2 px-2">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.size === filteredNotifications.length &&
                    filteredNotifications.length > 0
                  }
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-primary"
                />
                <span className="text-xs text-gray-500">Selecionar todas</span>
              </div>

              {filteredNotifications.map((n: any) => {
                const isRead = !!n.readAt
                const Icon = typeIconMap[n.type] ?? Bell
                return (
                  <Card
                    key={n.id}
                    className={cn(
                      'flex items-start gap-4 transition-colors',
                      !isRead ? 'border-primary/30 bg-primary/5' : '',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(n.id)}
                      onChange={() => handleSelect(n.id)}
                      className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-primary"
                    />
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        !isRead
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-100 text-gray-400',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <h3
                          className={cn(
                            'text-sm',
                            !isRead ? 'font-semibold' : 'font-medium text-gray-600',
                          )}
                        >
                          {n.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            {channelLabel[n.channel] ?? n.channel}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(n.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{n.body ?? n.message}</p>
                    </div>
                    {!isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0"
                        onClick={() => markReadMutation.mutate(n.id)}
                        disabled={markReadMutation.isPending}
                      >
                        Lida
                      </Button>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Secção de Regras de Alertas ──────────────────
function AlertRulesSection({
  alertRules,
  isLoading,
  showForm,
  editingAlert,
  onShowForm,
  onEdit,
  onCancelForm,
  onSave,
  onDelete,
  onToggle,
  isSaving,
}: {
  alertRules: any[]
  isLoading: boolean
  showForm: boolean
  editingAlert: any
  onShowForm: () => void
  onEdit: (alert: any) => void
  onCancelForm: () => void
  onSave: (data: any) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
  isSaving: boolean
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Regras de Alertas</h2>
        {!showForm && (
          <Button variant="primary" size="sm" onClick={onShowForm}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Regra
          </Button>
        )}
      </div>

      {/* Formulário de criação/edição */}
      {showForm && (
        <AlertRuleForm
          initialData={editingAlert}
          onSave={onSave}
          onCancel={onCancelForm}
          isSaving={isSaving}
        />
      )}

      {/* Lista de regras */}
      {isLoading ? (
        <div className="flex h-32 items-center justify-center text-gray-500">
          A carregar...
        </div>
      ) : alertRules.length === 0 && !showForm ? (
        <Card className="flex flex-col items-center justify-center py-12 text-gray-400">
          <AlertTriangle className="mb-3 h-12 w-12" />
          <p className="text-lg font-medium">Sem regras de alertas</p>
          <p className="text-sm">Crie regras para receber alertas automáticos</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {alertRules.map((rule: any) => (
            <Card key={rule.id} className="flex items-center gap-4">
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                  rule.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400',
                )}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{rule.name}</h3>
                  <Badge variant={rule.active ? 'success' : 'default'}>
                    {rule.active ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {moduleLabel[rule.module] ?? rule.module} &middot; {rule.condition}
                  {rule.threshold != null && ` (limiar: ${rule.threshold})`}
                </p>
                <div className="mt-1 flex gap-1">
                  {(rule.channels ?? []).map((ch: string) => (
                    <Badge key={ch} variant="info">
                      {channelLabel[ch.toUpperCase()] ?? ch}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggle(rule.id, !rule.active)}
                  title={rule.active ? 'Desactivar' : 'Activar'}
                >
                  {rule.active ? (
                    <PowerOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Power className="h-4 w-4 text-green-500" />
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEdit(rule)}>
                  <Pencil className="h-4 w-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(rule.id)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Formulário de Regra de Alerta ────────────────
function AlertRuleForm({
  initialData,
  onSave,
  onCancel,
  isSaving,
}: {
  initialData?: any
  onSave: (data: any) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [module, setModule] = useState(initialData?.module ?? '')
  const [alertType, setAlertType] = useState(initialData?.alertType ?? '')
  const [condition, setCondition] = useState(initialData?.condition ?? '')
  const [threshold, setThreshold] = useState<string>(
    initialData?.threshold != null ? String(initialData.threshold) : '',
  )
  const [channels, setChannels] = useState<string[]>(initialData?.channels ?? [])
  const [active, setActive] = useState(initialData?.active ?? true)

  const toggleChannel = (ch: string) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name,
      module,
      ...(alertType ? { alertType } : {}),
      condition,
      ...(threshold !== '' ? { threshold: Number(threshold) } : {}),
      channels,
      active,
    })
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {initialData ? 'Editar Regra' : 'Nova Regra de Alerta'}
          </h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alerta de stock baixo"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Módulo</label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              required
            >
              <option value="">Selecionar módulo</option>
              {moduleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Tipo predefinido (opcional)
            </label>
            <select
              value={alertType}
              onChange={(e) => {
                setAlertType(e.target.value)
                if (e.target.value) {
                  setCondition(alertTypeLabel[e.target.value] ?? '')
                }
              }}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Personalizado</option>
              {alertTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Limiar</label>
            <Input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="Ex: 10"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Condição</label>
            <Input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Descreva a condição do alerta"
              required
            />
          </div>
        </div>

        {/* Canais */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Canais</label>
          <div className="flex flex-wrap gap-2">
            {alertChannelOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleChannel(opt.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm font-medium transition-colors',
                  channels.includes(opt.value)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activa/Inactiva */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary"
          />
          <span className="text-sm text-gray-700">Regra activa</span>
        </div>

        {/* Acções */}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" type="button" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isSaving || !name || !module || !condition || channels.length === 0}
          >
            {isSaving ? 'A guardar...' : initialData ? 'Atualizar' : 'Criar Regra'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

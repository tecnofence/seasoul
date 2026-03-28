'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Webhook, Plus, Trash2, Play, Eye, EyeOff, CheckCircle2,
  XCircle, AlertTriangle, Copy, ExternalLink, RefreshCw,
  Zap, Activity, Clock,
} from 'lucide-react'

// ─── Available event categories ───────────────────────────────────────────────

const EVENT_GROUPS: { label: string; events: string[] }[] = [
  {
    label: 'Reservas',
    events: ['reservation.created', 'reservation.updated', 'reservation.cancelled', 'reservation.checked_in', 'reservation.checked_out'],
  },
  { label: 'Hóspedes', events: ['guest.created', 'guest.updated'] },
  { label: 'Faturação', events: ['invoice.created', 'invoice.cancelled', 'invoice.paid', 'payment.received'] },
  { label: 'Operações', events: ['maintenance.created', 'maintenance.resolved', 'room.status_changed', 'pos.sale_completed'] },
  { label: 'RH', events: ['hr.employee_created'] },
  { label: 'Plataforma', events: ['tenant.plan_changed', 'tenant.expiring_soon'] },
]

// ─── New Webhook Modal ────────────────────────────────────────────────────────

function NewWebhookModal({
  open,
  onClose,
  onSave,
  tenants,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: any) => void
  tenants: any[]
}) {
  const [url, setUrl] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [allEvents, setAllEvents] = useState(false)

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Novo Webhook</h2>
          <p className="text-sm text-gray-500">Configure um endpoint para receber eventos da plataforma</p>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Tenant *</label>
            <select
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
            >
              <option value="">Selecionar tenant...</option>
              {tenants.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">URL do Endpoint *</label>
            <input
              type="url"
              placeholder="https://api.exemplo.com/webhook"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Descrição</label>
            <input
              type="text"
              placeholder="Ex: Integração sistema ERP externo"
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">Eventos *</label>
              <button
                type="button"
                onClick={() => {
                  setAllEvents(!allEvents)
                  setSelectedEvents(allEvents ? [] : ['*'])
                }}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                  allEvents ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {allEvents ? 'Todos selecionados' : 'Selecionar todos'}
              </button>
            </div>
            {!allEvents && (
              <div className="space-y-3 rounded-lg border border-gray-100 p-3">
                {EVENT_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">{group.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.events.map((event) => (
                        <button
                          key={event}
                          type="button"
                          onClick={() => toggleEvent(event)}
                          className={cn(
                            'rounded px-2 py-0.5 text-xs font-medium transition-colors',
                            selectedEvents.includes(event)
                              ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          )}
                        >
                          {event}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => {
              if (!url || !tenantId || (!allEvents && selectedEvents.length === 0)) return
              onSave({ url, tenantId, description, events: allEvents ? ['*'] : selectedEvents, active: true })
              onClose()
            }}
          >
            Criar Webhook
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Delivery Detail Panel ────────────────────────────────────────────────────

function DeliveryPanel({ webhookId, onClose }: { webhookId: string; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['webhook-deliveries', webhookId],
    queryFn: () => api.get(`/admin/webhooks/${webhookId}/deliveries`).then((r) => r.data.data),
  })

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 border-l bg-white shadow-2xl">
      <div className="flex h-16 items-center justify-between border-b px-5">
        <h3 className="font-semibold text-gray-900">Histórico de Entregas</h3>
        <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:text-gray-700">×</button>
      </div>
      <div className="overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-2">
            {(data ?? []).map((d: any) => (
              <div key={d.id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-700">{d.event}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-bold',
                      d.statusCode >= 200 && d.statusCode < 300
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    )}
                  >
                    {d.statusCode}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {d.responseTime}ms
                  </span>
                  <span>{new Date(d.createdAt).toLocaleString('pt-AO')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminWebhooksPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [deliveryPanelId, setDeliveryPanelId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: webhooksData, isLoading } = useQuery({
    queryKey: ['admin-webhooks', filterActive],
    queryFn: () =>
      api.get('/admin/webhooks', {
        params: { active: filterActive === 'all' ? undefined : filterActive === 'active' },
      }).then((r) => r.data),
  })

  const { data: tenantsData } = useQuery({
    queryKey: ['admin-tenants-list'],
    queryFn: () => api.get('/admin/tenants', { params: { limit: 100 } }).then((r) => r.data.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/webhooks', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/admin/webhooks/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-webhooks'] }),
  })

  const pingMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/webhooks/${id}/ping`),
  })

  const webhooks: any[] = webhooksData?.data ?? []
  const total: number = webhooksData?.total ?? 0
  const active = webhooks.filter((w) => w.active).length
  const inactive = webhooks.filter((w) => !w.active).length
  const failing = webhooks.filter((w) => w.lastDeliveryStatus && w.lastDeliveryStatus >= 400).length
  const tenants: any[] = tenantsData ?? []

  const copySecret = (secret: string, id: string) => {
    navigator.clipboard.writeText(secret).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-sm text-gray-500">Gestão de endpoints de integração em tempo real para todos os tenants.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Webhook
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Webhooks" value={total} icon={<Webhook className="h-5 w-5 text-primary" />} />
        <StatCard title="Ativos" value={active} icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} description="A receber eventos" />
        <StatCard title="Inativos" value={inactive} icon={<XCircle className="h-5 w-5 text-gray-400" />} />
        <StatCard
          title="Com Falhas"
          value={failing}
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          description={failing > 0 ? 'Verificar endpoints' : 'Tudo OK'}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterActive(f)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              filterActive === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Inativos'}
          </button>
        ))}
      </div>

      {/* Webhooks list */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 py-20">
          <Webhook className="h-12 w-12 text-gray-300" />
          <div className="text-center">
            <p className="font-medium text-gray-600">Nenhum webhook configurado</p>
            <p className="text-sm text-gray-400">Crie o primeiro webhook para integrar sistemas externos</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Criar Webhook
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((w: any) => (
            <div key={w.id} className={cn('rounded-xl border bg-white p-5 shadow-sm', !w.active && 'opacity-60')}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                {/* Icon + name */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                    w.active ? 'bg-primary/10' : 'bg-gray-100'
                  )}>
                    <Webhook className={cn('h-5 w-5', w.active ? 'text-primary' : 'text-gray-400')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{w.tenant?.name ?? '—'}</span>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        w.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {w.active ? 'Ativo' : 'Inativo'}
                      </span>
                      {w.lastDeliveryStatus >= 400 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Falha ({w.lastDeliveryStatus})
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="truncate font-mono text-xs">{w.url}</span>
                    </div>
                    {w.description && (
                      <p className="mt-0.5 text-xs text-gray-400">{w.description}</p>
                    )}

                    {/* Events */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(w.events ?? []).slice(0, 6).map((e: string) => (
                        <span key={e} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-600">
                          {e}
                        </span>
                      ))}
                      {w.events?.length > 6 && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                          +{w.events.length - 6} mais
                        </span>
                      )}
                    </div>

                    {/* Secret + stats */}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-400">
                      <button
                        onClick={() => copySecret(w.secret ?? '', w.id)}
                        className="flex items-center gap-1 rounded bg-gray-50 px-2 py-0.5 font-mono hover:bg-gray-100 transition-colors"
                        title="Copiar secret"
                      >
                        {copiedId === w.id ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedId === w.id ? 'Copiado!' : 'whsec_••••••••'}
                      </button>
                      {w._count?.deliveries !== undefined && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          {w._count.deliveries} entregas
                        </span>
                      )}
                      {w.lastDeliveryAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Última: {new Date(w.lastDeliveryAt).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => setDeliveryPanelId(w.id)}
                  >
                    <Eye className="h-3.5 w-3.5" /> Entregas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() => pingMutation.mutate(w.id)}
                    disabled={pingMutation.isPending}
                    title="Enviar evento de teste"
                  >
                    <Zap className="h-3.5 w-3.5" /> Ping
                  </Button>
                  <button
                    onClick={() => toggleMutation.mutate({ id: w.id, active: !w.active })}
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
                      w.active ? 'bg-primary' : 'bg-gray-200'
                    )}
                    title={w.active ? 'Desativar' : 'Ativar'}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                        w.active ? 'translate-x-4' : 'translate-x-0'
                      )}
                    />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Eliminar este webhook?')) deleteMutation.mutate(w.id)
                    }}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Eliminar webhook"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals / panels */}
      <NewWebhookModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={(data) => createMutation.mutate(data)}
        tenants={tenants}
      />

      {deliveryPanelId && (
        <DeliveryPanel
          webhookId={deliveryPanelId}
          onClose={() => setDeliveryPanelId(null)}
        />
      )}
    </div>
  )
}

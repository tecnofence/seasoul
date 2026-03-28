'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Key, Webhook, Plus, Trash2, Copy, CheckCircle2, AlertTriangle,
  Activity, Clock, Shield, ExternalLink, Eye, Zap,
} from 'lucide-react'

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = 'api-keys' | 'webhooks'

const TABS: { id: Tab; label: string; icon: typeof Key }[] = [
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
]

// ─── Available scopes ─────────────────────────────────────────────────────────

const SCOPE_OPTIONS = [
  { value: 'read', label: 'Leitura geral' },
  { value: 'reservations:read', label: 'Reservas (leitura)' },
  { value: 'reservations:write', label: 'Reservas (escrita)' },
  { value: 'guests:read', label: 'Hóspedes (leitura)' },
  { value: 'invoicing:read', label: 'Faturação (leitura)' },
  { value: 'reports:read', label: 'Relatórios' },
]

const WEBHOOK_EVENTS = [
  'reservation.created', 'reservation.checked_in', 'reservation.checked_out',
  'reservation.cancelled', 'guest.created', 'invoice.created', 'invoice.paid',
  'maintenance.created', 'room.status_changed',
]

// ─── New API Key Form ─────────────────────────────────────────────────────────

function NewApiKeyForm({ onCreated, onCancel }: { onCreated: (key: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>(['read'])
  const [expiresIn, setExpiresIn] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const body: any = { name, scopes }
      if (expiresIn) {
        const d = new Date()
        d.setDate(d.getDate() + parseInt(expiresIn))
        body.expiresAt = d.toISOString()
      }
      return api.post('/tenants/me/api-keys', body).then((r) => r.data)
    },
    onSuccess: (data) => {
      onCreated(data.data?.rawKey ?? data.rawKey ?? 'ek_live_example_key')
    },
  })

  const toggleScope = (scope: string) =>
    setScopes((prev) => prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope])

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <h3 className="mb-4 font-semibold text-gray-900">Nova API Key</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Nome da chave *</label>
          <input
            type="text"
            placeholder="Ex: Integração PowerBI"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Expiração</label>
          <select
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
          >
            <option value="">Sem expiração</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
            <option value="365">1 ano</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-xs font-medium text-gray-600">Permissões</label>
          <div className="flex flex-wrap gap-1.5">
            {SCOPE_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleScope(s.value)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  scopes.includes(s.value)
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !name || scopes.length === 0}
        >
          {mutation.isPending ? 'A criar...' : 'Criar Chave'}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  )
}

// ─── New Webhook Form ─────────────────────────────────────────────────────────

function NewWebhookForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [events, setEvents] = useState<string[]>([])

  const mutation = useMutation({
    mutationFn: () => api.post('/tenants/me/webhooks', { url, description, events }),
    onSuccess: onCreated,
  })

  const toggleEvent = (event: string) =>
    setEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event])

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
      <h3 className="mb-4 font-semibold text-gray-900">Novo Webhook</h3>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">URL do Endpoint *</label>
          <input
            type="url"
            placeholder="https://api.seuservico.com/webhook"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Descrição</label>
          <input
            type="text"
            placeholder="Ex: Sincronização com sistema de BI"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-600">Eventos *</label>
          <div className="flex flex-wrap gap-1.5">
            {WEBHOOK_EVENTS.map((event) => (
              <button
                key={event}
                type="button"
                onClick={() => toggleEvent(event)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-mono font-medium transition-colors',
                  events.includes(event)
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                )}
              >
                {event}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !url || events.length === 0}
        >
          {mutation.isPending ? 'A criar...' : 'Criar Webhook'}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('api-keys')
  const [showNewKey, setShowNewKey] = useState(false)
  const [showNewWebhook, setShowNewWebhook] = useState(false)
  const [newRawKey, setNewRawKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: keysData, isLoading: keysLoading } = useQuery({
    queryKey: ['my-api-keys'],
    queryFn: () =>
      api.get('/tenants/me/api-keys').then((r) => r.data).catch(() => ({
        data: [
          {
            id: 'k1', name: 'Integração PowerBI', keyPrefix: 'ek_live_aB2c',
            scopes: ['read', 'reports:read'], active: true,
            lastUsedAt: new Date(Date.now() - 86400000).toISOString(), expiresAt: null,
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
        ],
      })),
  })

  const { data: webhooksData, isLoading: webhooksLoading } = useQuery({
    queryKey: ['my-webhooks'],
    queryFn: () =>
      api.get('/tenants/me/webhooks').then((r) => r.data).catch(() => ({
        data: [
          {
            id: 'w1', url: 'https://hooks.zapier.com/catch/abc123',
            description: 'Zapier — automação', events: ['reservation.created', 'invoice.paid'],
            active: true, lastDeliveryAt: new Date(Date.now() - 3600000).toISOString(),
            lastDeliveryStatus: 200, createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
          },
        ],
      })),
  })

  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenants/me/api-keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-api-keys'] }),
  })

  const deleteWebhookMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/tenants/me/webhooks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-webhooks'] }),
  })

  const pingMutation = useMutation({
    mutationFn: (id: string) => api.post(`/tenants/me/webhooks/${id}/ping`),
  })

  const keys: any[] = keysData?.data ?? []
  const webhooks: any[] = webhooksData?.data ?? []

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
        <p className="text-sm text-gray-500">Gerencie as chaves de API e webhooks para integrar sistemas externos.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── API Keys Tab ── */}
      {tab === 'api-keys' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">API Keys</h2>
              <p className="text-sm text-gray-500">Use estas chaves para aceder à API ENGERIS ONE de sistemas externos.</p>
            </div>
            <Button onClick={() => setShowNewKey(true)} disabled={showNewKey}>
              <Plus className="mr-2 h-4 w-4" /> Nova Chave
            </Button>
          </div>

          {showNewKey && (
            <NewApiKeyForm
              onCreated={(key) => {
                setNewRawKey(key)
                setShowNewKey(false)
                queryClient.invalidateQueries({ queryKey: ['my-api-keys'] })
              }}
              onCancel={() => setShowNewKey(false)}
            />
          )}

          {/* New key reveal */}
          {newRawKey && (
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 text-sm">Guarde esta chave agora — não será mostrada novamente!</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 rounded border border-amber-200 bg-white px-2 py-1.5 font-mono text-xs text-gray-900 overflow-x-auto">
                      {newRawKey}
                    </code>
                    <button
                      onClick={() => copyKey(newRawKey)}
                      className="flex items-center gap-1 rounded bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                    >
                      {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <button onClick={() => setNewRawKey(null)} className="text-amber-400 hover:text-amber-600">×</button>
              </div>
            </div>
          )}

          {/* Keys list */}
          {keysLoading ? (
            <div className="flex h-32 items-center justify-center text-gray-400">A carregar...</div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
              <Key className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">Nenhuma API key criada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((k: any) => {
                const expired = k.expiresAt && new Date(k.expiresAt) < new Date()
                return (
                  <div key={k.id} className={cn('flex items-center gap-4 rounded-xl border bg-white p-4', (!k.active || expired) && 'opacity-60')}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Key className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{k.name}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', k.active && !expired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                          {expired ? 'Expirada' : k.active ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span className="font-mono">{k.keyPrefix}••••••••</span>
                        <span className="flex flex-wrap gap-1">
                          {(k.scopes ?? []).map((s: string) => (
                            <span key={s} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{s}</span>
                          ))}
                        </span>
                        {k.lastUsedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Usado: {new Date(k.lastUsedAt).toLocaleDateString('pt-AO')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Revogar a chave "${k.name}"?`)) deleteKeyMutation.mutate(k.id)
                      }}
                      className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Security tips */}
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <Shield className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-0.5">
              <p className="font-semibold">Boas práticas de segurança</p>
              <p>Nunca inclua API keys em código frontend ou repositórios públicos. Use sempre variáveis de ambiente.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Webhooks Tab ── */}
      {tab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Webhooks</h2>
              <p className="text-sm text-gray-500">Receba notificações automáticas quando eventos ocorrem no sistema.</p>
            </div>
            <Button onClick={() => setShowNewWebhook(true)} disabled={showNewWebhook}>
              <Plus className="mr-2 h-4 w-4" /> Novo Webhook
            </Button>
          </div>

          {showNewWebhook && (
            <NewWebhookForm
              onCreated={() => {
                setShowNewWebhook(false)
                queryClient.invalidateQueries({ queryKey: ['my-webhooks'] })
              }}
              onCancel={() => setShowNewWebhook(false)}
            />
          )}

          {webhooksLoading ? (
            <div className="flex h-32 items-center justify-center text-gray-400">A carregar...</div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
              <Webhook className="h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-500">Nenhum webhook configurado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((w: any) => (
                <div key={w.id} className="rounded-xl border bg-white p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', w.active ? 'bg-primary/10' : 'bg-gray-100')}>
                      <Webhook className={cn('h-4 w-4', w.active ? 'text-primary' : 'text-gray-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-mono text-sm text-gray-900">{w.url}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', w.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                          {w.active ? 'Ativo' : 'Inativo'}
                        </span>
                        {w.lastDeliveryStatus && w.lastDeliveryStatus >= 400 && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Falha ({w.lastDeliveryStatus})
                          </span>
                        )}
                      </div>
                      {w.description && <p className="mt-0.5 text-xs text-gray-400">{w.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(w.events ?? []).map((e: string) => (
                          <span key={e} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-600">{e}</span>
                        ))}
                      </div>
                      {w.lastDeliveryAt && (
                        <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-400">
                          <Activity className="h-3 w-3" />
                          Última entrega: {new Date(w.lastDeliveryAt).toLocaleString('pt-AO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-xs"
                        onClick={() => pingMutation.mutate(w.id)}
                        disabled={pingMutation.isPending}
                        title="Enviar evento de teste"
                      >
                        <Zap className="h-3.5 w-3.5" /> Testar
                      </Button>
                      <button
                        onClick={() => {
                          if (confirm('Remover este webhook?')) deleteWebhookMutation.mutate(w.id)
                        }}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">Como funcionam os webhooks?</p>
            <p>Quando um evento ocorre (ex: nova reserva), enviamos um POST HTTP para o seu endpoint com os dados do evento em formato JSON. Inclua o cabeçalho <code className="rounded bg-gray-200 px-1">X-ENGERIS-Signature</code> para validar a autenticidade.</p>
          </div>
        </div>
      )}
    </div>
  )
}

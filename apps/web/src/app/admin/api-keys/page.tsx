'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { StatCard } from '@/components/ui/stat-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Key, Plus, Trash2, Copy, CheckCircle2, XCircle,
  AlertTriangle, Eye, EyeOff, RefreshCw, Clock, Shield,
} from 'lucide-react'

// ─── Scope groups ─────────────────────────────────────────────────────────────

const SCOPE_GROUPS: { label: string; scopes: { value: string; label: string }[] }[] = [
  {
    label: 'Global',
    scopes: [
      { value: 'read', label: 'Leitura total' },
      { value: 'write', label: 'Escrita total' },
      { value: 'delete', label: 'Eliminação' },
    ],
  },
  {
    label: 'Reservas',
    scopes: [
      { value: 'reservations:read', label: 'Ler reservas' },
      { value: 'reservations:write', label: 'Criar/editar reservas' },
    ],
  },
  {
    label: 'Hóspedes',
    scopes: [
      { value: 'guests:read', label: 'Ler hóspedes' },
      { value: 'guests:write', label: 'Criar/editar hóspedes' },
    ],
  },
  {
    label: 'Faturação',
    scopes: [
      { value: 'invoicing:read', label: 'Ler faturas' },
      { value: 'invoicing:write', label: 'Criar faturas' },
    ],
  },
  {
    label: 'RH & Stock',
    scopes: [
      { value: 'hr:read', label: 'Ler RH' },
      { value: 'hr:write', label: 'Escrever RH' },
      { value: 'stock:read', label: 'Ler stock' },
      { value: 'stock:write', label: 'Escrever stock' },
    ],
  },
  {
    label: 'Relatórios',
    scopes: [{ value: 'reports:read', label: 'Ler relatórios' }],
  },
]

// ─── New API Key Modal ────────────────────────────────────────────────────────

function NewApiKeyModal({
  open, onClose, onCreated, tenants,
}: {
  open: boolean
  onClose: () => void
  onCreated: (data: any) => void
  tenants: any[]
}) {
  const [name, setName] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read'])
  const [expiresIn, setExpiresIn] = useState('')

  const mutation = useMutation({
    mutationFn: () => {
      const body: any = { name, tenantId, scopes: selectedScopes }
      if (expiresIn) {
        const days = parseInt(expiresIn)
        const d = new Date()
        d.setDate(d.getDate() + days)
        body.expiresAt = d.toISOString()
      }
      return api.post('/admin/api-keys', body).then((r) => r.data)
    },
    onSuccess: (data) => {
      onCreated(data.data)
      onClose()
    },
  })

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) => prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Nova API Key</h2>
          <p className="text-sm text-gray-500">Crie uma chave para integração segura com a API</p>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto p-6">
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
            <label className="mb-1 block text-xs font-semibold text-gray-600">Nome da chave *</label>
            <input
              type="text"
              placeholder="Ex: Integração PMS, App Mobile, BI..."
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Expiração</label>
            <select
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
              value={expiresIn}
              onChange={(e) => setExpiresIn(e.target.value)}
            >
              <option value="">Sem expiração</option>
              <option value="30">30 dias</option>
              <option value="90">90 dias</option>
              <option value="180">6 meses</option>
              <option value="365">1 ano</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-600">Permissões (scopes) *</label>
            <div className="space-y-3 rounded-lg border border-gray-100 p-3">
              {SCOPE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 text-xs font-medium text-gray-400 uppercase tracking-wide">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.scopes.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => toggleScope(s.value)}
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-medium transition-colors',
                          selectedScopes.includes(s.value)
                            ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !name || !tenantId || selectedScopes.length === 0}
          >
            {mutation.isPending ? 'A criar...' : 'Criar API Key'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Reveal Key Banner ────────────────────────────────────────────────────────

function NewKeyBanner({ rawKey, onDismiss }: { rawKey: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    navigator.clipboard.writeText(rawKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-amber-800">Guarde esta chave agora — não será mostrada novamente!</p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 font-mono text-sm text-gray-900 overflow-x-auto">
              {rawKey}
            </code>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-amber-400 hover:text-amber-600 shrink-0">×</button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminApiKeysPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [filterTenant, setFilterTenant] = useState('')
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())

  const { data: keysData, isLoading } = useQuery({
    queryKey: ['admin-api-keys', filterTenant],
    queryFn: () =>
      api.get('/admin/api-keys', { params: { tenantId: filterTenant || undefined, limit: 50 } }).then((r) => r.data),
  })

  const { data: tenantsData } = useQuery({
    queryKey: ['admin-tenants-list'],
    queryFn: () => api.get('/admin/tenants', { params: { limit: 100 } }).then((r) => r.data.data),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/admin/api-keys/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/api-keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] }),
  })

  const keys: any[] = keysData?.data ?? []
  const tenants: any[] = tenantsData ?? []

  const total = keysData?.total ?? 0
  const active = keys.filter((k) => k.active).length
  const expired = keys.filter((k) => k.expiresAt && new Date(k.expiresAt) < new Date()).length
  const neverUsed = keys.filter((k) => !k.lastUsedAt).length

  const isExpired = (k: any) => k.expiresAt && new Date(k.expiresAt) < new Date()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500">Gestão de chaves de acesso à API para integrações de terceiros.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova API Key
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Chaves" value={total} icon={<Key className="h-5 w-5 text-primary" />} />
        <StatCard title="Ativas" value={active} icon={<CheckCircle2 className="h-5 w-5 text-green-500" />} />
        <StatCard title="Expiradas" value={expired} icon={<XCircle className="h-5 w-5 text-red-500" />} />
        <StatCard title="Nunca usadas" value={neverUsed} icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} />
      </div>

      {/* New key banner */}
      {newKey && (
        <NewKeyBanner rawKey={newKey} onDismiss={() => setNewKey(null)} />
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={filterTenant}
          onChange={(e) => setFilterTenant(e.target.value)}
        >
          <option value="">Todos os tenants</option>
          {tenants.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Keys list */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 py-20">
          <Key className="h-12 w-12 text-gray-300" />
          <div className="text-center">
            <p className="font-medium text-gray-600">Nenhuma API key configurada</p>
            <p className="text-sm text-gray-400">Crie chaves para permitir integrações externas seguras</p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Criar API Key
          </Button>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-3">Nome / Tenant</th>
                <th className="px-5 py-3">Chave (prefix)</th>
                <th className="px-5 py-3">Scopes</th>
                <th className="px-5 py-3">Último uso</th>
                <th className="px-5 py-3">Expiração</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keys.map((k: any) => {
                const expired = isExpired(k)
                return (
                  <tr key={k.id} className={cn('hover:bg-gray-50 transition-colors', (!k.active || expired) && 'opacity-60')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Key className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{k.name}</p>
                          <p className="text-xs text-gray-400">{k.tenant?.name ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">
                      {k.keyPrefix}••••••••••••
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(k.scopes ?? []).slice(0, 3).map((s: string) => (
                          <span key={s} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                            {s}
                          </span>
                        ))}
                        {k.scopes?.length > 3 && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-400">
                            +{k.scopes.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">
                      {k.lastUsedAt ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(k.lastUsedAt).toLocaleDateString('pt-AO')}
                        </span>
                      ) : (
                        <span className="text-gray-300">Nunca usada</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs">
                      {k.expiresAt ? (
                        <span className={cn('flex items-center gap-1', expired ? 'text-red-600' : 'text-gray-500')}>
                          <Clock className="h-3 w-3" />
                          {new Date(k.expiresAt).toLocaleDateString('pt-AO')}
                          {expired && <span className="font-semibold">(expirada)</span>}
                        </span>
                      ) : (
                        <span className="text-gray-400">Sem limite</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        k.active && !expired ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {expired ? 'Expirada' : k.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle active */}
                        <button
                          onClick={() => toggleMutation.mutate({ id: k.id, active: !k.active })}
                          className={cn(
                            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                            k.active ? 'bg-primary' : 'bg-gray-200'
                          )}
                        >
                          <span className={cn(
                            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                            k.active ? 'translate-x-4' : 'translate-x-0'
                          )} />
                        </button>
                        {/* Revoke */}
                        <button
                          onClick={() => {
                            if (confirm(`Revogar a API key "${k.name}"? Esta ação não pode ser desfeita.`)) {
                              deleteMutation.mutate(k.id)
                            }
                          }}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Revogar chave"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Shield className="h-5 w-5 shrink-0 text-blue-600 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold">Boas práticas de segurança</p>
          <ul className="mt-1 list-disc list-inside space-y-0.5 text-blue-600">
            <li>Nunca partilhe API keys em repositórios de código</li>
            <li>Defina sempre a expiração mínima necessária</li>
            <li>Atribua apenas os scopes estritamente necessários</li>
            <li>Revogue imediatamente chaves comprometidas</li>
          </ul>
        </div>
      </div>

      <NewApiKeyModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(data) => {
          setNewKey(data.rawKey)
          queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] })
        }}
        tenants={tenants}
      />
    </div>
  )
}

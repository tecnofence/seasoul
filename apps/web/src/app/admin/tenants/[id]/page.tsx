'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'
import {
  ArrowLeft,
  Building2,
  Users,
  Package,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  LogIn,
  CreditCard,
  Plus,
  Eye,
  EyeOff,
  BarChart3,
  CalendarCheck2,
  FileText,
  UserCheck,
  ShoppingCart,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react'
import Link from 'next/link'

// ─── Constants ────────────────────────────────────────────────────────────────

const AVAILABLE_MODULES = [
  { id: 'pms', name: 'Hospitalidade (PMS)', category: 'Vertical' },
  { id: 'pos', name: 'Ponto de Venda (POS)', category: 'Vertical' },
  { id: 'finance', name: 'Financeiro & Faturação', category: 'Core' },
  { id: 'hr', name: 'Recursos Humanos', category: 'Core' },
  { id: 'stock', name: 'Stock & Inventário', category: 'Operações' },
  { id: 'maintenance', name: 'Manutenção', category: 'Operações' },
  { id: 'locks', name: 'Fechaduras Smart', category: 'Vertical' },
  { id: 'security', name: 'Segurança & Auditoria', category: 'Vertical' },
  { id: 'retail', name: 'Retalho', category: 'Vertical' },
  { id: 'spa', name: 'Spa & Bem-estar', category: 'Vertical' },
  { id: 'activities', name: 'Atividades & Tours', category: 'Operações' },
  { id: 'events', name: 'Eventos & Conferências', category: 'Vertical' },
]

const PLANS = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM']

const PLAN_PRICE: Record<string, string> = {
  STARTER: '50.000 Kz/mês',
  PROFESSIONAL: '150.000 Kz/mês',
  ENTERPRISE: '500.000 Kz/mês',
  CUSTOM: 'Personalizado',
}

const USER_ROLES = ['RESORT_MANAGER', 'MANAGER', 'SUPERVISOR', 'STAFF', 'RECEPTIONIST', 'CASHIER']

// ─── Tab component ────────────────────────────────────────────────────────────

type Tab = 'info' | 'modules' | 'users' | 'billing' | 'usage'

function Tabs({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'info', label: 'Informação' },
    { id: 'modules', label: 'Módulos' },
    { id: 'users', label: 'Utilizadores' },
    { id: 'billing', label: 'Faturação' },
    { id: 'usage', label: 'Uso & Métricas' },
  ]
  return (
    <div className="flex gap-1 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-5 py-2.5 text-sm font-medium transition-colors',
            active === tab.id
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ tenant, id }: { tenant: any; id: string }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    plan: tenant.plan,
    maxUsers: tenant.maxUsers,
    maxBranches: tenant.maxBranches,
  })
  const [saved, setSaved] = useState(false)

  const updateMutation = useMutation({
    mutationFn: () => api.patch(`/admin/tenants/${id}`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  const suspendMutation = useMutation({
    mutationFn: () => api.post(`/admin/tenants/${id}/suspend`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] }),
  })

  const reactivateMutation = useMutation({
    mutationFn: () => api.post(`/admin/tenants/${id}/reactivate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] }),
  })

  const impersonateMutation = useMutation({
    mutationFn: () => api.get(`/admin/tenants/${id}/impersonate`),
    onSuccess: (res) => {
      const token = res.data?.data?.token
      if (token) {
        window.open(`/auth/impersonate?token=${token}`, '_blank')
      } else {
        alert('Impersonação em breve.')
      }
    },
    onError: () => alert('Funcionalidade de impersonação em breve.'),
  })

  const handleSuspend = () => {
    if (window.confirm(`Tem a certeza que quer suspender "${tenant.name}"? Todos os utilizadores perderão acesso.`)) {
      suspendMutation.mutate()
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Left: details + edit */}
      <div className="flex-1 space-y-6">
        {/* Details */}
        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nome</p>
            <p className="mt-0.5 font-medium text-gray-900">{tenant.name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Slug</p>
            <p className="mt-0.5 font-mono text-sm text-gray-700">{tenant.slug}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">NIF</p>
            <p className="mt-0.5 text-gray-700">{tenant.nif || '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Estado</p>
            <span className={cn(
              'mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold',
              tenant.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
            )}>
              {tenant.active ? 'Ativa' : 'Suspensa'}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Criado em</p>
            <p className="mt-0.5 text-sm text-gray-700">{tenant.createdAt ? formatDateTime(tenant.createdAt) : '—'}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Utilizadores</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{tenant._count?.users ?? 0} / {tenant.maxUsers}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Filiais</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{tenant.branches?.length ?? 0} / {tenant.maxBranches}</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Expira em</p>
            <p className="mt-0.5 text-sm text-gray-700">{tenant.expiresAt ? formatDateTime(tenant.expiresAt) : 'Sem expiração'}</p>
          </div>
        </div>

        {/* Edit form */}
        <div className="rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">Editar Configurações</h3>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Plano</label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {PLANS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Máx. Utilizadores</label>
              <input
                type="number"
                min={1}
                value={form.maxUsers}
                onChange={(e) => setForm({ ...form, maxUsers: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">Máx. Filiais</label>
              <input
                type="number"
                min={1}
                value={form.maxBranches}
                onChange={(e) => setForm({ ...form, maxBranches: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'A guardar...' : 'Guardar Alterações'}
            </Button>
            {saved && (
              <span className="text-xs font-medium text-green-600">Guardado com sucesso!</span>
            )}
          </div>
        </div>
      </div>

      {/* Right sidebar: quick actions */}
      <div className="w-full space-y-4 lg:w-64">
        <Card className="bg-[#1A3E6E] text-white">
          <CardTitle className="text-blue-200 text-sm">Ações Rápidas</CardTitle>
          <CardContent className="mt-4 space-y-2.5">
            {tenant.active ? (
              <Button
                className="w-full justify-start bg-red-600 hover:bg-red-700 text-white"
                size="sm"
                onClick={handleSuspend}
                disabled={suspendMutation.isPending}
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                Suspender Conta
              </Button>
            ) : (
              <Button
                className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                size="sm"
                onClick={() => reactivateMutation.mutate()}
                disabled={reactivateMutation.isPending}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Reativar Conta
              </Button>
            )}

            <Button
              className="w-full justify-start bg-[#0A5C8A] hover:bg-[#084d75] text-white"
              size="sm"
              onClick={() => impersonateMutation.mutate()}
              disabled={impersonateMutation.isPending}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Impersonar Tenant
            </Button>
          </CardContent>
        </Card>

        {tenant.branches?.length > 0 && (
          <Card>
            <CardTitle className="text-sm">Filiais</CardTitle>
            <CardContent className="mt-3 space-y-2">
              {tenant.branches.map((b: any) => (
                <div key={b.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium text-gray-700">{b.name}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── Modules Tab ──────────────────────────────────────────────────────────────

function ModulesTab({ tenant, id }: { tenant: any; id: string }) {
  const queryClient = useQueryClient()

  const activeModuleIds: string[] =
    tenant.modules?.filter((m: any) => m.active).map((m: any) => m.moduleId) ?? []

  const toggleModule = useMutation({
    mutationFn: ({ moduleId }: { moduleId: string }) =>
      api.post(`/admin/tenants/${id}/modules/${moduleId}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] }),
  })

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
        O módulo <strong>core</strong> está sempre ativo e não pode ser desativado.
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {AVAILABLE_MODULES.map((mod) => {
          const isActive = activeModuleIds.includes(mod.id)
          return (
            <div
              key={mod.id}
              className={cn(
                'flex items-center justify-between rounded-xl border p-4 transition-all',
                isActive ? 'border-primary/20 bg-primary/5' : 'border-gray-100 bg-white opacity-60',
              )}
            >
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-primary/60">{mod.category}</span>
                <p className="font-semibold text-gray-900 text-sm">{mod.name}</p>
              </div>
              <button
                onClick={() => toggleModule.mutate({ moduleId: mod.id })}
                disabled={toggleModule.isPending}
                className={cn(
                  'flex h-6 w-11 items-center rounded-full p-1 transition-colors',
                  isActive ? 'bg-primary' : 'bg-gray-200',
                )}
              >
                <div
                  className={cn(
                    'h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                    isActive ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'RESORT_MANAGER' })
  const [formError, setFormError] = useState('')

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-tenant-users', id],
    queryFn: () => api.get(`/admin/tenants/${id}/users`).then((r) => r.data?.data ?? r.data ?? []),
  })

  const inviteMutation = useMutation({
    mutationFn: () => api.post(`/admin/tenants/${id}/invite-admin`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant-users', id] })
      setForm({ name: '', email: '', password: '', role: 'RESORT_MANAGER' })
      setShowForm(false)
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'Erro ao convidar utilizador.')
    },
  })

  const users: any[] = Array.isArray(usersData) ? usersData : []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    inviteMutation.mutate()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{users.length} utilizador{users.length !== 1 ? 'es' : ''} registado{users.length !== 1 ? 's' : ''}</p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Convidar Utilizador
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4"
        >
          <h4 className="text-sm font-semibold text-gray-800">Convidar Utilizador</h4>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Nome</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Palavra-passe</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 pr-9 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Perfil</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex gap-3">
            <Button size="sm" type="submit" disabled={inviteMutation.isPending}>
              {inviteMutation.isPending ? 'A convidar...' : 'Convidar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => { setShowForm(false); setFormError('') }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="py-8 text-center text-sm text-gray-400">A carregar utilizadores...</div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-10 text-center">
          <Users className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">Nenhum utilizador encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-3 text-left">Nome</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Perfil</th>
                <th className="px-5 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {u.name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      u.active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500',
                    )}>
                      {u.active !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Billing Tab ──────────────────────────────────────────────────────────────

function BillingTab({ tenant }: { tenant: any }) {
  const plan = tenant.plan as string
  const price = PLAN_PRICE[plan] ?? '—'

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Plano Atual</p>
            <p className="mt-1 text-2xl font-bold text-primary">{plan}</p>
            <p className="mt-0.5 text-sm text-gray-500">{price}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Próxima Renovação</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {tenant.expiresAt ? formatDateTime(tenant.expiresAt) : 'Sem data definida'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Estado</p>
            <p className={cn(
              'mt-1 text-lg font-bold',
              tenant.active ? 'text-green-600' : 'text-red-600',
            )}>
              {tenant.active ? 'Subscrição Ativa' : 'Conta Suspensa'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Histórico de Faturação</h3>
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">Histórico de faturas disponível em breve.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Usage Tab ────────────────────────────────────────────────────────────────

function UsageTab({ id }: { id: string }) {
  const { data: usageData, isLoading } = useQuery({
    queryKey: ['admin-tenant-usage', id],
    queryFn: () => api.get(`/admin/tenants/${id}/usage`).then((r) => r.data?.data ?? r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">A carregar métricas de utilização...</div>
    )
  }

  const usage = usageData ?? {
    users: { count: 8, max: 20, percentage: 40 },
    reservations: { count: 156 },
    invoices: { count: 89 },
    employees: { count: 24 },
    posOrders: { count: 412 },
    plan: 'PROFESSIONAL',
    maxBranches: 3,
    lastActivity: new Date().toISOString(),
  }

  const usagePct = usage.users.percentage
  const barColor =
    usagePct >= 100 ? 'bg-red-500' : usagePct > 80 ? 'bg-amber-500' : 'bg-primary'

  const metrics = [
    { label: 'Total Reservas', value: usage.reservations.count, icon: CalendarCheck2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Faturas Emitidas', value: usage.invoices.count, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Funcionários', value: usage.employees.count, icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Vendas POS', value: usage.posOrders.count, icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  const lastActivityDate = usage.lastActivity
    ? new Date(usage.lastActivity).toLocaleString('pt-AO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—'

  return (
    <div className="space-y-6">
      {/* User limit warning banners */}
      {usagePct >= 100 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium text-red-700">
            Limite atingido — considere um upgrade para continuar a adicionar utilizadores.
          </p>
        </div>
      )}
      {usagePct > 80 && usagePct < 100 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm font-medium text-amber-700">
            Quase no limite de utilizadores — {usage.users.max - usage.users.count} lugar{usage.users.max - usage.users.count !== 1 ? 'es' : ''} restante{usage.users.max - usage.users.count !== 1 ? 's' : ''}.
          </p>
        </div>
      )}

      {/* User utilization */}
      <div className="rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800">Utilização de Utilizadores</h3>
          </div>
          <span className={cn('text-2xl font-extrabold', usagePct >= 100 ? 'text-red-600' : usagePct > 80 ? 'text-amber-600' : 'text-primary')}>
            {usagePct}%
          </span>
        </div>

        <div className="h-4 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn('h-full rounded-full transition-all duration-500', barColor)}
            style={{ width: `${Math.min(usagePct, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{usage.users.count} utilizadores ativos</span>
          <span>Máx. {usage.users.max}</span>
        </div>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.label} className="rounded-xl border border-gray-200 p-5">
              <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl', m.bg)}>
                <Icon className={cn('h-5 w-5', m.color)} />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{m.value.toLocaleString('pt-AO')}</p>
              <p className="mt-0.5 text-xs font-medium text-gray-500">{m.label}</p>
            </div>
          )
        })}
      </div>

      {/* Footer info row */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <BarChart3 className="h-4 w-4 text-gray-400" />
          <span>
            Plano <strong>{usage.plan}</strong> — permite{' '}
            <strong>{usage.users.max} utilizadores</strong> e{' '}
            <strong>{usage.maxBranches} filiai{usage.maxBranches !== 1 ? 's' : ''}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="h-3.5 w-3.5" />
          <span>Última actividade: {lastActivityDate}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('info')


  const { data: tenant, isLoading } = useQuery({
    queryKey: ['admin-tenant', id],
    queryFn: () => api.get(`/admin/tenants/${id}`).then((r) => r.data?.data ?? r.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        A carregar detalhes do tenant...
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500 text-sm">
        Empresa não encontrada.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/admin/tenants"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a lista
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
          {tenant.name?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
          <p className="text-sm text-gray-500">{tenant.slug}.engeris.ao</p>
        </div>
        <span className={cn(
          'rounded-full px-3 py-1 text-sm font-semibold',
          tenant.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
        )}>
          {tenant.active ? 'Ativa' : 'Suspensa'}
        </span>
      </div>

      {/* Tabs + content */}
      <Card>
        <Tabs active={activeTab} onChange={setActiveTab} />
        <CardContent className="pt-6">
          {activeTab === 'info' && <InfoTab tenant={tenant} id={id} />}
          {activeTab === 'modules' && <ModulesTab tenant={tenant} id={id} />}
          {activeTab === 'users' && <UsersTab id={id} />}
          {activeTab === 'billing' && <BillingTab tenant={tenant} />}
          {activeTab === 'usage' && <UsageTab id={id} />}
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Building2,
  Palette,
  Briefcase,
  Package,
  MapPin,
  Users,
  ShieldCheck,
  UserPlus,
  Check,
  X as XIcon,
  Eye,
  EyeOff,
} from 'lucide-react'

// ── Módulos válidos para hotelaria ─────────────────────────────────────────
const ALL_MODULES = [
  { id: 'PMS', label: 'Gestão Hoteleira (PMS)' },
  { id: 'POS', label: 'Ponto de Venda (POS)' },
  { id: 'RETAIL', label: 'Retalho' },
  { id: 'SPA', label: 'Spa & Bem-estar' },
  { id: 'ACTIVITIES', label: 'Atividades' },
  { id: 'EVENTS', label: 'Eventos' },
  { id: 'STOCK', label: 'Gestão de Stock' },
  { id: 'HR', label: 'Recursos Humanos' },
  { id: 'MAINTENANCE', label: 'Manutenção' },
  { id: 'LOCKS', label: 'Fechaduras Inteligentes' },
  { id: 'SECURITY', label: 'Segurança' },
  { id: 'FINANCE', label: 'Financeiro' },
]

// ── Roles disponíveis para convite ─────────────────────────────────────────
const INVITE_ROLES = [
  { value: 'RESORT_MANAGER', label: 'Gestor Resort' },
  { value: 'RECEPTIONIST', label: 'Rececionista' },
  { value: 'POS_OPERATOR', label: 'Operador POS' },
  { value: 'STOCK_MANAGER', label: 'Gestor Stock' },
  { value: 'HR_MANAGER', label: 'Gestor RH' },
  { value: 'STAFF', label: 'Colaborador' },
]

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  RESORT_MANAGER: 'Gestor Resort',
  RECEPTIONIST: 'Rececionista',
  POS_OPERATOR: 'Operador POS',
  STOCK_MANAGER: 'Gestor Stock',
  HR_MANAGER: 'Gestor RH',
  STAFF: 'Colaborador',
  MAINTENANCE: 'Manutenção',
  HOUSEKEEPING: 'Housekeeping',
}

// ── Toggle switch ──────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// ── Feedback inline ────────────────────────────────────────────────────────
function SaveFeedback({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null
  if (status === 'saving') return <span className="text-sm text-gray-500">A guardar...</span>
  if (status === 'saved') return <span className="text-sm font-medium text-green-600">Guardado com sucesso!</span>
  return <span className="text-sm font-medium text-red-600">Erro ao guardar. Tente novamente.</span>
}

// ── Página principal ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const queryClient = useQueryClient()

  // ── Estado: Módulos ──
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>({})
  const [modulesSaveStatus, setModulesSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // ── Estado: Branding ──
  const [branding, setBranding] = useState({ logoUrl: '', primaryColor: '#1A3E6E' })
  const [brandingSaveStatus, setBrandingSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // ── Estado: Negócio ──
  const [business, setBusiness] = useState({ nif: '', address: '', contact: '' })
  const [businessSaveStatus, setBusinessSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // ── Estado: Utilizadores ──
  const [showInvitePanel, setShowInvitePanel] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', role: 'RECEPTIONIST' })
  const [inviteError, setInviteError] = useState('')

  // ── Estado: Segurança ──
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [pwStatus, setPwStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [pwError, setPwError] = useState('')

  // ── Query: tenant ──
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => api.get('/tenants/me/modules').then((r) => r.data.data),
    retry: 1,
  })

  // ── Query: utilizadores ──
  const { data: usersData } = useQuery({
    queryKey: ['settings-users'],
    queryFn: () => api.get('/users', { params: { limit: 50 } }).then((r) => r.data),
    retry: 1,
  })

  // ── Sincronizar estado com dados do tenant ──
  useEffect(() => {
    if (!tenant) return
    if (tenant.modules) {
      const mods: Record<string, boolean> = {}
      tenant.modules.forEach((m: any) => { mods[m.moduleId] = m.active })
      setEnabledModules(mods)
    }
    if (tenant.logoUrl) setBranding((b) => ({ ...b, logoUrl: tenant.logoUrl }))
    if (tenant.primaryColor) setBranding((b) => ({ ...b, primaryColor: tenant.primaryColor }))
    if (tenant.nif) setBusiness((b) => ({ ...b, nif: tenant.nif }))
    if (tenant.address) setBusiness((b) => ({ ...b, address: tenant.address }))
    if (tenant.contact) setBusiness((b) => ({ ...b, contact: tenant.contact }))
  }, [tenant])

  // ── Mutation: módulos ──
  const modulesMutation = useMutation({
    mutationFn: async () => {
      const tenantId = tenant?.tenantId ?? tenant?.id
      if (!tenantId) throw new Error('Tenant não encontrado')
      await api.patch(`/tenants/${tenantId}`, { modules: enabledModules })
    },
    onSuccess: () => {
      setModulesSaveStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] })
      setTimeout(() => setModulesSaveStatus('idle'), 3000)
    },
    onError: () => {
      setModulesSaveStatus('error')
      setTimeout(() => setModulesSaveStatus('idle'), 3000)
    },
  })

  // ── Mutation: branding ──
  const brandingMutation = useMutation({
    mutationFn: async () => {
      const tenantId = tenant?.tenantId ?? tenant?.id
      if (!tenantId) throw new Error('Tenant não encontrado')
      await api.patch(`/tenants/${tenantId}`, {
        logo: branding.logoUrl || null,
        primaryColor: branding.primaryColor,
      })
    },
    onSuccess: () => {
      setBrandingSaveStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] })
      setTimeout(() => setBrandingSaveStatus('idle'), 3000)
    },
    onError: () => {
      setBrandingSaveStatus('error')
      setTimeout(() => setBrandingSaveStatus('idle'), 3000)
    },
  })

  // ── Mutation: negócio ──
  const businessMutation = useMutation({
    mutationFn: async () => {
      const tenantId = tenant?.tenantId ?? tenant?.id
      if (!tenantId) throw new Error('Tenant não encontrado')
      await api.patch(`/tenants/${tenantId}`, {
        nif: business.nif || null,
        address: business.address || null,
        contact: business.contact || null,
      })
    },
    onSuccess: () => {
      setBusinessSaveStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] })
      setTimeout(() => setBusinessSaveStatus('idle'), 3000)
    },
    onError: () => {
      setBusinessSaveStatus('error')
      setTimeout(() => setBusinessSaveStatus('idle'), 3000)
    },
  })

  // ── Mutation: convidar utilizador ──
  const inviteMutation = useMutation({
    mutationFn: (data: typeof inviteForm) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings-users'] })
      setShowInvitePanel(false)
      setInviteForm({ name: '', email: '', password: '', role: 'RECEPTIONIST' })
      setInviteError('')
    },
    onError: (err: any) => {
      setInviteError(err?.response?.data?.message ?? 'Erro ao convidar utilizador.')
    },
  })

  // ── Mutation: alterar palavra-passe ──
  const pwMutation = useMutation({
    mutationFn: () =>
      api.post('/auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      }),
    onSuccess: () => {
      setPwStatus('saved')
      setPwForm({ current: '', next: '', confirm: '' })
      setPwError('')
      setTimeout(() => setPwStatus('idle'), 3000)
    },
    onError: (err: any) => {
      setPwStatus('error')
      setPwError(err?.response?.data?.message ?? 'Erro ao alterar a palavra-passe.')
      setTimeout(() => setPwStatus('idle'), 4000)
    },
  })

  const handlePwSubmit = () => {
    setPwError('')
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError('Preencha todos os campos.')
      return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('A nova palavra-passe e a confirmação não coincidem.')
      return
    }
    if (pwForm.next.length < 8) {
      setPwError('A nova palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }
    setPwStatus('saving')
    pwMutation.mutate()
  }

  const activeCount = Object.values(enabledModules).filter(Boolean).length
  const users: any[] = usersData?.data ?? []

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">A carregar definições...</div>
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-gray-500" />
        <h1 className="text-2xl font-bold text-gray-900">Definições</h1>
      </div>

      {/* ── 1. Informação da Organização ──────────────────────────────────── */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Informação da Organização
          </div>
        </CardTitle>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-gray-500">Nome</dt>
              <dd className="font-medium">{tenant?.name ?? tenant?.tenant?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Plano</dt>
              <dd>
                <Badge variant="info">{tenant?.plan ?? tenant?.tenant?.plan ?? '—'}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Módulos Ativos</dt>
              <dd className="font-medium">
                {activeCount} de {ALL_MODULES.length}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* ── 2. Módulos ────────────────────────────────────────────────────── */}
      <Card>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Módulos
            </div>
            <div className="flex items-center gap-3">
              <SaveFeedback status={modulesSaveStatus} />
              <Button
                size="sm"
                onClick={() => {
                  setModulesSaveStatus('saving')
                  modulesMutation.mutate()
                }}
                disabled={modulesSaveStatus === 'saving'}
              >
                Guardar Módulos
              </Button>
            </div>
          </div>
        </CardTitle>
        <CardContent>
          <p className="mb-4 text-sm text-gray-500">
            Ative ou desative os módulos disponíveis para a sua organização.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_MODULES.map((mod) => (
              <div
                key={mod.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{mod.label}</p>
                  <p className="text-xs text-gray-400">{mod.id}</p>
                </div>
                <Toggle
                  checked={!!enabledModules[mod.id]}
                  onChange={() =>
                    setEnabledModules((prev) => ({ ...prev, [mod.id]: !prev[mod.id] }))
                  }
                  label={mod.label}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── 3. Filiais ────────────────────────────────────────────────────── */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Filiais
          </div>
        </CardTitle>
        <CardContent>
          {tenant?.branches && tenant.branches.length > 0 ? (
            <div className="space-y-3">
              {tenant.branches.map((branch: any) => (
                <div
                  key={branch.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{branch.name}</p>
                    <p className="text-xs text-gray-500">{branch.address || '—'}</p>
                  </div>
                  <Badge variant={branch.active ? 'success' : 'default'}>
                    {branch.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma filial configurada.</p>
          )}
        </CardContent>
      </Card>

      {/* ── 4. Marca e Aparência ──────────────────────────────────────────── */}
      <Card>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Marca e Aparência
            </div>
            <div className="flex items-center gap-3">
              <SaveFeedback status={brandingSaveStatus} />
              <Button
                size="sm"
                onClick={() => {
                  setBrandingSaveStatus('saving')
                  brandingMutation.mutate()
                }}
                disabled={brandingSaveStatus === 'saving'}
              >
                Guardar Marca
              </Button>
            </div>
          </div>
        </CardTitle>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">URL do Logotipo</label>
              <Input
                value={branding.logoUrl}
                onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                placeholder="https://exemplo.ao/logo.png"
              />
              {branding.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt="Pré-visualização do logotipo"
                  className="mt-2 h-12 rounded border object-contain"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cor Primária</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  className="h-10 w-12 cursor-pointer rounded border"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                  placeholder="#1A3E6E"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 5. Informação Comercial ───────────────────────────────────────── */}
      <Card>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Informação Comercial
            </div>
            <div className="flex items-center gap-3">
              <SaveFeedback status={businessSaveStatus} />
              <Button
                size="sm"
                onClick={() => {
                  setBusinessSaveStatus('saving')
                  businessMutation.mutate()
                }}
                disabled={businessSaveStatus === 'saving'}
              >
                Guardar Dados
              </Button>
            </div>
          </div>
        </CardTitle>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">NIF</label>
              <Input
                value={business.nif}
                onChange={(e) => setBusiness({ ...business, nif: e.target.value })}
                placeholder="5000000000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Morada</label>
              <Input
                value={business.address}
                onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                placeholder="Morada da empresa"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Contacto</label>
              <Input
                value={business.contact}
                onChange={(e) => setBusiness({ ...business, contact: e.target.value })}
                placeholder="+244 900 000 000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 6. Utilizadores ──────────────────────────────────────────────── */}
      <Card>
        <CardTitle>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Utilizadores
            </div>
            <Button
              size="sm"
              onClick={() => {
                setShowInvitePanel(!showInvitePanel)
                setInviteError('')
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar Utilizador
            </Button>
          </div>
        </CardTitle>
        <CardContent>
          {/* Painel de convite */}
          {showInvitePanel && (
            <div className="mb-5 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-900">Novo Utilizador</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Nome</label>
                  <Input
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="email@resort.ao"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Palavra-passe</label>
                  <Input
                    type="password"
                    value={inviteForm.password}
                    onChange={(e) => setInviteForm({ ...inviteForm, password: e.target.value })}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Cargo</label>
                  <select
                    className="w-full rounded-md border bg-white px-3 py-2 text-sm"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                  >
                    {INVITE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {inviteError && (
                <p className="mt-2 text-xs font-medium text-red-600">{inviteError}</p>
              )}
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setInviteError('')
                    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) {
                      setInviteError('Preencha todos os campos obrigatórios.')
                      return
                    }
                    inviteMutation.mutate(inviteForm)
                  }}
                  disabled={inviteMutation.isPending}
                >
                  {inviteMutation.isPending ? 'A criar...' : 'Criar Utilizador'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowInvitePanel(false)
                    setInviteError('')
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Tabela de utilizadores */}
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-4 font-medium">Nome</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Cargo</th>
                    <th className="pb-2 pr-4 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 font-medium text-gray-900">{u.name}</td>
                      <td className="py-2.5 pr-4 text-gray-600">{u.email}</td>
                      <td className="py-2.5 pr-4">
                        <span className="text-gray-700">{ROLE_LABEL[u.role] ?? u.role}</span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={u.active ? 'success' : 'default'}>
                          {u.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-gray-500">
                        {u.createdAt ? formatDateTime(u.createdAt) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-4 text-sm text-gray-500">Nenhum utilizador encontrado.</p>
          )}
        </CardContent>
      </Card>

      {/* ── 7. Segurança — Alterar Palavra-passe ─────────────────────────── */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Segurança
          </div>
        </CardTitle>
        <CardContent>
          <p className="mb-4 text-sm text-gray-500">
            Altere a sua palavra-passe de acesso ao sistema.
          </p>
          <div className="grid max-w-lg grid-cols-1 gap-4">
            {/* Palavra-passe atual */}
            <div>
              <label className="mb-1 block text-sm font-medium">Palavra-passe Atual</label>
              <div className="relative">
                <Input
                  type={showPw.current ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Mostrar/ocultar palavra-passe"
                >
                  {showPw.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Nova palavra-passe */}
            <div>
              <label className="mb-1 block text-sm font-medium">Nova Palavra-passe</label>
              <div className="relative">
                <Input
                  type={showPw.next ? 'text' : 'password'}
                  value={pwForm.next}
                  onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => ({ ...s, next: !s.next }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Mostrar/ocultar nova palavra-passe"
                >
                  {showPw.next ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar nova palavra-passe */}
            <div>
              <label className="mb-1 block text-sm font-medium">Confirmar Nova Palavra-passe</label>
              <div className="relative">
                <Input
                  type={showPw.confirm ? 'text' : 'password'}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  placeholder="Repita a nova palavra-passe"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Mostrar/ocultar confirmação"
                >
                  {showPw.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {pwError && (
              <p className="text-sm font-medium text-red-600">{pwError}</p>
            )}
            {pwStatus === 'saved' && (
              <p className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                <Check className="h-4 w-4" />
                Palavra-passe alterada com sucesso!
              </p>
            )}

            <div>
              <Button
                onClick={handlePwSubmit}
                disabled={pwStatus === 'saving' || pwMutation.isPending}
              >
                {pwStatus === 'saving' ? 'A alterar...' : 'Alterar Palavra-passe'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

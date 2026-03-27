'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Building2, Plus, Users, Package, Check, X as XIcon } from 'lucide-react'

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
  CUSTOM: 'Custom',
}

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-gray-100 text-gray-800',
  PROFESSIONAL: 'bg-blue-100 text-blue-800',
  ENTERPRISE: 'bg-purple-100 text-purple-800',
  CUSTOM: 'bg-amber-100 text-amber-800',
}

export default function TenantsPage() {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', nif: '', plan: 'STARTER', maxUsers: 5, maxBranches: 1 })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', search],
    queryFn: () => api.get('/tenants', { params: { search: search || undefined, limit: 50 } }).then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/tenants', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      setShowCreate(false)
      setForm({ name: '', slug: '', nif: '', plan: 'STARTER', maxUsers: 5, maxBranches: 1 })
    },
  })

  const tenants = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestão de Tenants</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Tenant
        </Button>
      </div>

      {/* Formulário de criação */}
      {showCreate && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Criar Novo Tenant</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nome da Empresa</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} placeholder="Empresa XYZ" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Slug</label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="empresa-xyz" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">NIF</label>
              <Input value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} placeholder="5000000000" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Plano</label>
              <select className="w-full rounded-md border px-3 py-2" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })}>
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Máx. Utilizadores</label>
              <Input type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Máx. Filiais</label>
              <Input type="number" value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: Number(e.target.value) })} />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => createMutation.mutate(form)} disabled={!form.name || !form.slug}>
              Criar Tenant
            </Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Pesquisa */}
      <Input
        placeholder="Pesquisar tenants..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Lista */}
      {isLoading ? (
        <p className="text-gray-500">A carregar...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tenants.map((t: any) => (
            <div key={t.id} className="rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <p className="text-xs text-gray-500">{t.slug}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PLAN_COLORS[t.plan] ?? 'bg-gray-100'}`}>
                  {PLAN_LABELS[t.plan] ?? t.plan}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" /> {t._count?.users ?? 0}/{t.maxUsers}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" /> {t.branches?.length ?? 0}/{t.maxBranches}
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" /> {t.modules?.filter((m: any) => m.active).length ?? 0} módulos
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {t.modules?.filter((m: any) => m.active).map((m: any) => (
                  <span key={m.moduleId} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    {m.moduleId}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2">
                {t.active ? (
                  <span className="flex items-center gap-1 text-xs text-green-600"><Check className="h-3 w-3" /> Ativo</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-600"><XIcon className="h-3 w-3" /> Inativo</span>
                )}
                {t.trainingMode && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Formação</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tenants.length === 0 && !isLoading && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Nenhum tenant encontrado</p>
          <Button className="mt-4" onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Criar Primeiro Tenant
          </Button>
        </div>
      )}
    </div>
  )
}

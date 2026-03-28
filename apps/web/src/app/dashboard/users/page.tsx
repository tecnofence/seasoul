'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Users,
  UserPlus,
  X as XIcon,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

// ── Configuração de roles ──────────────────────────────────────────────────
const ROLE_OPTIONS = [
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

// Badge variant por role
function roleBadgeClass(role: string): string {
  switch (role) {
    case 'RESORT_MANAGER':
      return 'bg-primary/10 text-primary border border-primary/20'
    case 'RECEPTIONIST':
      return 'bg-blue-100 text-blue-800 border border-blue-200'
    case 'POS_OPERATOR':
      return 'bg-amber-100 text-amber-800 border border-amber-200'
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200'
  }
}

// ── Formulário de novo utilizador (slide panel) ────────────────────────────
interface NewUserForm {
  name: string
  email: string
  password: string
  role: string
}

const EMPTY_FORM: NewUserForm = { name: '', email: '', password: '', role: 'RECEPTIONIST' }

// ── Página ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showPanel, setShowPanel] = useState(false)
  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // ── Query: lista de utilizadores ──
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () =>
      api
        .get('/users', { params: { page, limit: 20, search: search || undefined } })
        .then((r) => r.data),
    retry: 1,
  })

  const users: any[] = data?.data ?? []
  const totalPages: number = data?.totalPages ?? 1

  // ── Mutation: criar utilizador ──
  const createMutation = useMutation({
    mutationFn: (payload: NewUserForm) => api.post('/users', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowPanel(false)
      setForm(EMPTY_FORM)
      setFormError('')
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Erro ao criar utilizador.')
    },
  })

  // ── Mutation: toggle ativo/inativo ──
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/users/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setTogglingId(null)
    },
    onError: () => {
      setTogglingId(null)
    },
  })

  const handleToggle = (user: any) => {
    setTogglingId(user.id)
    toggleMutation.mutate({ id: user.id, active: !user.active })
  }

  const handleCreate = () => {
    setFormError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('Preencha todos os campos obrigatórios.')
      return
    }
    if (form.password.length < 8) {
      setFormError('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-gray-500" />
          <h1 className="text-2xl font-bold text-gray-900">Utilizadores</h1>
        </div>
        <Button
          onClick={() => {
            setShowPanel(true)
            setForm(EMPTY_FORM)
            setFormError('')
          }}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Utilizador
        </Button>
      </div>

      {/* ── Slide panel: Novo Utilizador ── */}
      {showPanel && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Criar Novo Utilizador</h2>
            <button
              type="button"
              onClick={() => {
                setShowPanel(false)
                setFormError('')
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
              aria-label="Fechar painel"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Nome */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Nome <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="utilizador@resort.ao"
              />
            </div>

            {/* Palavra-passe */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Palavra-passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Mostrar/ocultar palavra-passe"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Cargo */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Cargo <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <p className="mt-3 text-sm font-medium text-red-600">{formError}</p>
          )}

          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'A criar...' : 'Criar Utilizador'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowPanel(false)
                setFormError('')
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* ── Pesquisa ── */}
      <Input
        placeholder="Pesquisar por nome ou email..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        className="max-w-md"
      />

      {/* ── Tabela ── */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-gray-500">A carregar...</div>
        ) : isError ? (
          <div className="flex h-40 items-center justify-center text-gray-400">
            Erro ao carregar utilizadores.
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Users className="h-12 w-12 text-gray-200" />
            <p className="text-gray-500">
              {search ? `Nenhum utilizador encontrado para "${search}".` : 'Ainda não existem utilizadores.'}
            </p>
            {!search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPanel(true)
                  setForm(EMPTY_FORM)
                  setFormError('')
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Primeiro Utilizador
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Cargo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Ativo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    Criado em
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map((user: any) => {
                  const isToggling = togglingId === user.id
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      {/* Nome */}
                      <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>

                      {/* Email */}
                      <td className="px-4 py-3 text-gray-600">{user.email}</td>

                      {/* Cargo */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(user.role)}`}
                        >
                          {ROLE_LABEL[user.role] ?? user.role}
                        </span>
                      </td>

                      {/* Ativo */}
                      <td className="px-4 py-3">
                        <Badge variant={user.active ? 'success' : 'default'}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>

                      {/* Criado em */}
                      <td className="px-4 py-3 text-gray-500">
                        {user.createdAt ? formatDateTime(user.createdAt) : '—'}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggle(user)}
                          disabled={isToggling}
                          title={user.active ? 'Desativar utilizador' : 'Ativar utilizador'}
                          className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                            user.active
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {isToggling ? (
                            <span>...</span>
                          ) : user.active ? (
                            <>
                              <ToggleRight className="h-3.5 w-3.5" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-3.5 w-3.5" />
                              Ativar
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Paginação ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Seguinte
          </Button>
        </div>
      )}
    </div>
  )
}

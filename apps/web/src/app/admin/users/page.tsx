'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { cn, formatDateTime } from '@/lib/utils'
import {
  UserPlus,
  ShieldCheck,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  active: boolean
  createdAt?: string
  lastLoginAt?: string
}

interface UserStats {
  total: number
  active: number
  inactive: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function RoleBadge({ role }: { role: 'SUPER_ADMIN' | 'ADMIN' }) {
  if (role === 'SUPER_ADMIN') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <ShieldCheck className="h-3 w-3" />
        SUPER_ADMIN
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
      <Shield className="h-3 w-3" />
      ADMIN
    </span>
  )
}

// ─── Invite Panel ─────────────────────────────────────────────────────────────

function InvitePanel({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ADMIN' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post('/admin/users', form),
    onSuccess: () => {
      onSuccess()
      onClose()
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || 'Erro ao criar administrador.')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    mutation.mutate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 flex w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Convidar Administrador</h2>
            <p className="text-xs text-gray-500">Acesso ao portal ENGERIS ONE</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 overflow-y-auto p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Ana Costa"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ana@engeris.ao"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Palavra-passe <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-11 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Perfil</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>

        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <Button
            className="flex-1"
            onClick={handleSubmit as any}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'A criar...' : 'Criar Administrador'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const MOCK_USERS: AdminUser[] = [
  { id: '1', name: 'Manuel Ferreira', email: 'super@engeris.ao', role: 'SUPER_ADMIN', active: true },
  { id: '2', name: 'Ana Costa', email: 'admin@engeris.ao', role: 'ADMIN', active: true },
  { id: '3', name: 'Pedro Santos', email: 'pedro@engeris.ao', role: 'ADMIN', active: false },
]

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [showPanel, setShowPanel] = useState(false)

  const { data: usersRaw, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () =>
      api.get('/admin/users').then((r) => r.data?.data ?? r.data ?? []),
  })

  const { data: statsRaw } = useQuery({
    queryKey: ['admin-users-stats'],
    queryFn: () =>
      api.get('/admin/users/stats').then((r) => r.data?.data ?? r.data),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      api.patch(`/admin/users/${userId}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] })
    },
  })

  const handleDelete = (user: AdminUser) => {
    if (window.confirm(`Tem a certeza que quer eliminar "${user.name}"? Esta ação não pode ser revertida.`)) {
      deleteMutation.mutate(user.id)
    }
  }

  // Use API data or fall back to mock
  const users: AdminUser[] = Array.isArray(usersRaw) && usersRaw.length > 0 ? usersRaw : MOCK_USERS

  const stats: UserStats = statsRaw ?? {
    total: users.length,
    active: users.filter((u) => u.active).length,
    inactive: users.filter((u) => !u.active).length,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administradores da Plataforma</h1>
          <p className="text-sm text-gray-500">
            Utilizadores com acesso ao portal de administração ENGERIS ONE.
          </p>
        </div>
        <Button onClick={() => setShowPanel(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Convidar Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total de Admins</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Ativos</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Inativos</p>
          <p className="mt-2 text-3xl font-bold text-gray-400">{stats.inactive}</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Lista de Administradores</h2>
        </div>

        {loadingUsers ? (
          <div className="py-12 text-center text-sm text-gray-400">A carregar administradores...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-3 text-left">Nome</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Perfil</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-left">Criado em</th>
                  <th className="px-6 py-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(user.name)}
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                        user.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500',
                      )}>
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          user.active ? 'bg-green-500' : 'bg-gray-400',
                        )} />
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {user.createdAt ? formatDateTime(user.createdAt) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {user.role !== 'SUPER_ADMIN' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActiveMutation.mutate({ userId: user.id, active: !user.active })}
                            disabled={toggleActiveMutation.isPending}
                            title={user.active ? 'Desativar' : 'Ativar'}
                            className="text-gray-400 hover:text-primary transition-colors"
                          >
                            {user.active
                              ? <ToggleRight className="h-5 w-5 text-green-600" />
                              : <ToggleLeft className="h-5 w-5" />
                            }
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={deleteMutation.isPending}
                            title="Eliminar"
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 select-none">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite panel */}
      {showPanel && (
        <InvitePanel
          onClose={() => setShowPanel(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            queryClient.invalidateQueries({ queryKey: ['admin-users-stats'] })
          }}
        />
      )}
    </div>
  )
}

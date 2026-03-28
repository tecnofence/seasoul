'use client'

import { UserPlus, MoreVertical, ShieldCheck, Shield } from 'lucide-react'

const adminUsers = [
  {
    id: '1',
    name: 'Manuel Ferreira',
    email: 'super@engeris.ao',
    role: 'SUPER_ADMIN' as const,
    status: 'Ativo' as const,
    lastAccess: 'Hoje',
  },
  {
    id: '2',
    name: 'Ana Costa',
    email: 'admin@engeris.ao',
    role: 'ADMIN' as const,
    status: 'Ativo' as const,
    lastAccess: 'Ontem',
  },
  {
    id: '3',
    name: 'Pedro Santos',
    email: 'pedro@engeris.ao',
    role: 'ADMIN' as const,
    status: 'Inativo' as const,
    lastAccess: 'há 30 dias',
  },
]

function RoleBadge({ role }: { role: 'SUPER_ADMIN' | 'ADMIN' }) {
  if (role === 'SUPER_ADMIN') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
        <ShieldCheck className="h-3 w-3" />
        SUPER_ADMIN
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
      <Shield className="h-3 w-3" />
      ADMIN
    </span>
  )
}

function StatusBadge({ status }: { status: 'Ativo' | 'Inativo' }) {
  if (status === 'Ativo') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Ativo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
      Inativo
    </span>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export default function AdminUsersPage() {
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
        <button
          onClick={() => alert('Funcionalidade disponível em breve')}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Convidar Admin
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total de Admins</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">3</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Activos</p>
          <p className="mt-2 text-3xl font-bold text-green-600">2</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Inativos</p>
          <p className="mt-2 text-3xl font-bold text-gray-400">1</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Lista de Administradores</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Nome</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Último Acesso</th>
                <th className="px-6 py-3 text-left">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
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
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-500">{user.lastAccess}</td>
                  <td className="px-6 py-4">
                    {user.role !== 'SUPER_ADMIN' ? (
                      <button
                        onClick={() =>
                          alert(
                            user.status === 'Ativo'
                              ? `Suspender utilizador: ${user.name}`
                              : `Activar utilizador: ${user.name}`
                          )
                        }
                        className={`text-xs font-medium transition-colors ${
                          user.status === 'Ativo'
                            ? 'text-red-500 hover:text-red-700'
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {user.status === 'Ativo' ? 'Suspender' : 'Ativar'}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300 select-none">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

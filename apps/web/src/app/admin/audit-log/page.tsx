'use client'

import { Download, Info, ChevronLeft, ChevronRight } from 'lucide-react'

type LogLevel = 'INFO' | 'WARNING' | 'ERROR'

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  module: string
  ip: string
  details: string
  level: LogLevel
}

const auditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2026-03-28 09:14:32',
    user: 'super@engeris.ao',
    action: 'LOGIN',
    module: 'Auth',
    ip: '197.149.64.22',
    details: 'Login com 2FA bem-sucedido',
    level: 'INFO',
  },
  {
    id: '2',
    timestamp: '2026-03-28 09:18:05',
    user: 'super@engeris.ao',
    action: 'CREATE_TENANT',
    module: 'Tenants',
    ip: '197.149.64.22',
    details: 'Novo tenant criado: Palmeira Hotel (ID: clx9k...)',
    level: 'INFO',
  },
  {
    id: '3',
    timestamp: '2026-03-27 14:43:11',
    user: 'admin@engeris.ao',
    action: 'UPDATE_PLAN',
    module: 'Planos',
    ip: '41.63.128.10',
    details: 'Plano de "Demo Resort" alterado de Essencial → Profissional',
    level: 'INFO',
  },
  {
    id: '4',
    timestamp: '2026-03-27 11:22:47',
    user: 'admin@engeris.ao',
    action: 'DELETE_USER',
    module: 'Utilizadores',
    ip: '41.63.128.10',
    details: 'Utilizador removido: teste@example.com',
    level: 'WARNING',
  },
  {
    id: '5',
    timestamp: '2026-03-26 18:05:30',
    user: 'sistema',
    action: 'BACKUP_FAILED',
    module: 'Infraestrutura',
    ip: '10.0.0.1',
    details: 'Backup noturno falhou: timeout na ligação S3',
    level: 'ERROR',
  },
  {
    id: '6',
    timestamp: '2026-03-26 16:31:08',
    user: 'super@engeris.ao',
    action: 'UPDATE_SETTINGS',
    module: 'Configurações',
    ip: '197.149.64.22',
    details: 'Tempo limite de sessão alterado para 60 minutos',
    level: 'INFO',
  },
  {
    id: '7',
    timestamp: '2026-03-25 09:00:00',
    user: 'sistema',
    action: 'RATE_LIMIT_EXCEEDED',
    module: 'API Gateway',
    ip: '102.88.34.5',
    details: '150 pedidos/min excedidos — IP bloqueado temporariamente',
    level: 'WARNING',
  },
  {
    id: '8',
    timestamp: '2026-03-24 22:17:44',
    user: 'pedro@engeris.ao',
    action: 'LOGIN_FAILED',
    module: 'Auth',
    ip: '41.63.200.1',
    details: 'Tentativa de login falhada (3ª tentativa) — conta suspensa',
    level: 'ERROR',
  },
]

function LevelBadge({ level }: { level: LogLevel }) {
  const styles: Record<LogLevel, string> = {
    INFO: 'bg-blue-100 text-blue-700',
    WARNING: 'bg-amber-100 text-amber-700',
    ERROR: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[level]}`}>
      {level}
    </span>
  )
}

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registos do Sistema</h1>
          <p className="text-sm text-gray-500">Auditoria completa de todas as acções na plataforma.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            defaultValue="2026-03-28"
          />
          <button
            onClick={() => alert('A exportar registos...')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Policy notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          Registos retidos por <strong>90 dias</strong> conforme política de auditoria da plataforma ENGERIS ONE.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Data/Hora</th>
                <th className="px-6 py-3 text-left">Utilizador</th>
                <th className="px-6 py-3 text-left">Ação</th>
                <th className="px-6 py-3 text-left">Módulo</th>
                <th className="px-6 py-3 text-left">IP</th>
                <th className="px-6 py-3 text-left">Nível</th>
                <th className="px-6 py-3 text-left">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-gray-500">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-3 text-gray-700">{log.user}</td>
                  <td className="px-6 py-3">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-semibold text-gray-700">
                      {log.action}
                    </code>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{log.module}</td>
                  <td className="whitespace-nowrap px-6 py-3 font-mono text-xs text-gray-400">{log.ip}</td>
                  <td className="px-6 py-3">
                    <LevelBadge level={log.level} />
                  </td>
                  <td className="max-w-xs px-6 py-3 text-gray-500 truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <p className="text-xs text-gray-400">A mostrar 1–8 de 8 registos</p>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-xs font-semibold text-white">
              1
            </button>
            <button
              disabled
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-400 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

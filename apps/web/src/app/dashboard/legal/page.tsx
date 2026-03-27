'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Scale, Plus } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { OPEN: 'Aberto', IN_PROGRESS: 'Em Curso', PENDING_COURT: 'Pendente Tribunal', ON_HOLD: 'Suspenso', CLOSED: 'Encerrado', ARCHIVED: 'Arquivado' }
const STATUS_COLOR: Record<string, string> = { OPEN: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-purple-100 text-purple-700', PENDING_COURT: 'bg-amber-100 text-amber-700', ON_HOLD: 'bg-orange-100 text-orange-700', CLOSED: 'bg-green-100 text-green-700', ARCHIVED: 'bg-gray-100 text-gray-700' }
const PRIORITY_LABEL: Record<string, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente' }
const PRIORITY_COLOR: Record<string, string> = { LOW: 'bg-gray-100 text-gray-700', MEDIUM: 'bg-blue-100 text-blue-700', HIGH: 'bg-orange-100 text-orange-700', URGENT: 'bg-red-100 text-red-700' }
const TYPE_LABEL: Record<string, string> = { CIVIL: 'Civil', CRIMINAL: 'Criminal', LABOUR: 'Trabalho', COMMERCIAL: 'Comercial', TAX: 'Fiscal', ADMINISTRATIVE: 'Administrativo', OTHER: 'Outro' }

export default function LegalPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['legal', statusFilter, typeFilter],
    queryFn: () => api.get('/legal', { params: { status: statusFilter || undefined, caseType: typeFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const cases = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jurídico — Processos</h1>
        <Button onClick={() => router.push('/dashboard/legal/new')}><Plus className="mr-2 h-4 w-4" /> Novo Processo</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <select className="rounded-md border px-3 py-2 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">N.º Processo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Título</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Advogado</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Prioridade</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cases.map((c: any) => (
                <tr key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/legal/${c.id}`)}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm">{c.caseNumber}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{c.title}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.clientName ?? c.client?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{TYPE_LABEL[c.caseType] ?? c.caseType}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.lawyerName ?? c.lawyer?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[c.priority] ?? ''}`}>{PRIORITY_LABEL[c.priority] ?? c.priority}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.status] ?? ''}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
                  </td>
                </tr>
              ))}
              {cases.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Nenhum processo registado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

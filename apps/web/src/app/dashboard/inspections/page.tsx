'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ClipboardCheck, Plus } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { SCHEDULED: 'Agendada', IN_PROGRESS: 'Em Curso', COMPLETED: 'Concluída', CANCELLED: 'Cancelada' }
const STATUS_COLOR: Record<string, string> = { SCHEDULED: 'bg-blue-100 text-blue-700', IN_PROGRESS: 'bg-amber-100 text-amber-700', COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700' }
const RESULT_COLOR: Record<string, string> = { APPROVED: 'text-green-600', APPROVED_WITH_CONDITIONS: 'text-amber-600', REJECTED: 'text-red-600' }
const RESULT_LABEL: Record<string, string> = { APPROVED: 'Aprovada', APPROVED_WITH_CONDITIONS: 'Aprovada c/ Condições', REJECTED: 'Rejeitada' }

export default function InspectionsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', statusFilter],
    queryFn: () => api.get('/electrical/inspections', { params: { status: statusFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const inspections = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Eletricidade — Inspeções</h1>
        <Button onClick={() => router.push('/dashboard/inspections/new')}><Plus className="mr-2 h-4 w-4" /> Nova Inspeção</Button>
      </div>

      <div className="flex gap-2">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <button key={k} onClick={() => setStatusFilter(statusFilter === k ? '' : k)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${statusFilter === k ? STATUS_COLOR[k] : 'bg-gray-100 text-gray-600'}`}>
            {v}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Morada</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inspections.map((insp: any) => (
                <tr key={insp.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/inspections/${insp.id}`)}>
                  <td className="px-4 py-3 font-medium">{insp.clientName}</td>
                  <td className="px-4 py-3 text-gray-500">{insp.address}</td>
                  <td className="px-4 py-3 text-gray-500">{insp.inspectionType?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-500">{insp.scheduledDate ? new Date(insp.scheduledDate).toLocaleDateString('pt-AO') : '—'}</td>
                  <td className="px-4 py-3">
                    {insp.result ? <span className={`font-medium ${RESULT_COLOR[insp.result] ?? ''}`}>{RESULT_LABEL[insp.result] ?? insp.result}</span> : '—'}
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[insp.status] ?? ''}`}>{STATUS_LABEL[insp.status] ?? insp.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {inspections.length === 0 && (
            <div className="p-12 text-center">
              <ClipboardCheck className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhuma inspeção encontrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Award, Plus } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { PENDING: 'Pendente', ISSUED: 'Emitida', EXPIRED: 'Expirada', REVOKED: 'Revogada' }
const STATUS_COLOR: Record<string, string> = { PENDING: 'bg-amber-100 text-amber-700', ISSUED: 'bg-green-100 text-green-700', EXPIRED: 'bg-red-100 text-red-700', REVOKED: 'bg-gray-100 text-gray-700' }

export default function CertificationsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['certifications', statusFilter],
    queryFn: () => api.get('/electrical/certifications', { params: { status: statusFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const certs = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Eletricidade — Certificações</h1>
        <Button onClick={() => router.push('/dashboard/certifications/new')}><Plus className="mr-2 h-4 w-4" /> Nova Certificação</Button>
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
                <th className="px-4 py-3">N.º Certificado</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Emissão</th>
                <th className="px-4 py-3">Expiração</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {certs.map((c: any) => (
                <tr key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/certifications/${c.id}`)}>
                  <td className="px-4 py-3 font-mono">{c.certNumber || '—'}</td>
                  <td className="px-4 py-3 font-medium">{c.clientName}</td>
                  <td className="px-4 py-3 text-gray-500">{c.certType?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-gray-500">{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString('pt-AO') : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('pt-AO') : '—'}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.status] ?? ''}`}>{STATUS_LABEL[c.status] ?? c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {certs.length === 0 && (
            <div className="p-12 text-center">
              <Award className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhuma certificação encontrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

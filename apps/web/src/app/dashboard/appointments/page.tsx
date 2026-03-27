'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Stethoscope, Plus } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { SCHEDULED: 'Agendada', CONFIRMED: 'Confirmada', IN_PROGRESS: 'Em Curso', COMPLETED: 'Concluída', CANCELLED: 'Cancelada', NO_SHOW: 'Não Compareceu' }
const STATUS_COLOR: Record<string, string> = { SCHEDULED: 'bg-blue-100 text-blue-700', CONFIRMED: 'bg-indigo-100 text-indigo-700', IN_PROGRESS: 'bg-purple-100 text-purple-700', COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-red-100 text-red-700', NO_SHOW: 'bg-gray-100 text-gray-700' }

export default function AppointmentsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['appointments', statusFilter, dateFilter],
    queryFn: () => api.get('/healthcare/appointments', { params: { status: statusFilter || undefined, date: dateFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const appointments = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Saúde — Consultas</h1>
        <Button onClick={() => router.push('/dashboard/appointments/new')}><Plus className="mr-2 h-4 w-4" /> Nova Consulta</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
        <input type="date" className="rounded-md border px-3 py-2 text-sm" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Paciente</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Médico</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Especialidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Data/Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointments.map((a: any) => (
                <tr key={a.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/appointments/${a.id}`)}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{a.patientName ?? a.patient?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{a.doctorName ?? a.doctor?.name ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{a.specialty ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{a.dateTime ? formatDateTime(a.dateTime) : '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[a.status] ?? ''}`}>{STATUS_LABEL[a.status] ?? a.status}</span>
                  </td>
                </tr>
              ))}
              {appointments.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Nenhuma consulta registada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

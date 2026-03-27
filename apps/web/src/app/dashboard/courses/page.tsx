'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { formatKwanza } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { GraduationCap, Plus } from 'lucide-react'

const STATUS_LABEL: Record<string, string> = { DRAFT: 'Rascunho', PUBLISHED: 'Publicado', ACTIVE: 'Activo', ARCHIVED: 'Arquivado', CANCELLED: 'Cancelado' }
const STATUS_COLOR: Record<string, string> = { DRAFT: 'bg-gray-100 text-gray-700', PUBLISHED: 'bg-blue-100 text-blue-700', ACTIVE: 'bg-green-100 text-green-700', ARCHIVED: 'bg-amber-100 text-amber-700', CANCELLED: 'bg-red-100 text-red-700' }

export default function CoursesPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['courses', statusFilter],
    queryFn: () => api.get('/education/courses', { params: { status: statusFilter || undefined, limit: 50 } }).then((r) => r.data),
  })

  const courses = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Educação — Cursos</h1>
        <Button onClick={() => router.push('/dashboard/courses/new')}><Plus className="mr-2 h-4 w-4" /> Novo Curso</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select className="rounded-md border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os estados</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
        </select>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Categoria</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Instrutor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Duração</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Preço</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {courses.map((c: any) => (
                <tr key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/courses/${c.id}`)}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{c.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.category ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.instructor ?? c.instructorName ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{c.duration ?? '—'}h</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{formatKwanza(c.price)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.status] ?? ''}`}>{STATUS_LABEL[c.status] ?? c.status}</span>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Nenhum curso registado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

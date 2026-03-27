'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HeartPulse, Plus, Search } from 'lucide-react'

const GENDER_LABEL: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino', OTHER: 'Outro' }

export default function PatientsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => api.get('/healthcare/patients', { params: { search: search || undefined, limit: 50 } }).then((r) => r.data),
  })

  const patients = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Saúde — Pacientes</h1>
        <Button onClick={() => router.push('/dashboard/patients/new')}><Plus className="mr-2 h-4 w-4" /> Novo Paciente</Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Pesquisar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Telefone</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Género</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tipo Sanguíneo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {patients.map((p: any) => (
                <tr key={p.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/patients/${p.id}`)}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{p.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{p.phone ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{p.email ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{GENDER_LABEL[p.gender] ?? p.gender ?? '—'}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{p.bloodType ?? '—'}</td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Nenhum paciente registado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

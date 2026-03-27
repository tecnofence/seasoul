'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, Plus, Search } from 'lucide-react'

const TYPE_LABEL: Record<string, string> = { INDIVIDUAL: 'Particular', COMPANY: 'Empresa', GOVERNMENT: 'Governo' }

export default function ClientsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => api.get('/crm', { params: { search: search || undefined, limit: 50 } }).then((r) => r.data),
  })

  const clients = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">CRM — Clientes</h1>
        <Button onClick={() => router.push('/dashboard/clients/new')}><Plus className="mr-2 h-4 w-4" /> Novo Cliente</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input placeholder="Pesquisar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? <p className="text-gray-500">A carregar...</p> : (
        <div className="overflow-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">NIF</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Cidade</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {clients.map((c: any) => (
                <tr key={c.id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/dashboard/clients/${c.id}`)}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.nif || '—'}</td>
                  <td className="px-4 py-3">{TYPE_LABEL[c.type] ?? c.type}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.city || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {clients.length === 0 && (
            <div className="p-12 text-center">
              <UserPlus className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-gray-500">Nenhum cliente encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, MoreVertical, Edit2, Shield, Eye } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function AdminTenantsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('')

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['admin-tenants', search, filterPlan],
    queryFn: () => api.get('/admin/tenants', { 
      params: { 
        search: search || undefined, 
        plan: filterPlan || undefined 
      } 
    }).then((r) => r.data.data),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas / Tenants</h1>
          <p className="text-sm text-gray-500">Gestão global de todas as organizações na plataforma.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por nome, NIF ou slug..."
              className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
            >
              <option value="">Todos os Planos</option>
              <option value="STARTER">Starter</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de Tenants */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-6 py-4">Empresa</th>
                <th className="px-6 py-4">Plano</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Módulos</th>
                <th className="px-6 py-4">Utilizadores</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-medium italic">
                    Carregando empresas...
                  </td>
                </tr>
              ) : tenants?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 font-medium italic">
                    Nenhuma empresa encontrada com estes filtros.
                  </td>
                </tr>
              ) : (
                tenants?.map((tenant: any) => (
                  <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold uppercase">
                          {tenant.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900">{tenant.name}</span>
                          <span className="text-[11px] text-gray-400 font-medium">{tenant.slug}.engeris.ao</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={tenant.plan === 'ENTERPRISE' ? 'success' : 'default'} className="bg-indigo-50 text-indigo-700 border-indigo-100">
                        {tenant.plan}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={cn("h-1.5 w-1.5 rounded-full", tenant.active ? "bg-green-500" : "bg-red-500")} />
                        <span className={tenant.active ? "text-green-700" : "text-red-700"}>
                          {tenant.active ? 'Ativa' : 'Suspensa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {tenant.modules?.map((m: any) => (
                          <span key={m.moduleId} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">
                            {m.moduleId}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {tenant._count?.users} / {tenant.maxUsers}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck,
  Package,
  History
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const AVAILABLE_MODULES = [
  { id: 'finance', name: 'Financeiro & Faturação', category: 'Core' },
  { id: 'hr', name: 'Gestão de RH & Assiduidade', category: 'Core' },
  { id: 'pms', name: 'Hospitalidade (PMS)', category: 'Vertical' },
  { id: 'pos', name: 'Ponto de Venda (POS)', category: 'Vertical' },
  { id: 'engineering', name: 'Engenharia & Projetos', category: 'Vertical' },
  { id: 'security', name: 'Segurança & Auditoria', category: 'Vertical' },
  { id: 'fleet', name: 'Gestão de Frotas', category: 'Operações' },
  { id: 'healthcare', name: 'Saúde & Clínicas', category: 'Vertical' },
  { id: 'agriculture', name: 'Agro & Indústria', category: 'Vertical' },
]

export default function TenantDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['admin-tenant', id],
    queryFn: () => api.get(`/admin/tenants/${id}`).then((r) => r.data.data),
  })

  const toggleModule = useMutation({
    mutationFn: ({ moduleId, active }: { moduleId: string, active: boolean }) => 
      api.post(`/admin/tenants/${id}/modules/${moduleId}/toggle`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] })
    }
  })

  if (isLoading) return <div className="p-8 text-center">Carregando detalhes...</div>
  if (!tenant) return <div className="p-8 text-center text-red-500">Empresa não encontrada.</div>

  const activeModuleIds = tenant.modules?.filter((m: any) => m.active).map((m: any) => m.moduleId) || []

  return (
    <div className="space-y-6">
      <Link href="/admin/tenants" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar para a lista
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Coluna Esquerda: Informação Geral */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl font-bold text-indigo-600">
                  {tenant.name[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{tenant.name}</h1>
                  <p className="text-gray-500">{tenant.slug}.engeris.ao</p>
                </div>
                <Badge className={cn("ml-auto", tenant.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  {tenant.active ? 'Ativa' : 'Suspensa'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-6 border-t pt-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">NIF / Identificação</label>
                  <p className="font-medium text-gray-700">{tenant.nif || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Plano Atual</label>
                  <p className="font-medium text-indigo-600">{tenant.plan}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Clientes Ativos</label>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700">{tenant._count?.users} / {tenant.maxUsers}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Filiais / Lojas</label>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-700">{tenant.branches?.length || 0} / {tenant.maxBranches}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gestão de Módulos */}
          <Card>
            <CardTitle className="border-b pb-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                <span>Módulos Ativos & Permissões</span>
              </div>
            </CardTitle>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {AVAILABLE_MODULES.map((mod) => (
                  <div key={mod.id} className={cn(
                    "flex flex-col p-4 rounded-xl border transition-all",
                    activeModuleIds.includes(mod.id) 
                      ? "border-indigo-200 bg-indigo-50/50" 
                      : "border-gray-100 bg-white opacity-60"
                  )}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-indigo-500">{mod.category}</span>
                        <h4 className="font-semibold text-gray-900">{mod.name}</h4>
                      </div>
                      <button 
                        onClick={() => toggleModule.mutate({ moduleId: mod.id, active: !activeModuleIds.includes(mod.id) })}
                        disabled={toggleModule.isPending}
                        className={cn(
                          "flex h-6 w-10 items-center rounded-full p-1 transition-colors",
                          activeModuleIds.includes(mod.id) ? "bg-indigo-600" : "bg-gray-200"
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                          activeModuleIds.includes(mod.id) ? "translate-x-4" : "translate-x-0"
                        )} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Sidebar Lateral de Status */}
        <div className="w-full lg:w-80 space-y-6">
           <Card className="bg-indigo-900 text-white">
             <CardTitle className="text-indigo-200">Ações Rápidas</CardTitle>
             <CardContent className="space-y-3 pt-4">
               <Button className="w-full justify-start bg-indigo-800 hover:bg-indigo-700">
                 <ShieldCheck className="mr-2 h-4 w-4" /> Suspender Conta
               </Button>
               <Button className="w-full justify-start bg-indigo-800 hover:bg-indigo-700">
                 <History className="mr-2 h-4 w-4" /> Ver Registos (Logs)
               </Button>
               <Button variant="outline" className="w-full justify-start border-indigo-700 text-indigo-100 hover:bg-indigo-800">
                 Resetar Palavra-passe Admin
               </Button>
             </CardContent>
           </Card>

           <Card>
             <CardTitle>Filiais Ativas</CardTitle>
             <CardContent className="pt-4 space-y-3">
               {tenant.branches?.length > 0 ? (
                 tenant.branches.map((b: any) => (
                   <div key={b.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 text-sm">
                     <MapPin className="h-4 w-4 text-gray-400" />
                     <span className="font-medium text-gray-700">{b.name}</span>
                   </div>
                 ))
               ) : (
                 <p className="text-xs text-gray-400 text-center py-4 italic">Nenhuma filial encontrada.</p>
               )}
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}

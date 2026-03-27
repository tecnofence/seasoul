'use client'

import { useEffect, useState } from 'react'
import { 
  ShoppingBag, 
  CreditCard, 
  Settings, 
  ShieldCheck, 
  Users, 
  Activity, 
  Heart, 
  Briefcase,
  Zap,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Module {
  id: string
  name: string
  description: string
  basePrice: number
  category: string
  isAvailable: boolean
}

const categoryIcons: Record<string, any> = {
  Core: Zap,
  Vertical: Briefcase,
  Operations: Activity,
  Infrastructure: ShieldCheck
}

export default function MarketplacePage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const resp = await fetch('http://localhost:3001/v1/admin/modules', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const json = await resp.json()
      setModules(json.data || [])
    } catch (err) {
      console.error('Failed to fetch modules', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-indigo-200">Carregando Marketplace...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-indigo-400" />
            Marketplace de Módulos
          </h1>
          <p className="text-indigo-200/60 mt-2">
            Gira os produtos e funcionalidades disponíveis na plataforma ENGERIS ONE.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
          <Zap className="w-4 h-4 mr-2" />
          Novo Produto
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const Icon = categoryIcons[mod.category] || Info
          return (
            <Card key={mod.id} className="relative overflow-hidden bg-slate-900/50 border-indigo-500/10 hover:border-indigo-500/30 transition-all duration-300 group">
              <div className="absolute top-0 right-0 p-4">
                <Badge className={mod.isAvailable ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border-rose-500/20'}>
                  {mod.isAvailable ? 'Ativo' : 'Indisponível'}
                </Badge>
              </div>

              <div className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6 text-indigo-400" />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white">{mod.name}</h3>
                  <p className="text-sm text-indigo-200/50 line-clamp-2 mt-1">{mod.description}</p>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-indigo-500/10">
                  <div className="space-y-1">
                    <p className="text-xs text-indigo-200/40 uppercase font-bold tracking-wider">Subscrição</p>
                    <p className="text-lg font-bold text-white">
                      {mod.basePrice === 0 ? 'Grátis' : `${mod.basePrice.toLocaleString('pt-AO')} Kz/mês`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10">
                    Configurar
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="bg-gradient-to-br from-indigo-900/20 to-slate-900/40 border-indigo-500/20 p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
        <div className="flex-1 space-y-4 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
            <CreditCard className="w-6 h-6" />
            Estrutura Comercial SaaS
          </h2>
          <p className="text-indigo-100/70 max-w-2xl leading-relaxed">
            Lembre-se: O coração do negócio é permitir que qualquer empresa, seja uma clínica, 
            hotel ou oficina, subscreva os módulos de forma independente. 
            A faturação será gerada automaticamente com base nos módulos ativos em cada Tenant.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-indigo-500/30 text-indigo-300">Relatórios</Button>
          <Button className="bg-indigo-600">Configurar Faturação</Button>
        </div>
      </Card>
    </div>
  )
}

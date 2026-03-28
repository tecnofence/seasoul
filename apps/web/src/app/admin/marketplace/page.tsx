'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
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
    <div className="p-10 max-w-[1600px] mx-auto space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tight flex items-center gap-4">
            <ShoppingBag className="w-12 h-12 text-indigo-400" />
            Marketplace de Módulos
          </h1>
          <p className="text-2xl text-indigo-200/60 mt-4 max-w-3xl leading-relaxed">
            Expanda as capacidades do seu ecossistema. Ative funcionalidades verticais 
            específicas para cada modelo de negócio com um clique.
          </p>
        </div>
        <Button size="lg" className="h-16 px-10 text-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-500/40 rounded-2xl transition-all hover:scale-105 active:scale-95">
          <Zap className="w-6 h-6 mr-3" />
          Novo Produto
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {modules.map((mod) => {
          const Icon = categoryIcons[mod.category] || Info
          return (
            <Card key={mod.id} className="relative overflow-hidden bg-slate-900/60 border-2 border-indigo-500/10 hover:border-indigo-500/40 transition-all duration-500 group hover:shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)]">
              <div className="absolute top-0 right-0 p-6">
                <Badge className={cn(
                  "px-4 py-1 text-sm font-bold tracking-wider uppercase",
                  mod.isAvailable ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border-rose-500/20'
                )}>
                  {mod.isAvailable ? 'Disponível' : 'Em Breve'}
                </Badge>
              </div>

              <div className="p-10 space-y-8">
                <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500">
                  <Icon className="w-10 h-10 text-indigo-400" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/70">{mod.category}</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white leading-tight">{mod.name}</h3>
                  <p className="text-lg text-indigo-200/50 leading-relaxed line-clamp-3">{mod.description}</p>
                </div>

                <div className="pt-8 flex items-center justify-between border-t-2 border-indigo-500/5">
                  <div className="space-y-1">
                    <p className="text-xs text-indigo-200/30 uppercase font-black tracking-widest">Investimento Mensal</p>
                    <p className="text-3xl font-black text-white">
                      {mod.basePrice === 0 ? 'Grátis' : `${mod.basePrice.toLocaleString('pt-AO')} Kz`}
                    </p>
                  </div>
                  <Button variant="outline" size="lg" className="h-14 px-8 border-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 text-lg font-bold rounded-xl">
                    Ativar Módulo
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="relative overflow-hidden bg-gradient-to-br from-indigo-600/20 via-slate-900/40 to-slate-950/60 border-2 border-indigo-500/30 p-12 flex flex-col xl:flex-row items-center gap-12 shadow-3xl rounded-[2.5rem]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(79,70,229,0.1),transparent)] pointer-events-none" />
        
        <div className="flex-1 space-y-6 text-center xl:text-left z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            Coração do Negócio
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Liberdade para escalar. <br/>
            <span className="text-indigo-400">Pague apenas o que a sua empresa usa.</span>
          </h2>
          <p className="text-xl text-indigo-100/60 max-w-3xl leading-relaxed">
            A arquitetura modular da ENGERIS ONE permite que clínicas, hotéis, oficinas ou grandes indústrias 
            partilhem o mesmo fôlego tecnológico, mas com ferramentas específicas. A faturação é 
            gerada dinamicamente com base nas suas subscrições ativas.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 z-10 min-w-[300px]">
          <Button variant="outline" size="lg" className="h-16 px-10 border-2 border-indigo-500/30 text-white text-lg font-bold hover:bg-white/5">
            Relatórios de Consumo
          </Button>
          <Button size="lg" className="h-16 px-10 bg-white text-indigo-950 text-lg font-black hover:bg-indigo-50 shadow-xl">
            Configurar Faturação
          </Button>
        </div>
      </Card>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, DollarSign, Wrench, Users, Printer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ── Tipos ──────────────────────────────────────────────────────────────────
type ReportCategory = {
  title: string
  description: string
  href: string
  icon: LucideIcon
}

// ── Categorias de relatórios hoteleiros ───────────────────────────────────
const CATEGORIES: ReportCategory[] = [
  {
    title: 'Relatórios Comerciais',
    description: 'Ocupação, receita por departamento, reservas por canal',
    href: '/dashboard/reports/commercial',
    icon: TrendingUp,
  },
  {
    title: 'Relatórios Financeiros',
    description: 'Receitas, despesas, resultado e faturação AGT',
    href: '/dashboard/reports/financial',
    icon: DollarSign,
  },
  {
    title: 'Relatórios Operacionais',
    description: 'Manutenção, housekeeping, segurança e inspeções',
    href: '/dashboard/reports/operational',
    icon: Wrench,
  },
  {
    title: 'Relatórios de RH',
    description: 'Colaboradores, assiduidade e custo salarial',
    href: '/dashboard/reports/hr',
    icon: Users,
  },
]

// ── Página ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios & BI</h1>
          <p className="mt-1 text-sm text-gray-500">
            Painéis analíticos e relatórios de negócio do resort
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="flex items-center gap-2 print:hidden"
        >
          <Printer className="h-4 w-4" />
          Exportar Tudo
        </Button>
      </div>

      {/* ── Grelha de categorias ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          return (
            <Link key={cat.href} href={cat.href} className="block">
              <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/30">
                <div className="flex items-start gap-5 p-2">
                  {/* Ícone grande */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>

                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{cat.description}</p>
                    <p className="mt-3 inline-flex items-center text-sm font-medium text-primary">
                      Ver Relatório
                      <span className="ml-1 transition-transform group-hover:translate-x-1" aria-hidden>
                        →
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* ── Nota de impressão ── */}
      <p className="text-xs text-gray-400 print:hidden">
        Clique em "Exportar Tudo" para imprimir ou guardar em PDF os relatórios desta página.
      </p>
    </div>
  )
}

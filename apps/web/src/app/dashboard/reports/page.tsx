'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import {
  Banknote,
  Wrench,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type ReportCategory = {
  title: string
  description: string
  href: string
  icon: LucideIcon
  color: string
  bgColor: string
}

const categories: ReportCategory[] = [
  // Financeiro
  {
    title: 'Relatórios Financeiros',
    description: 'Receitas, faturas, impostos e análise de clientes por volume de faturação.',
    href: '/dashboard/reports/financial',
    icon: Banknote,
    color: 'text-[#0A5C8A]',
    bgColor: 'bg-[#0A5C8A]/10',
  },
  // Operacional
  {
    title: 'Relatórios Operacionais',
    description: 'Projetos, incidentes, veículos, manutenção e contratos ativos.',
    href: '/dashboard/reports/operational',
    icon: Wrench,
    color: 'text-[#F59E0B]',
    bgColor: 'bg-[#F59E0B]/10',
  },
  // Comercial
  {
    title: 'Relatórios Comerciais',
    description: 'Pipeline de vendas, taxas de conversão, receita por tipo de cliente e tendências.',
    href: '/dashboard/reports/commercial',
    icon: TrendingUp,
    color: 'text-[#10B981]',
    bgColor: 'bg-[#10B981]/10',
  },
  // RH
  {
    title: 'Relatórios de RH',
    description: 'Colaboradores por departamento, assiduidade, salários e formação.',
    href: '/dashboard/reports/hr',
    icon: Users,
    color: 'text-[#6366F1]',
    bgColor: 'bg-[#6366F1]/10',
  },
]

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios & BI</h1>
        <p className="mt-1 text-sm text-gray-500">
          Painéis analíticos e relatórios de negócio
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {categories.map((cat) => (
          <Link key={cat.href} href={cat.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className={`rounded-lg p-3 ${cat.bgColor}`}>
                  <cat.icon className={`h-6 w-6 ${cat.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {cat.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {cat.description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

import { Card } from './card'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: ReactNode | string | number
  icon?: ReactNode
  trend?: { value: number; label: string }
  description?: ReactNode
  className?: string
}

export function StatCard({ title, value, icon, trend, description, className }: StatCardProps) {
  return (
    <Card className={cn('flex flex-col p-6', className)}>
      <div className="flex items-start justify-between w-full">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
        </div>
        {icon && <div className="text-primary/60">{icon}</div>}
      </div>
      
      {trend && (
        <p className={cn('mt-2 text-xs', trend.value >= 0 ? 'text-green-600' : 'text-red-600')}>
          {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
        </p>
      )}
      
      {description && (
        <div className="mt-2 text-xs text-gray-500">
          {description}
        </div>
      )}
    </Card>
  )
}

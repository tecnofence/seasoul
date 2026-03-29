import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  'aria-label'?: string
}

export function Badge({ className, variant = 'default', 'aria-label': ariaLabel, ...props }: BadgeProps) {
  const hasStatusRole = variant === 'warning' || variant === 'danger'

  return (
    <span
      role={hasStatusRole ? 'status' : undefined}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        {
          'bg-gray-100 text-gray-800': variant === 'default',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-amber-100 text-amber-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'danger',
          'bg-blue-100 text-blue-800': variant === 'info',
        },
        className,
      )}
      {...props}
    />
  )
}

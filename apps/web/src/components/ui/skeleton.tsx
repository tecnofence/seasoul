import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  'aria-label'?: string
}

export function Skeleton({ className, 'aria-label': ariaLabel }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel ?? 'A carregar...'}
      aria-busy="true"
      className={cn('animate-pulse rounded-md bg-gray-200', className)}
    >
      <span className="sr-only">{ariaLabel ?? 'A carregar...'}</span>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div role="status" aria-label="A carregar cartão..." className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <Skeleton className="mb-3 h-4 w-1/3" />
      <Skeleton className="mb-2 h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
      <span className="sr-only">A carregar...</span>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="A carregar tabela..." className="space-y-3">
      {/* Cabeçalho */}
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Linhas */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 py-2">
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} className={cn('h-4 flex-1', col === 0 && 'w-8 flex-none')} />
          ))}
        </div>
      ))}
      <span className="sr-only">A carregar...</span>
    </div>
  )
}

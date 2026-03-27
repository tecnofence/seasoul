'use client'

import { useContext, useEffect, useState } from 'react'
import { NotificationContext, type ToastItem } from '@/providers/notification-provider'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const toastConfig: Record<
  ToastItem['type'],
  { icon: typeof CheckCircle; bg: string; border: string; text: string }
> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
  },
}

function SingleToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)
  const config = toastConfig[toast.type]
  const Icon = config.icon

  useEffect(() => {
    // Animação de entrada
    const timer = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(timer)
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss(toast.id), 200)
  }

  return (
    <div
      className={cn(
        'pointer-events-auto w-80 rounded-lg border p-4 shadow-lg transition-all duration-200',
        config.bg,
        config.border,
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', config.text)} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm font-semibold', config.text)}>{toast.title}</p>
          {toast.message && (
            <p className={cn('mt-1 text-sm opacity-80', config.text)}>{toast.message}</p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className={cn('shrink-0 rounded p-1 transition-colors hover:bg-black/5', config.text)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function NotificationToastContainer() {
  const { toasts, removeToast } = useContext(NotificationContext)

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <SingleToast key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  )
}

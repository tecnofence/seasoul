'use client'

import { createContext, useCallback, useState, type ReactNode } from 'react'

// ── Tipos ────────────────────────────────────────
export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

export interface NotificationContextValue {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id'>) => void
  removeToast: (id: string) => void
}

export const NotificationContext = createContext<NotificationContextValue>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
})

// ── Provider ─────────────────────────────────────
let toastCounter = 0

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${++toastCounter}`
      setToasts((prev) => [...prev, { ...toast, id }])

      // Auto-dismiss após 5 segundos
      setTimeout(() => {
        removeToast(id)
      }, 5000)
    },
    [removeToast],
  )

  return (
    <NotificationContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </NotificationContext.Provider>
  )
}

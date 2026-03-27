'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDateTime } from '@/lib/utils'
import {
  Bell,
  CheckCheck,
  Mail,
  MailOpen,
  AlertTriangle,
  Package,
  FileText,
  Calendar,
  Wrench,
  ShieldAlert,
  Car,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Ícones por tipo de notificação
const typeIconMap: Record<string, typeof Bell> = {
  RESERVATION_CONFIRMED: Calendar,
  RESERVATION_REMINDER: Calendar,
  CHECKIN_READY: Calendar,
  PIN_GENERATED: ShieldAlert,
  CHECKOUT_REMINDER: Calendar,
  INVOICE_READY: FileText,
  STOCK_ALERT: Package,
  ATTENDANCE_MISSING: AlertTriangle,
  PAYROLL_PROCESSED: FileText,
  MAINTENANCE_ASSIGNED: Wrench,
  CONTRACT_EXPIRING: FileText,
  VEHICLE_MAINTENANCE_DUE: Car,
  CERTIFICATION_EXPIRING: Award,
  INCIDENT_SEVERITY: ShieldAlert,
}

function getNotificationIcon(type: string) {
  const Icon = typeIconMap[type] ?? Bell
  return Icon
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { recentUnread, unreadCount, markAsRead, markAllAsRead, isMarkingAllRead } =
    useNotifications()

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do sino */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border bg-white shadow-xl">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                disabled={isMarkingAllRead}
                className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
              >
                <span className="flex items-center gap-1">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar todas como lidas
                </span>
              </button>
            )}
          </div>

          {/* Lista de notificações */}
          <div className="max-h-80 overflow-y-auto">
            {recentUnread.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Bell className="mb-2 h-8 w-8" />
                <p className="text-sm">Sem notificações novas</p>
              </div>
            ) : (
              recentUnread.map((n: any) => {
                const isRead = !!n.readAt
                const Icon = getNotificationIcon(n.type)
                return (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-b-0',
                      !isRead
                        ? 'cursor-pointer bg-primary/5 hover:bg-primary/10'
                        : 'hover:bg-gray-50',
                    )}
                    onClick={() => {
                      if (!isRead) markAsRead(n.id)
                    }}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        !isRead ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-400',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm',
                          !isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-600',
                        )}
                      >
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                        {n.body ?? n.message}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>
                    {!isRead && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Rodapé */}
          <div className="border-t px-4 py-2">
            <Link
              href="/dashboard/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-sm font-medium text-primary hover:text-primary/80"
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

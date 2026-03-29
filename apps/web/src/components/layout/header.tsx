'use client'

import { useEffect, useState } from 'react'
import { getMe, type AuthUser } from '@/lib/auth'
import { Menu, User } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { LanguageSwitcher } from '@/components/language-switcher'

interface HeaderProps {
  onMenuClick?: () => void
  sidebarOpen?: boolean
}

export function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    getMe().then(setUser).catch(() => {})
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        aria-label="Abrir menu"
        aria-expanded={sidebarOpen}
        aria-controls="sidebar-nav"
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Espaçador desktop */}
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2 sm:gap-4">
        <LanguageSwitcher />
        <NotificationBell />
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="hidden font-medium text-gray-700 sm:inline">{user?.name ?? '...'}</span>
        </div>
      </div>
    </header>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { getMe, type AuthUser } from '@/lib/auth'
import { Bell, User } from 'lucide-react'

export function Header() {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    getMe().then(setUser).catch(() => {})
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative rounded-md p-2 text-gray-500 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <span className="font-medium text-gray-700">{user?.name ?? '...'}</span>
        </div>
      </div>
    </header>
  )
}

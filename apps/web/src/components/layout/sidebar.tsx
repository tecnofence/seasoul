'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  ShoppingCart,
  Package,
  BoxIcon,
  Users,
  Star,
  LogOut,
} from 'lucide-react'
import { logout } from '@/lib/auth'

const navItems = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/dashboard/reservations', label: 'Reservas', icon: CalendarDays },
  { href: '/dashboard/rooms', label: 'Quartos', icon: BedDouble },
  { href: '/dashboard/pos', label: 'POS', icon: ShoppingCart },
  { href: '/dashboard/products', label: 'Produtos', icon: Package },
  { href: '/dashboard/stock', label: 'Stock', icon: BoxIcon },
  { href: '/dashboard/hr', label: 'RH', icon: Users },
  { href: '/dashboard/reviews', label: 'Avaliações', icon: Star },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">Sea & Soul</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  )
}

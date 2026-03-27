'use client'

import { useEffect } from 'react'
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
  Truck,
  ClipboardCheck,
  Banknote,
  FileText,
  LogOut,
  X,
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
  { href: '/dashboard/attendance', label: 'Assiduidade', icon: ClipboardCheck },
  { href: '/dashboard/payroll', label: 'Salários', icon: Banknote },
  { href: '/dashboard/suppliers', label: 'Fornecedores', icon: Truck },
  { href: '/dashboard/invoices', label: 'Faturas', icon: FileText },
  { href: '/dashboard/reviews', label: 'Avaliações', icon: Star },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  // Fechar sidebar ao navegar (mobile)
  useEffect(() => {
    onClose?.()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-bold text-primary">Sea & Soul</h1>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
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
                <item.icon className="h-5 w-5 shrink-0" />
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
            <LogOut className="h-5 w-5 shrink-0" />
            Sair
          </button>
        </div>
      </aside>
    </>
  )
}

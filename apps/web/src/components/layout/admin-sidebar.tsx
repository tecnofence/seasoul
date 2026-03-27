'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Layers,
  Users,
  Shield,
  Settings,
  LogOut,
  X,
  CreditCard,
  Activity,
  ShoppingBag,
} from 'lucide-react'
import { logout } from '@/lib/auth'

const adminNavItems = [
  { href: '/admin', label: 'Painel Geral', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Empresas / Tenants', icon: Building2 },
  { href: '/admin/plans', label: 'Planos de Subscrição', icon: CreditCard },
  { href: '/admin/marketplace', label: 'Marketplace de Módulos', icon: ShoppingBag },
  { href: '/admin/users', label: 'Administradores', icon: Users },
  { href: '/admin/audit-log', label: 'Registos do Sistema', icon: Shield },
  { href: '/admin/analytics', label: 'Analytics Global', icon: Activity },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
]

interface AdminSidebarProps {
  open?: boolean
  onClose?: () => void
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname()

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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-indigo-950 text-indigo-100 transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-indigo-800 px-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Plataforma</span>
            <h1 className="text-lg font-bold text-white">SAAS ADMIN</h1>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-indigo-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-indigo-500">Menu Principal</p>
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-800 text-white'
                    : 'text-indigo-300 hover:bg-indigo-900 hover:text-white',
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-indigo-400")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-indigo-800 p-3">
          <Link href="/dashboard" className="mb-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-indigo-300 hover:bg-indigo-900 hover:text-white transition-colors">
             <Activity className="h-5 w-5 shrink-0 text-indigo-400" />
             Voltar ao ERP
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-indigo-300 transition-colors hover:bg-red-900/30 hover:text-red-400"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Sair do Portal
          </button>
        </div>
      </aside>
    </>
  )
}

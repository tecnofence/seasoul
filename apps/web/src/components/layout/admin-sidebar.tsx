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
  TrendingUp,
  Webhook,
  Key,
} from 'lucide-react'
import { logout } from '@/lib/auth'

const adminNavItems = [
  { href: '/admin', label: 'Painel Geral', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Empresas / Tenants', icon: Building2 },
  { href: '/admin/plans', label: 'Planos de Subscrição', icon: CreditCard },
  { href: '/admin/marketplace', label: 'Marketplace de Módulos', icon: ShoppingBag },
  { href: '/admin/billing', label: 'Faturação SaaS', icon: TrendingUp },
  { href: '/admin/users', label: 'Administradores', icon: Users },
  { href: '/admin/webhooks', label: 'Webhooks', icon: Webhook },
  { href: '/admin/api-keys', label: 'API Keys', icon: Key },
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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Administração</span>
            <h1 className="text-lg font-bold text-primary">ENGERIS ONE</h1>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Menu Principal</p>
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
              >
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-gray-400")} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <Link href="/dashboard" className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900">
             <Activity className="h-4 w-4 shrink-0 text-gray-400" />
             Voltar ao ERP
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Terminar Sessão
          </button>
        </div>
      </aside>
    </>
  )
}

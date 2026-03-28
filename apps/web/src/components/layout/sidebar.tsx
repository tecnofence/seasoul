'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  BedDouble,
  ShoppingCart,
  Package,
  BoxIcon,
  Users,
  UserCircle,
  UserCheck,
  Star,
  Truck,
  ClipboardCheck,
  Banknote,
  FileText,
  ConciergeBell,
  Wrench,
  Tag,
  Bell,
  Key,
  MessageSquare,
  Shield,
  FolderOpen,
  Building2,
  Settings,
  LogOut,
  X,
  Receipt,
  ShieldAlert,
  Route,
  Search,
  Award,
  Sparkles,
  CalendarHeart,
  Calculator,
  Compass,
  Store,
  BarChart3,
  Webhook,
  type LucideIcon,
} from 'lucide-react'
import { logout } from '@/lib/auth'

type CategoryId = 'core' | 'pms' | 'food_bev' | 'spa_leisure' | 'stock' | 'hr' | 'ops' | 'finance' | 'admin'

interface Category {
  id: CategoryId
  label: string
}

const categories: Category[] = [
  { id: 'core',        label: 'Plataforma' },
  { id: 'pms',         label: 'Hospitalidade' },
  { id: 'food_bev',    label: 'Restauração & Loja' },
  { id: 'spa_leisure', label: 'Spa & Lazer' },
  { id: 'stock',       label: 'Stock & Compras' },
  { id: 'hr',          label: 'Recursos Humanos' },
  { id: 'ops',         label: 'Operações' },
  { id: 'finance',     label: 'Financeiro' },
  { id: 'admin',       label: 'Administração' },
]

type NavItem = { href: string; label: string; icon: LucideIcon; module: string; category: CategoryId }

const allNavItems: NavItem[] = [
  // ── PLATAFORMA ──
  { href: '/dashboard',               label: 'Painel',           icon: LayoutDashboard, module: 'core',    category: 'core' },
  { href: '/dashboard/users',         label: 'Utilizadores',     icon: UserCircle,      module: 'core',    category: 'core' },
  { href: '/dashboard/notifications', label: 'Notificações',     icon: Bell,            module: 'core',    category: 'core' },
  { href: '/dashboard/reports',       label: 'Relatórios & BI',  icon: BarChart3,       module: 'core',    category: 'core' },
  { href: '/dashboard/chat',          label: 'Mensagens',        icon: MessageSquare,   module: 'core',    category: 'core' },

  // ── HOSPITALIDADE (PMS) ──
  { href: '/dashboard/reservations',  label: 'Reservas',         icon: CalendarDays,    module: 'pms',     category: 'pms' },
  { href: '/dashboard/rooms',         label: 'Quartos',          icon: BedDouble,       module: 'pms',     category: 'pms' },
  { href: '/dashboard/tariffs',       label: 'Tarifas',          icon: Tag,             module: 'pms',     category: 'pms' },
  { href: '/dashboard/guests',        label: 'Hóspedes',         icon: UserCheck,       module: 'pms',     category: 'pms' },
  { href: '/dashboard/locks',         label: 'Smart Locks',      icon: Key,             module: 'pms',     category: 'pms' },
  { href: '/dashboard/reviews',       label: 'Avaliações',       icon: Star,            module: 'pms',     category: 'pms' },
  { href: '/dashboard/service-orders',label: 'Pedidos de Quarto',icon: ConciergeBell,   module: 'pms',     category: 'pms' },

  // ── RESTAURAÇÃO & LOJA ──
  { href: '/dashboard/pos',           label: 'Frente de Caixa',  icon: ShoppingCart,    module: 'pos',     category: 'food_bev' },
  { href: '/dashboard/products',      label: 'Produtos & Menu',  icon: Package,         module: 'pos',     category: 'food_bev' },
  { href: '/dashboard/retail',        label: 'Loja do Resort',   icon: Store,           module: 'retail',  category: 'food_bev' },

  // ── SPA & LAZER ──
  { href: '/dashboard/spa',           label: 'Spa & Bem-Estar',  icon: Sparkles,        module: 'spa',     category: 'spa_leisure' },
  { href: '/dashboard/activities',    label: 'Atividades & Tours',icon: Compass,        module: 'activities', category: 'spa_leisure' },
  { href: '/dashboard/events',        label: 'Eventos',          icon: CalendarHeart,   module: 'events',  category: 'spa_leisure' },

  // ── STOCK & COMPRAS ──
  { href: '/dashboard/stock',         label: 'Stock / Armazém',  icon: BoxIcon,         module: 'stock',   category: 'stock' },
  { href: '/dashboard/suppliers',     label: 'Fornecedores',     icon: Truck,           module: 'stock',   category: 'stock' },

  // ── RECURSOS HUMANOS ──
  { href: '/dashboard/hr',            label: 'Colaboradores',    icon: Users,           module: 'hr',      category: 'hr' },
  { href: '/dashboard/attendance',    label: 'Assiduidade',      icon: ClipboardCheck,  module: 'hr',      category: 'hr' },
  { href: '/dashboard/payroll',       label: 'Salários',         icon: Banknote,        module: 'hr',      category: 'hr' },

  // ── OPERAÇÕES ──
  { href: '/dashboard/maintenance',   label: 'Manutenção',       icon: Wrench,          module: 'maintenance', category: 'ops' },
  { href: '/dashboard/inspections',   label: 'Inspeções',        icon: Search,          module: 'maintenance', category: 'ops' },
  { href: '/dashboard/certifications',label: 'Certificações',    icon: Award,           module: 'maintenance', category: 'ops' },
  { href: '/dashboard/patrols',       label: 'Rondas',           icon: Route,           module: 'security',category: 'ops' },
  { href: '/dashboard/security-contracts', label: 'Segurança',   icon: ShieldAlert,     module: 'security',category: 'ops' },

  // ── FINANCEIRO ──
  { href: '/dashboard/invoicing',     label: 'Faturação AGT',    icon: Receipt,         module: 'finance', category: 'finance' },
  { href: '/dashboard/invoices',      label: 'Faturas Emitidas', icon: FileText,        module: 'finance', category: 'finance' },
  { href: '/dashboard/accounting',    label: 'Contabilidade',    icon: Calculator,      module: 'finance', category: 'finance' },
  { href: '/dashboard/documents',     label: 'Documentos',       icon: FolderOpen,      module: 'core',    category: 'finance' },
  { href: '/dashboard/audit-log',     label: 'Auditoria',        icon: Shield,          module: 'core',    category: 'finance' },

  // ── ADMINISTRAÇÃO ──
  { href: '/dashboard/integrations',  label: 'Integrações',      icon: Webhook,         module: 'core',    category: 'admin' },
  { href: '/dashboard/tenants',       label: 'Tenants',          icon: Building2,       module: 'admin',   category: 'admin' },
  { href: '/dashboard/settings',      label: 'Configurações',    icon: Settings,        module: 'admin',   category: 'admin' },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  const { data: moduleData } = useQuery({
    queryKey: ['tenant-modules'],
    queryFn: () => api.get('/tenants/me/modules').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const activeModules: string[] = moduleData?.modules ?? ['*']
  const trainingMode: boolean = moduleData?.trainingMode ?? false
  const hasAllAccess = activeModules.includes('*')

  const visibleItems = allNavItems.filter((item) => {
    if (hasAllAccess) return true
    if (item.module === 'core') return true
    if (item.module === 'admin') return hasAllAccess
    return activeModules.includes(item.module)
  })

  useEffect(() => {
    onClose?.()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-white transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-bold text-primary">ENGERIS ONE</h1>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {trainingMode && (
          <div className="mx-3 mt-3 rounded-md bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-800">
            MODO FORMAÇÃO
          </div>
        )}

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
          {categories.map((category) => {
            const items = visibleItems.filter((item) => item.category === category.id)
            if (items.length === 0) return null

            return (
              <div key={category.id} className="space-y-1">
                <h3 className="px-3 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                  {category.label}
                </h3>
                {items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
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
                      <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : 'text-gray-400')} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        <div className="border-t p-4">
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

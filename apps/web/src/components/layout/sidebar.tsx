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
  GraduationCap,
  LogOut,
  X,
  Receipt,
  ShieldAlert,
  AlertTriangle,
  Route,
  HardHat,
  Zap,
  Search,
  Award,
  UserPlus,
  TrendingUp,
  Car,
  FileCheck,
  Sparkles,
  CalendarHeart,
  Home,
  PackageCheck,
  HeartPulse,
  Stethoscope,
  Wheat,
  Factory,
  Briefcase,
  Radio,
  Scale,
  Calculator,
  Compass,
  Store,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'
import { logout } from '@/lib/auth'

// Mapeamento de ícones por string (vindo do MODULE_REGISTRY)
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, CalendarDays, BedDouble, ShoppingCart, Package, BoxIcon,
  Users, UserCircle, UserCheck, Star, Truck, ClipboardCheck, Banknote,
  FileText, ConciergeBell, Wrench, Tag, Bell, Key, MessageSquare,
  Shield, FolderOpen, Building2, Settings, GraduationCap,
}

// Itens organizados por módulo
type NavItem = { href: string; label: string; icon: LucideIcon; module: string }

const allNavItems: NavItem[] = [
  // Core (sempre visível)
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard, module: 'core' },
  { href: '/dashboard/users', label: 'Utilizadores', icon: UserCircle, module: 'core' },
  { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare, module: 'core' },
  { href: '/dashboard/notifications', label: 'Notificações', icon: Bell, module: 'core' },
  { href: '/dashboard/documents', label: 'Documentos', icon: FolderOpen, module: 'core' },
  { href: '/dashboard/audit-log', label: 'Auditoria', icon: Shield, module: 'core' },
  // PMS — Hotelaria
  { href: '/dashboard/reservations', label: 'Reservas', icon: CalendarDays, module: 'pms' },
  { href: '/dashboard/rooms', label: 'Quartos', icon: BedDouble, module: 'pms' },
  { href: '/dashboard/tariffs', label: 'Tarifas', icon: Tag, module: 'pms' },
  { href: '/dashboard/guests', label: 'Hóspedes', icon: UserCheck, module: 'pms' },
  { href: '/dashboard/locks', label: 'Smart Locks', icon: Key, module: 'pms' },
  { href: '/dashboard/reviews', label: 'Avaliações', icon: Star, module: 'pms' },
  { href: '/dashboard/service-orders', label: 'Serviços', icon: ConciergeBell, module: 'pms' },
  // POS — Restauração
  { href: '/dashboard/pos', label: 'POS', icon: ShoppingCart, module: 'pos' },
  { href: '/dashboard/products', label: 'Produtos', icon: Package, module: 'pos' },
  // Manutenção
  { href: '/dashboard/maintenance', label: 'Manutenção', icon: Wrench, module: 'maintenance' },
  // Finanças
  { href: '/dashboard/invoices', label: 'Faturas', icon: FileText, module: 'finance' },
  { href: '/dashboard/invoicing', label: 'Faturação Universal', icon: Receipt, module: 'finance' },
  { href: '/dashboard/payroll', label: 'Salários', icon: Banknote, module: 'finance' },
  // Stock
  { href: '/dashboard/stock', label: 'Stock', icon: BoxIcon, module: 'stock' },
  { href: '/dashboard/suppliers', label: 'Fornecedores', icon: Truck, module: 'stock' },
  // RH
  { href: '/dashboard/hr', label: 'RH', icon: Users, module: 'hr' },
  { href: '/dashboard/attendance', label: 'Assiduidade', icon: ClipboardCheck, module: 'hr' },
  // Segurança Eletrónica
  { href: '/dashboard/security-contracts', label: 'Contratos Segurança', icon: ShieldAlert, module: 'security' },
  { href: '/dashboard/incidents', label: 'Incidentes', icon: AlertTriangle, module: 'security' },
  { href: '/dashboard/patrols', label: 'Patrulhas', icon: Route, module: 'security' },
  // Engenharia
  { href: '/dashboard/projects', label: 'Projetos Engenharia', icon: HardHat, module: 'engineering' },
  // Eletricidade
  { href: '/dashboard/electrical-projects', label: 'Projetos Elétricos', icon: Zap, module: 'electrical' },
  { href: '/dashboard/inspections', label: 'Inspeções', icon: Search, module: 'electrical' },
  { href: '/dashboard/certifications', label: 'Certificações', icon: Award, module: 'electrical' },
  // CRM
  { href: '/dashboard/clients', label: 'Clientes', icon: UserPlus, module: 'crm' },
  { href: '/dashboard/pipeline', label: 'Pipeline Vendas', icon: TrendingUp, module: 'crm' },
  // Frotas
  { href: '/dashboard/vehicles', label: 'Veículos', icon: Car, module: 'fleet' },
  // Contratos
  { href: '/dashboard/contracts', label: 'Contratos', icon: FileCheck, module: 'contracts' },
  // Spa & Bem-Estar
  { href: '/dashboard/spa', label: 'Spa', icon: Sparkles, module: 'spa' },
  // Eventos
  { href: '/dashboard/events', label: 'Eventos', icon: CalendarHeart, module: 'events' },
  // Imobiliário
  { href: '/dashboard/properties', label: 'Imóveis', icon: Home, module: 'real_estate' },
  // Logística
  { href: '/dashboard/shipments', label: 'Envios', icon: PackageCheck, module: 'logistics' },
  // Educação
  { href: '/dashboard/courses', label: 'Cursos', icon: GraduationCap, module: 'education' },
  // Saúde
  { href: '/dashboard/patients', label: 'Pacientes', icon: HeartPulse, module: 'healthcare' },
  { href: '/dashboard/appointments', label: 'Consultas', icon: Stethoscope, module: 'healthcare' },
  // Agricultura
  { href: '/dashboard/farms', label: 'Fazendas', icon: Wheat, module: 'agriculture' },
  // Manufatura
  { href: '/dashboard/production', label: 'Produção', icon: Factory, module: 'manufacturing' },
  // Consultoria
  { href: '/dashboard/consulting', label: 'Consultoria', icon: Briefcase, module: 'consulting' },
  // Telecomunicações
  { href: '/dashboard/telecom', label: 'Telecom', icon: Radio, module: 'telecom' },
  // Jurídico
  { href: '/dashboard/legal', label: 'Jurídico', icon: Scale, module: 'legal' },
  // Contabilidade
  { href: '/dashboard/accounting', label: 'Contabilidade', icon: Calculator, module: 'accounting' },
  // Relatórios & BI
  { href: '/dashboard/reports', label: 'Relatórios', icon: BarChart3, module: 'core' },
  // Atividades & Experiências
  { href: '/dashboard/activities', label: 'Atividades', icon: Compass, module: 'activities' },
  // Retalho
  { href: '/dashboard/retail', label: 'Retalho', icon: Store, module: 'retail' },
  // Admin (SUPER_ADMIN)
  { href: '/dashboard/tenants', label: 'Tenants', icon: Building2, module: 'admin' },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings, module: 'admin' },
  { href: '/dashboard/training', label: 'Modo Formação', icon: GraduationCap, module: 'admin' },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  // Buscar módulos ativos do tenant
  const { data: moduleData } = useQuery({
    queryKey: ['tenant-modules'],
    queryFn: () => api.get('/tenants/me/modules').then((r) => r.data.data),
    staleTime: 5 * 60 * 1000, // cache 5 minutos
    retry: 1,
  })

  const activeModules: string[] = moduleData?.modules ?? ['*']
  const trainingMode: boolean = moduleData?.trainingMode ?? false
  const hasAllAccess = activeModules.includes('*')

  // Filtrar itens visíveis baseado nos módulos ativos
  const visibleItems = allNavItems.filter((item) => {
    if (hasAllAccess) return true
    if (item.module === 'core') return true
    if (item.module === 'admin') return hasAllAccess // admin só para super admin
    return activeModules.includes(item.module)
  })

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
          <h1 className="text-xl font-bold text-primary">ENGERIS ONE</h1>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:text-gray-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Banner modo formação */}
        {trainingMode && (
          <div className="mx-3 mt-3 rounded-md bg-amber-100 px-3 py-2 text-center text-xs font-semibold text-amber-800">
            MODO FORMAÇÃO
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => {
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

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

// Categorias lógicas para organização do menu
type CategoryId = 'core' | 'finance' | 'hr' | 'pms' | 'pos' | 'ops' | 'eng' | 'vertical_health' | 'vertical_ind' | 'admin'

interface Category {
  id: CategoryId
  label: string
  isCore?: boolean
}

const categories: Category[] = [
  { id: 'core', label: 'Plataforma Core', isCore: true },
  { id: 'finance', label: 'Gestão Financeira', isCore: true },
  { id: 'hr', label: 'Gestão de Pessoal & RH', isCore: true },
  { id: 'pms', label: 'Hospitalidade & Reservas' },
  { id: 'pos', label: 'Vendas & POS' },
  { id: 'eng', label: 'Engenharia & Manutenção' },
  { id: 'vertical_health', label: 'Saúde & Clínicas' },
  { id: 'vertical_ind', label: 'Indústria & Produção' },
  { id: 'ops', label: 'Operações & Logística' },
  { id: 'admin', label: 'Administração' },
]

// Itens organizados por módulo e categoria
type NavItem = { href: string; label: string; icon: LucideIcon; module: string; category: CategoryId }

const allNavItems: NavItem[] = [
  // CATEGORIA: GERAL (CORE)
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard, module: 'core', category: 'core' },
  { href: '/dashboard/users', label: 'Utilizadores', icon: UserCircle, module: 'core', category: 'core' },
  { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare, module: 'core', category: 'core' },
  { href: '/dashboard/notifications', label: 'Notificações', icon: Bell, module: 'core', category: 'core' },
  { href: '/dashboard/documents', label: 'Documentos', icon: FolderOpen, module: 'core', category: 'core' },
  { href: '/dashboard/audit-log', label: 'Auditoria', icon: Shield, module: 'core', category: 'core' },
  { href: '/dashboard/reports', label: 'Relatórios', icon: BarChart3, module: 'core', category: 'core' },

  // CATEGORIA: FINANCEIRO (CORE)
  { href: '/dashboard/invoicing', label: 'Faturação', icon: Receipt, module: 'finance', category: 'finance' },
  { href: '/dashboard/invoices', label: 'Documentos Emitidos', icon: FileText, module: 'finance', category: 'finance' },
  { href: '/dashboard/accounting', label: 'Contabilidade', icon: Calculator, module: 'finance', category: 'finance' },
  { href: '/dashboard/legal', label: 'Jurídico', icon: Scale, module: 'finance', category: 'finance' },

  // CATEGORIA: GESTÃO & RH (CORE)
  { href: '/dashboard/hr', label: 'Recursos Humanos', icon: Users, module: 'hr', category: 'hr' },
  { href: '/dashboard/attendance', label: 'Assiduidade', icon: ClipboardCheck, module: 'hr', category: 'hr' },
  { href: '/dashboard/payroll', label: 'Processamento Salarial', icon: Banknote, module: 'finance', category: 'hr' },
  { href: '/dashboard/courses', label: 'Formação', icon: GraduationCap, module: 'education', category: 'hr' },

  // CATEGORIA: HOSPITALIDADE (PMS)
  { href: '/dashboard/reservations', label: 'Reservas', icon: CalendarDays, module: 'pms', category: 'pms' },
  { href: '/dashboard/rooms', label: 'Quartos', icon: BedDouble, module: 'pms', category: 'pms' },
  { href: '/dashboard/tariffs', label: 'Tarifas', icon: Tag, module: 'pms', category: 'pms' },
  { href: '/dashboard/guests', label: 'Hóspedes', icon: UserCheck, module: 'pms', category: 'pms' },
  { href: '/dashboard/locks', label: 'Smart Locks', icon: Key, module: 'pms', category: 'pms' },
  { href: '/dashboard/reviews', label: 'Avaliações', icon: Star, module: 'pms', category: 'pms' },
  { href: '/dashboard/service-orders', label: 'Pedidos de Quarto', icon: ConciergeBell, module: 'pms', category: 'pms' },
  { href: '/dashboard/spa', label: 'Spa & Bem-Estar', icon: Sparkles, module: 'spa', category: 'pms' },
  { href: '/dashboard/events', label: 'Gestão de Eventos', icon: CalendarHeart, module: 'events', category: 'pms' },

  // CATEGORIA: VENDAS & POS
  { href: '/dashboard/pos', label: 'Frente de Caixa (POS)', icon: ShoppingCart, module: 'pos', category: 'pos' },
  { href: '/dashboard/retail', label: 'Retalho', icon: Store, module: 'retail', category: 'pos' },
  { href: '/dashboard/clients', label: 'CRM / Clientes', icon: UserPlus, module: 'crm', category: 'pos' },
  { href: '/dashboard/pipeline', label: 'Pipeline de Vendas', icon: TrendingUp, module: 'crm', category: 'pos' },
  { href: '/dashboard/activities', label: 'Atividades / Tours', icon: Compass, module: 'activities', category: 'pos' },

  // CATEGORIA: OPERAÇÕES
  { href: '/dashboard/stock', label: 'Stock / Armazém', icon: BoxIcon, module: 'stock', category: 'ops' },
  { href: '/dashboard/products', label: 'Catálogo de Produtos', icon: Package, module: 'pos', category: 'ops' },
  { href: '/dashboard/suppliers', label: 'Fornecedores', icon: Truck, module: 'stock', category: 'ops' },
  { href: '/dashboard/vehicles', label: 'Frotas / Veículos', icon: Car, module: 'fleet', category: 'ops' },
  { href: '/dashboard/shipments', label: 'Logística / Envios', icon: PackageCheck, module: 'logistics', category: 'ops' },
  { href: '/dashboard/contracts', label: 'Gestão de Contratos', icon: FileCheck, module: 'contracts', category: 'ops' },

  // CATEGORIA: ENGENHARIA & MANUTENÇÃO
  { href: '/dashboard/maintenance', label: 'Manutenção Preventiva', icon: Wrench, module: 'engineering', category: 'eng' },
  { href: '/dashboard/projects', label: 'Projetos Civis', icon: HardHat, module: 'engineering', category: 'eng' },
  { href: '/dashboard/electrical-projects', label: 'Engenharia Elétrica', icon: Zap, module: 'engineering', category: 'eng' },
  { href: '/dashboard/inspections', label: 'Inspeções Técnicas', icon: Search, module: 'engineering', category: 'eng' },
  { href: '/dashboard/certifications', label: 'Certificações Qualidade', icon: Award, module: 'engineering', category: 'eng' },
  { href: '/dashboard/security-contracts', label: 'Segurança Eletrónica', icon: ShieldAlert, module: 'engineering', category: 'eng' },
  { href: '/dashboard/patrols', label: 'Rondas / Patrulhas', icon: Route, module: 'engineering', category: 'eng' },

  // CATEGORIA: VERTICAL SAÚDE
  { href: '/dashboard/patients', label: 'Pacientes', icon: HeartPulse, module: 'healthcare', category: 'vertical_health' },
  { href: '/dashboard/appointments', label: 'Agendamento Consultas', icon: Stethoscope, module: 'healthcare', category: 'vertical_health' },

  // CATEGORIA: INDÚSTRIA & AGRO
  { href: '/dashboard/farms', label: 'Gestão Agrícola', icon: Wheat, module: 'agriculture', category: 'vertical_ind' },
  { href: '/dashboard/production', label: 'Produção Industrial', icon: Factory, module: 'manufacturing', category: 'vertical_ind' },
  { href: '/dashboard/consulting', label: 'Consultoria Especializada', icon: Briefcase, module: 'consulting', category: 'vertical_ind' },
  { href: '/dashboard/telecom', label: 'Infraestrutura Telecom', icon: Radio, module: 'telecom', category: 'vertical_ind' },

  // CATEGORIA: ADMINISTRAÇÃO
  { href: '/dashboard/tenants', label: 'Gestão de Clientes (Tenants)', icon: Building2, module: 'admin', category: 'admin' },
  { href: '/dashboard/settings', label: 'Configurações Globais', icon: Settings, module: 'admin', category: 'admin' },
  { href: '/dashboard/properties', label: 'Património / Imóveis', icon: Home, module: 'real_estate', category: 'admin' },
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

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {categories.map((category) => {
            const categoryItems = visibleItems.filter((item) => item.category === category.id)
            if (categoryItems.length === 0) return null

            return (
              <div key={category.id} className="space-y-1">
                {/* Cabeçalho da Categoria */}
                <h3 className={cn(
                  "px-3 text-xs font-bold uppercase tracking-wider",
                  category.isCore ? "text-primary/70" : "text-gray-400"
                )}>
                  {category.label}
                </h3>

                <div className="mt-2 space-y-1">
                  {categoryItems.map((item) => {
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
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-gray-400")} />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
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

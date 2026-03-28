// ENGERIS ONE — Componentes e Estilos Partilhados
// Plataforma ERP Modular Multi-Indústria
// ENGERIS — engeris.co.ao

// ── CORES ─────────────────────────────────────

export const colors = {
  brand: {
    primary:   '#0A5C8A', // azul oceano
    secondary: '#1A8F6F', // verde mar
    accent:    '#F4A022', // dourado areia
  },
  status: {
    available:   '#16A34A',
    occupied:    '#DC2626',
    maintenance: '#D97706',
    cleaning:    '#2563EB',
  },
  resort: {
    caboLedo: '#0A5C8A',
    sangano:  '#1A8F6F',
  },
  neutral: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
} as const

// ── VARIANTES DE ESTADO ───────────────────────

export type BadgeVariant =
  | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export const reservationStatusVariant: Record<string, BadgeVariant> = {
  CONFIRMED:   'info',
  CHECKED_IN:  'success',
  CHECKED_OUT: 'neutral',
  CANCELLED:   'danger',
  NO_SHOW:     'warning',
}

export const roomStatusVariant: Record<string, BadgeVariant> = {
  AVAILABLE:   'success',
  OCCUPIED:    'danger',
  MAINTENANCE: 'warning',
  CLEANING:    'info',
}

export const ticketPriorityVariant: Record<string, BadgeVariant> = {
  LOW:    'neutral',
  MEDIUM: 'info',
  HIGH:   'warning',
  URGENT: 'danger',
}

export const serviceOrderStatusVariant: Record<string, BadgeVariant> = {
  PENDING:     'warning',
  CONFIRMED:   'info',
  IN_PROGRESS: 'info',
  COMPLETED:   'success',
  CANCELLED:   'danger',
}

// ── LABELS PT ─────────────────────────────────

export const roomTypeLabel: Record<string, string> = {
  STANDARD: 'Standard',
  SUPERIOR: 'Superior',
  SUITE:    'Suite',
  VILLA:    'Villa',
}

export const reservationStatusLabel: Record<string, string> = {
  CONFIRMED:   'Confirmada',
  CHECKED_IN:  'Check-in',
  CHECKED_OUT: 'Check-out',
  CANCELLED:   'Cancelada',
  NO_SHOW:     'Não compareceu',
}

export const paymentMethodLabel: Record<string, string> = {
  CASH:        'Numerário',
  CARD:        'Cartão',
  ROOM_CHARGE: 'Débito no quarto',
  TRANSFER:    'Transferência',
}

export const bookingSourceLabel: Record<string, string> = {
  DIRECT:      'Direto',
  WEBSITE:     'Website',
  PHONE:       'Telefone',
  BOOKING_COM: 'Booking.com',
  EXPEDIA:     'Expedia',
  AIRBNB:      'Airbnb',
  OTHER:       'Outro',
}

export const serviceOrderTypeLabel: Record<string, string> = {
  ROOM_SERVICE: 'Room Service',
  HOUSEKEEPING: 'Limpeza',
  SPA:          'Spa',
  RESTAURANT:   'Restaurante',
  ACTIVITY:     'Atividade',
  TRANSPORT:    'Transporte',
  OTHER:        'Outro',
}

export const attendanceTypeLabel: Record<string, string> = {
  ENTRY:       'Entrada',
  EXIT:        'Saída',
  BREAK_START: 'Início Pausa',
  BREAK_END:   'Fim Pausa',
}

// ── CONFIGURAÇÕES DE TABELAS ───────────────────

export type TableColumn<T> = {
  key: keyof T | string
  label: string
  sortable?: boolean
  width?: number | string
  align?: 'left' | 'center' | 'right'
}

// ── TIPOS DE FORMULÁRIO ───────────────────────

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
}

export type DateRange = {
  from: Date | null
  to:   Date | null
}

// ── REGISTRO DE MÓDULOS ─────────────────────────

export const MODULE_REGISTRY: Record<string, {
  name: string
  description: string
  category: 'core' | 'vertical' | 'transversal' | 'addon'
  icon: string
  dependencies: string[]
  sidebarItems: { href: string; label: string; icon: string }[]
}> = {
  core: {
    name: 'Core',
    description: 'Autenticação, utilizadores, dashboard, auditoria, notificações',
    category: 'core',
    icon: 'Shield',
    dependencies: [],
    sidebarItems: [
      { href: '/dashboard', label: 'Painel', icon: 'LayoutDashboard' },
      { href: '/dashboard/users', label: 'Utilizadores', icon: 'UserCircle' },
      { href: '/dashboard/chat', label: 'Chat', icon: 'MessageSquare' },
      { href: '/dashboard/notifications', label: 'Notificações', icon: 'Bell' },
      { href: '/dashboard/documents', label: 'Documentos', icon: 'FolderOpen' },
      { href: '/dashboard/audit-log', label: 'Auditoria', icon: 'Shield' },
    ],
  },
  pms: {
    name: 'Hotelaria (PMS)',
    description: 'Reservas, quartos, tarifas, check-in/out, smart locks, hóspedes',
    category: 'vertical',
    icon: 'BedDouble',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/reservations', label: 'Reservas', icon: 'CalendarDays' },
      { href: '/dashboard/rooms', label: 'Quartos', icon: 'BedDouble' },
      { href: '/dashboard/tariffs', label: 'Tarifas', icon: 'Tag' },
      { href: '/dashboard/guests', label: 'Hóspedes', icon: 'UserCheck' },
      { href: '/dashboard/locks', label: 'Smart Locks', icon: 'Key' },
      { href: '/dashboard/reviews', label: 'Avaliações', icon: 'Star' },
      { href: '/dashboard/service-orders', label: 'Serviços', icon: 'ConciergeBell' },
    ],
  },
  pos: {
    name: 'Restauração (POS)',
    description: 'Ponto de venda, produtos, vendas, mesas',
    category: 'vertical',
    icon: 'ShoppingCart',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/pos', label: 'POS', icon: 'ShoppingCart' },
      { href: '/dashboard/products', label: 'Produtos', icon: 'Package' },
    ],
  },
  engineering: {
    name: 'Engenharia & Construção',
    description: 'Projetos, obras, orçamentos técnicos, autos de medição',
    category: 'vertical',
    icon: 'HardHat',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/projects', label: 'Projetos', icon: 'FolderKanban' },
      { href: '/dashboard/works', label: 'Obras', icon: 'HardHat' },
      { href: '/dashboard/budgets', label: 'Orçamentos', icon: 'Calculator' },
    ],
  },
  security: {
    name: 'Segurança Eletrónica',
    description: 'Contratos, instalações, CCTV, alarmes, rondas, incidentes',
    category: 'vertical',
    icon: 'Camera',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/security-contracts', label: 'Contratos', icon: 'FileCheck' },
      { href: '/dashboard/installations', label: 'Instalações', icon: 'Camera' },
      { href: '/dashboard/incidents', label: 'Incidentes', icon: 'AlertTriangle' },
      { href: '/dashboard/patrols', label: 'Rondas', icon: 'Route' },
    ],
  },
  electrical: {
    name: 'Eletricidade & Energia',
    description: 'Projetos elétricos, instalações, certificação, inspeções',
    category: 'vertical',
    icon: 'Zap',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/electrical-projects', label: 'Projetos', icon: 'Zap' },
      { href: '/dashboard/inspections', label: 'Inspeções', icon: 'ClipboardCheck' },
      { href: '/dashboard/certifications', label: 'Certificações', icon: 'Award' },
    ],
  },
  maintenance: {
    name: 'Serviços & Manutenção',
    description: 'Tickets, ordens de serviço, SLA, manutenção preventiva',
    category: 'vertical',
    icon: 'Wrench',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/maintenance', label: 'Manutenção', icon: 'Wrench' },
    ],
  },
  spa: {
    name: 'Spa & Wellness',
    description: 'Tratamentos, terapeutas, agendamento, pacotes',
    category: 'vertical',
    icon: 'Sparkles',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/spa', label: 'Spa', icon: 'Sparkles' },
    ],
  },
  events: {
    name: 'Eventos & Conferências',
    description: 'Reserva de salas, catering, timeline, contratos',
    category: 'vertical',
    icon: 'Calendar',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/events', label: 'Eventos', icon: 'Calendar' },
    ],
  },
  activities: {
    name: 'Atividades & Experiências',
    description: 'Tours, desporto, passeios, agendamento, guias',
    category: 'vertical',
    icon: 'Compass',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/activities', label: 'Atividades', icon: 'Compass' },
    ],
  },
  healthcare: {
    name: 'Saúde & Clínicas',
    description: 'Pacientes, consultas, agendamento, prontuários',
    category: 'vertical',
    icon: 'Heart',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/patients', label: 'Pacientes', icon: 'Heart' },
      { href: '/dashboard/appointments', label: 'Consultas', icon: 'Stethoscope' },
    ],
  },
  education: {
    name: 'Educação & Formação',
    description: 'Alunos, turmas, professores, avaliações, certificados',
    category: 'vertical',
    icon: 'GraduationCap',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/students', label: 'Alunos', icon: 'GraduationCap' },
      { href: '/dashboard/classes', label: 'Turmas', icon: 'BookOpen' },
    ],
  },
  logistics: {
    name: 'Logística & Armazéns',
    description: 'Armazéns, expedição, receção, rotas de entrega',
    category: 'vertical',
    icon: 'Warehouse',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/warehouses', label: 'Armazéns', icon: 'Warehouse' },
      { href: '/dashboard/shipments', label: 'Expedição', icon: 'PackageCheck' },
    ],
  },
  agriculture: {
    name: 'Agricultura & Agro',
    description: 'Parcelas, culturas, colheitas, equipamentos',
    category: 'vertical',
    icon: 'Leaf',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/farms', label: 'Parcelas', icon: 'Leaf' },
      { href: '/dashboard/harvests', label: 'Colheitas', icon: 'Wheat' },
    ],
  },
  realestate: {
    name: 'Imobiliário',
    description: 'Imóveis, contratos, rendas, visitas, proprietários',
    category: 'vertical',
    icon: 'Building',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/properties', label: 'Imóveis', icon: 'Building' },
      { href: '/dashboard/leases', label: 'Contratos', icon: 'FileText' },
    ],
  },
  retail: {
    name: 'Retalho & Lojas',
    description: 'Lojas, caixas, inventário, promoções',
    category: 'vertical',
    icon: 'Store',
    dependencies: ['core', 'pos'],
    sidebarItems: [
      { href: '/dashboard/stores', label: 'Lojas', icon: 'Store' },
    ],
  },
  manufacturing: {
    name: 'Indústria & Fábricas',
    description: 'Produção, linhas, ordens de fabrico, qualidade',
    category: 'vertical',
    icon: 'Factory',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/production', label: 'Produção', icon: 'Factory' },
      { href: '/dashboard/quality', label: 'Qualidade', icon: 'CheckCircle' },
    ],
  },
  telecom: {
    name: 'Telecomunicações',
    description: 'Clientes, assinaturas, torres, instalações, suporte',
    category: 'vertical',
    icon: 'Radio',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/subscriptions', label: 'Assinaturas', icon: 'Radio' },
      { href: '/dashboard/towers', label: 'Torres', icon: 'Signal' },
    ],
  },
  legal: {
    name: 'Jurídico & Advocacia',
    description: 'Processos, clientes, prazos, honorários',
    category: 'vertical',
    icon: 'Scale',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/cases', label: 'Processos', icon: 'Scale' },
    ],
  },
  accounting: {
    name: 'Contabilidade',
    description: 'Plano de contas, lançamentos, balancetes, demonstrações',
    category: 'vertical',
    icon: 'Calculator',
    dependencies: ['core', 'finance'],
    sidebarItems: [
      { href: '/dashboard/accounting', label: 'Contabilidade', icon: 'Calculator' },
    ],
  },
  consulting: {
    name: 'Consultoria',
    description: 'Projetos, horas, propostas, deliverables',
    category: 'vertical',
    icon: 'Briefcase',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/consulting', label: 'Projetos', icon: 'Briefcase' },
    ],
  },
  finance: {
    name: 'Finanças & Faturação',
    description: 'FT, FR, NC, ORC, PF, RC — conformidade AGT, modo formação',
    category: 'transversal',
    icon: 'Banknote',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/invoices', label: 'Faturas', icon: 'FileText' },
      { href: '/dashboard/payroll', label: 'Salários', icon: 'Banknote' },
    ],
  },
  stock: {
    name: 'Stock & Compras',
    description: 'Inventário, fornecedores, ordens de compra, requisições',
    category: 'transversal',
    icon: 'BoxIcon',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/stock', label: 'Stock', icon: 'BoxIcon' },
      { href: '/dashboard/suppliers', label: 'Fornecedores', icon: 'Truck' },
    ],
  },
  hr: {
    name: 'RH & Pessoal',
    description: 'Colaboradores, assiduidade, salários, férias, geofencing GPS',
    category: 'transversal',
    icon: 'Users',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/hr', label: 'RH', icon: 'Users' },
      { href: '/dashboard/attendance', label: 'Assiduidade', icon: 'ClipboardCheck' },
    ],
  },
  crm: {
    name: 'CRM & Clientes',
    description: 'Base de clientes, pipeline, propostas, campanhas',
    category: 'transversal',
    icon: 'UserPlus',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/clients', label: 'Clientes', icon: 'UserPlus' },
      { href: '/dashboard/pipeline', label: 'Pipeline', icon: 'TrendingUp' },
    ],
  },
  fleet: {
    name: 'Frotas & Logística',
    description: 'Veículos, motoristas, combustível, manutenção, rotas',
    category: 'transversal',
    icon: 'Car',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/vehicles', label: 'Veículos', icon: 'Car' },
      { href: '/dashboard/drivers', label: 'Motoristas', icon: 'UserCheck' },
    ],
  },
  contracts: {
    name: 'Contratos & Jurídico',
    description: 'Gestão de contratos, renovações, alertas de expiração',
    category: 'transversal',
    icon: 'FileCheck',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/contracts', label: 'Contratos', icon: 'FileCheck' },
    ],
  },
  bi: {
    name: 'BI & Relatórios',
    description: 'Dashboards customizáveis, exportação, relatórios agendados',
    category: 'transversal',
    icon: 'BarChart3',
    dependencies: ['core'],
    sidebarItems: [
      { href: '/dashboard/reports', label: 'Relatórios', icon: 'BarChart3' },
    ],
  },
}

// Planos e módulos incluídos
export const PLAN_MODULES: Record<string, string[]> = {
  starter:      ['core'],
  professional: ['core', 'finance', 'stock', 'hr'],
  enterprise:   Object.keys(MODULE_REGISTRY),
  custom:       [], // definido por tenant
}

// ── CONSTANTES DE NEGÓCIO ─────────────────────

// IVA Angola — Lei 7/19 + Lei 32/21 + Decreto Presidencial 71/25
export const ANGOLA_TAX_RATE         = 14  // Taxa padrão (%)
export const ANGOLA_HOTEL_TAX_RATE   = 7   // Hotelaria & restauração (Art. 14.º/2 Lei 32/21) — condicional às 4 exigências AGT
export const ANGOLA_FOOD_TAX_RATE    = 7   // Alimentos Anexo I Lei 32/21 (carnes, peixe, leite, arroz, farinhas, óleos, etc.)
export const ANGOLA_AGRI_TAX_RATE    = 5   // Agrícola Anexo I (animais vivos, sementes, fertilizantes)
export const ANGOLA_EXEMPT_RATE      = 0   // Isenções (medicamentos, livros, etc.)

// Imposto Cativo — retenção na fonte por tipo de cliente (Art. 21.º/6 CIVA)
export const AGT_CATIVO_STATE_PCT    = 100 // Entidades estatais e autarquias retêm 100% do IVA
export const AGT_CATIVO_BANK_PCT     = 50  // Bancos, seguradoras, telecoms retêm 50% do IVA
export const AGT_CATIVO_OIL_PCT      = 100 // Empresas petrolíferas retêm 100%

// Prazos legais
export const AGT_INVOICE_DEADLINE_DAYS = 5 // Prazo de emissão: 5 dias úteis (Art. 8.º/1 DP 71/25)

// Categorias fiscais para produtos e serviços
export const TAX_CATEGORIES = {
  STANDARD:      { rate: 14, label: 'Taxa Normal 14%',           description: 'Retalho, serviços gerais' },
  HOTEL_SERVICE: { rate: 7,  label: 'Hotelaria & Restauração 7%', description: 'Alojamento, restaurante, bar, spa — taxa condicional AGT' },
  FOOD_REDUCED:  { rate: 7,  label: 'Alimentos Reduzidos 7%',    description: 'Carnes, peixe, leite, arroz, farinhas, óleos (Anexo I)' },
  AGRI_REDUCED:  { rate: 5,  label: 'Agrícola Reduzido 5%',      description: 'Animais vivos, sementes, fertilizantes (Anexo I)' },
  EXEMPT:        { rate: 0,  label: 'Isento',                    description: 'Medicamentos, livros, transporte público' },
} as const

export type TaxCategory = keyof typeof TAX_CATEGORIES

// Tipos de cliente para imposto cativo
export const CLIENT_CATIVO_TYPES = {
  PRIVATE:    { cativoPct: 0,   label: 'Particular / Empresa Privada' },
  STATE:      { cativoPct: 100, label: 'Entidade Estatal / Autarquia' },
  BANK:       { cativoPct: 50,  label: 'Banco / Seguradora / Telecom' },
  OIL:        { cativoPct: 100, label: 'Empresa Petrolífera' },
} as const

export type ClientCativoType = keyof typeof CLIENT_CATIVO_TYPES

export const DEFAULT_CHECKIN_HOUR  = 14  // 14:00
export const DEFAULT_CHECKOUT_HOUR = 12  // 12:00
export const NORMAL_DAILY_HOURS    = 8
export const WORKING_DAYS_MONTH    = 22  // média Angola
export const AGT_INVOICE_SERIES    = 'FT'

export const SUPPORTED_LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
] as const

export type SupportedLanguage = 'pt' | 'en' | 'fr' | 'es'

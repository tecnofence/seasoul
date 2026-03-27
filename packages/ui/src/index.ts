// Sea and Soul ERP — Componentes e Estilos Partilhados
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

// ── CONSTANTES DE NEGÓCIO ─────────────────────

export const ANGOLA_TAX_RATE    = 14     // IVA Angola (%)
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

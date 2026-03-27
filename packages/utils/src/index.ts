// Sea and Soul ERP — Utilitários Partilhados
// ENGERIS — engeris.co.ao

// ── FORMATAÇÃO ────────────────────────────────

/** Formata valor em Kwanza Angolano */
export function formatKwanza(amount: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Formata data no padrão PT (dd/mm/aaaa) */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

/** Formata data + hora no padrão PT */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('pt-AO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/** Formata número de horas (ex: 1.5 → "1h 30m") */
export function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ── DATAS ─────────────────────────────────────

/** Calcula número de noites entre check-in e check-out */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  const cin  = new Date(checkIn)
  const cout = new Date(checkOut)
  cin.setHours(0, 0, 0, 0)
  cout.setHours(0, 0, 0, 0)
  return Math.max(1, Math.round((cout.getTime() - cin.getTime()) / (1000 * 60 * 60 * 24)))
}

/** Verifica se uma data está entre dois limites (inclusivo) */
export function isDateBetween(date: Date | string, from: Date | string, to: Date | string): boolean {
  const d = new Date(date).getTime()
  return d >= new Date(from).getTime() && d <= new Date(to).getTime()
}

/** Verifica se dois intervalos de datas se sobrepõem */
export function datesOverlap(
  aFrom: Date | string, aTo: Date | string,
  bFrom: Date | string, bTo: Date | string,
): boolean {
  return new Date(aFrom) < new Date(bTo) && new Date(aTo) > new Date(bFrom)
}

/** Retorna o primeiro e último dia de um mês */
export function getMonthRange(year: number, month: number): { from: Date; to: Date } {
  return {
    from: new Date(year, month - 1, 1),
    to:   new Date(year, month, 0, 23, 59, 59, 999),
  }
}

// ── GPS / GEOFENCING ──────────────────────────

/** Verifica se coordenadas estão dentro do geofence de um resort */
export function isWithinGeofence(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
): boolean {
  const R    = 6_371_000 // raio da Terra em metros
  const dLat = ((lat - centerLat) * Math.PI) / 180
  const dLng = ((lng - centerLng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((centerLat * Math.PI) / 180) *
    Math.cos((lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return distance <= radiusMeters
}

/** Calcula distância em metros entre dois pontos GPS */
export function gpsDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R    = 6_371_000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── FATURAÇÃO ─────────────────────────────────

/** Gera número de fatura no formato AGT: "FT SÉRIE/NNNNN" */
export function generateInvoiceNumber(series: string, sequence: number): string {
  return `FT ${series}/${String(sequence).padStart(5, '0')}`
}

/** Calcula IVA a partir de um valor com IVA incluído */
export function extractTax(totalWithTax: number, taxRate: number): {
  baseAmount: number
  taxAmount: number
} {
  const base = totalWithTax / (1 + taxRate / 100)
  return {
    baseAmount: Math.round(base * 100) / 100,
    taxAmount:  Math.round((totalWithTax - base) * 100) / 100,
  }
}

/** Calcula IVA a partir de um valor sem IVA */
export function applyTax(baseAmount: number, taxRate: number): {
  totalAmount: number
  taxAmount: number
} {
  const tax = (baseAmount * taxRate) / 100
  return {
    totalAmount: Math.round((baseAmount + tax) * 100) / 100,
    taxAmount:   Math.round(tax * 100) / 100,
  }
}

// ── RECURSOS HUMANOS ──────────────────────────

/** Calcula horas trabalhadas entre dois timestamps */
export function calculateWorkedHours(entry: Date | string, exit: Date | string): number {
  const ms = new Date(exit).getTime() - new Date(entry).getTime()
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100
}

/** Calcula horas extra (acima de normalDailyHours) */
export function calculateOvertimeHours(
  workedHours: number,
  normalDailyHours = 8,
): number {
  return Math.max(0, Math.round((workedHours - normalDailyHours) * 100) / 100)
}

/** Calcula desconto por faltas */
export function calculateAbsenceDeduction(
  baseSalary: number,
  workingDaysInMonth: number,
  absenceDays: number,
): number {
  if (workingDaysInMonth === 0) return 0
  const dailyRate = baseSalary / workingDaysInMonth
  return Math.round(dailyRate * absenceDays * 100) / 100
}

// ── SEGURANÇA ─────────────────────────────────

/**
 * Gera PIN numérico para fechadura.
 * NOTA: para uso seguro em produção, usar crypto.randomInt() no servidor.
 */
export function generateAccessPin(length = 6): string {
  const digits = Array.from({ length }, () => Math.floor(Math.random() * 10))
  return digits.join('')
}

/** Máscara o PIN para exibição (ex: 123456 → "****56") */
export function maskPin(pin: string): string {
  return pin.slice(0, -2).replace(/./g, '*') + pin.slice(-2)
}

// ── STRINGS ───────────────────────────────────

/** Converte texto para slug URL-safe */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Capitaliza primeira letra de cada palavra */
export function titleCase(text: string): string {
  return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

/** Trunca texto com reticências */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// ── OCUPAÇÃO / ANALYTICS ──────────────────────

/** Calcula taxa de ocupação */
export function calculateOccupancy(occupiedRooms: number, totalRooms: number): number {
  if (totalRooms === 0) return 0
  return Math.round((occupiedRooms / totalRooms) * 100 * 10) / 10
}

/** Calcula RevPAR (Revenue Per Available Room) */
export function calculateRevPAR(totalRevenue: number, totalRooms: number): number {
  if (totalRooms === 0) return 0
  return Math.round((totalRevenue / totalRooms) * 100) / 100
}

/** Calcula ADR (Average Daily Rate) */
export function calculateADR(totalRevenue: number, occupiedRoomNights: number): number {
  if (occupiedRoomNights === 0) return 0
  return Math.round((totalRevenue / occupiedRoomNights) * 100) / 100
}

// ── VALIDAÇÃO ─────────────────────────────────

/** Valida NIF angolano (9 dígitos) */
export function isValidNIF(nif: string): boolean {
  return /^\d{9}$/.test(nif.replace(/\s/g, ''))
}

/** Valida telefone angolano (+244 9xx xxx xxx) */
export function isValidAngolanPhone(phone: string): boolean {
  return /^(\+244|244)?[9][0-9]{8}$/.test(phone.replace(/\s/g, ''))
}

/** Formata telefone angolano para exibição */
export function formatAngolanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^244/, '')
  if (digits.length === 9) {
    return `+244 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return phone
}

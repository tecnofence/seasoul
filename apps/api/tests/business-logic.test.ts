import { describe, it, expect } from 'vitest'

// ── GPS / GEOFENCING ──────────────────────────

// Replicar a função Haversine do módulo de attendance
function gpsDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

describe('GPS / Geofencing', () => {
  const CABO_LEDO = { lat: -9.0333, lng: 13.2333 }
  const SANGANO = { lat: -9.1000, lng: 13.1500 }
  const GEOFENCE_RADIUS = 300 // metros

  it('distância entre mesmo ponto é 0', () => {
    const d = gpsDistance(CABO_LEDO.lat, CABO_LEDO.lng, CABO_LEDO.lat, CABO_LEDO.lng)
    expect(d).toBe(0)
  })

  it('distância entre Cabo Ledo e Sangano é > 10km', () => {
    const d = gpsDistance(CABO_LEDO.lat, CABO_LEDO.lng, SANGANO.lat, SANGANO.lng)
    expect(d).toBeGreaterThan(10000) // > 10km
  })

  it('ponto dentro do geofence (50m) é válido', () => {
    // Deslocar ~50m para norte (0.00045° ≈ 50m)
    const nearLat = CABO_LEDO.lat + 0.00045
    const d = gpsDistance(CABO_LEDO.lat, CABO_LEDO.lng, nearLat, CABO_LEDO.lng)
    expect(d).toBeLessThan(GEOFENCE_RADIUS)
  })

  it('ponto fora do geofence (500m) é inválido', () => {
    // Deslocar ~500m (0.0045° ≈ 500m)
    const farLat = CABO_LEDO.lat + 0.0045
    const d = gpsDistance(CABO_LEDO.lat, CABO_LEDO.lng, farLat, CABO_LEDO.lng)
    expect(d).toBeGreaterThan(GEOFENCE_RADIUS)
  })

  it('resultado é sempre positivo', () => {
    const d = gpsDistance(0, 0, 1, 1)
    expect(d).toBeGreaterThan(0)
  })
})

// ── CÁLCULOS FINANCEIROS ──────────────────────

describe('Cálculos Financeiros', () => {
  const ANGOLA_TAX_RATE = 14 // %

  it('IVA 14% sobre 1000 AOA = 140 AOA', () => {
    const base = 1000
    const tax = base * (ANGOLA_TAX_RATE / 100)
    expect(tax).toBe(140)
  })

  it('total com IVA de 1000 = 1140', () => {
    const base = 1000
    const total = base + base * (ANGOLA_TAX_RATE / 100)
    expect(total).toBe(1140)
  })

  it('cálculo de venda com múltiplos itens', () => {
    const items = [
      { qty: 2, unitPrice: 800, taxRate: 14 },  // 2 * 800 = 1600, tax = 224
      { qty: 1, unitPrice: 5500, taxRate: 14 },  // 1 * 5500 = 5500, tax = 770
      { qty: 3, unitPrice: 300, taxRate: 14 },   // 3 * 300 = 900, tax = 126
    ]

    let totalAmount = 0
    let taxAmount = 0

    for (const item of items) {
      const subtotal = item.qty * item.unitPrice
      const tax = subtotal * (item.taxRate / 100)
      totalAmount += subtotal + tax
      taxAmount += tax
    }

    expect(taxAmount).toBeCloseTo(1120, 2) // 224 + 770 + 126
    expect(totalAmount).toBeCloseTo(9120, 2) // 8000 + 1120
  })
})

// ── CÁLCULOS DE PAYROLL ───────────────────────

describe('Cálculos de Payroll', () => {
  const NORMAL_DAILY_HOURS = 8
  const WORKING_DAYS_MONTH = 22
  const OVERTIME_MULTIPLIER = 1.5

  it('horas esperadas por mês = 176', () => {
    expect(WORKING_DAYS_MONTH * NORMAL_DAILY_HOURS).toBe(176)
  })

  it('salário sem overtime nem faltas = salário base', () => {
    const baseSalary = 180000
    const totalHours = 176 // exatamente as horas esperadas
    const expectedHours = WORKING_DAYS_MONTH * NORMAL_DAILY_HOURS
    const overtimeHours = Math.max(0, totalHours - expectedHours)
    const daysPresent = 22
    const absenceDays = Math.max(0, WORKING_DAYS_MONTH - daysPresent)

    const dailyRate = baseSalary / WORKING_DAYS_MONTH
    const hourlyRate = dailyRate / NORMAL_DAILY_HOURS
    const overtimePay = overtimeHours * hourlyRate * OVERTIME_MULTIPLIER
    const absenceDeduct = absenceDays * dailyRate
    const net = baseSalary + overtimePay - absenceDeduct

    expect(overtimeHours).toBe(0)
    expect(absenceDays).toBe(0)
    expect(net).toBe(baseSalary)
  })

  it('calcula overtime corretamente', () => {
    const baseSalary = 180000
    const totalHours = 186 // 10h extra
    const expectedHours = WORKING_DAYS_MONTH * NORMAL_DAILY_HOURS
    const overtimeHours = Math.max(0, totalHours - expectedHours)

    const dailyRate = baseSalary / WORKING_DAYS_MONTH
    const hourlyRate = dailyRate / NORMAL_DAILY_HOURS
    const overtimePay = overtimeHours * hourlyRate * OVERTIME_MULTIPLIER

    expect(overtimeHours).toBe(10)
    // hourlyRate = 180000 / 22 / 8 = 1022.73
    // overtimePay = 10 * 1022.73 * 1.5 = 15340.91
    expect(overtimePay).toBeCloseTo(15340.91, 0)
  })

  it('deduz faltas corretamente', () => {
    const baseSalary = 180000
    const daysPresent = 19 // faltou 3 dias
    const absenceDays = Math.max(0, WORKING_DAYS_MONTH - daysPresent)

    const dailyRate = baseSalary / WORKING_DAYS_MONTH
    const absenceDeduct = absenceDays * dailyRate

    expect(absenceDays).toBe(3)
    // dailyRate = 180000 / 22 = 8181.82
    // deduction = 3 * 8181.82 = 24545.45
    expect(absenceDeduct).toBeCloseTo(24545.45, 0)
  })

  it('salário nunca fica negativo', () => {
    const baseSalary = 100000
    const daysPresent = 0 // faltou todos os dias
    const absenceDays = WORKING_DAYS_MONTH - daysPresent

    const dailyRate = baseSalary / WORKING_DAYS_MONTH
    const absenceDeduct = absenceDays * dailyRate
    const net = Math.max(0, baseSalary - absenceDeduct)

    expect(net).toBeCloseTo(0, 2)
  })
})

// ── CÁLCULOS DE RESERVAS ──────────────────────

describe('Cálculos de Reservas', () => {
  it('calcula noites corretamente', () => {
    const checkIn = new Date('2026-04-01T14:00:00Z')
    const checkOut = new Date('2026-04-05T11:00:00Z')
    const nights = Math.max(1, Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    ))
    expect(nights).toBe(4)
  })

  it('mínimo de 1 noite', () => {
    const checkIn = new Date('2026-04-01T14:00:00Z')
    const checkOut = new Date('2026-04-01T20:00:00Z') // mesmo dia
    const nights = Math.max(1, Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    ))
    expect(nights).toBe(1)
  })

  it('detecta conflito de datas', () => {
    // Reserva existente: 1-5 Abril
    const existing = { checkIn: new Date('2026-04-01'), checkOut: new Date('2026-04-05') }

    // Nova reserva: 3-7 Abril (conflita)
    const newCheck = { checkIn: new Date('2026-04-03'), checkOut: new Date('2026-04-07') }

    const hasConflict = newCheck.checkIn < existing.checkOut && newCheck.checkOut > existing.checkIn
    expect(hasConflict).toBe(true)
  })

  it('não conflita quando datas não se sobrepõem', () => {
    const existing = { checkIn: new Date('2026-04-01'), checkOut: new Date('2026-04-05') }
    const newCheck = { checkIn: new Date('2026-04-05'), checkOut: new Date('2026-04-10') }

    const hasConflict = newCheck.checkIn < existing.checkOut && newCheck.checkOut > existing.checkIn
    expect(hasConflict).toBe(false)
  })

  it('checkout no mesmo dia do novo checkin não conflita', () => {
    const existing = { checkIn: new Date('2026-04-01'), checkOut: new Date('2026-04-05') }
    const newCheck = { checkIn: new Date('2026-04-05'), checkOut: new Date('2026-04-08') }

    // checkIn >= checkOut do existente → sem conflito
    const hasConflict = newCheck.checkIn < existing.checkOut && newCheck.checkOut > existing.checkIn
    expect(hasConflict).toBe(false)
  })
})

// ── NÚMERO DE FATURA ──────────────────────────

describe('Número de Fatura AGT', () => {
  it('gera formato correto FT A/XXXXX', () => {
    const sequence = 1
    const series = 'FT'
    const invoiceNumber = `${series} A/${String(sequence).padStart(5, '0')}`
    expect(invoiceNumber).toBe('FT A/00001')
  })

  it('incrementa sequência corretamente', () => {
    const lastInvoice = 'FT A/00042'
    const match = lastInvoice.match(/\/(\d+)$/)
    const sequence = match ? parseInt(match[1], 10) + 1 : 1
    const invoiceNumber = `FT A/${String(sequence).padStart(5, '0')}`
    expect(invoiceNumber).toBe('FT A/00043')
  })

  it('começa em 1 se não houver faturas anteriores', () => {
    const lastInvoice: string | null = null
    let sequence = 1
    if (lastInvoice) {
      const match = lastInvoice.match(/\/(\d+)$/)
      if (match) sequence = parseInt(match[1], 10) + 1
    }
    expect(sequence).toBe(1)
  })
})

// Tests: Utils — Sea and Soul ERP
import { describe, it, expect } from 'vitest'
import {
  calculateNights,
  isWithinGeofence,
  gpsDistance,
  generateInvoiceNumber,
  extractTax,
  applyTax,
  calculateOccupancy,
  calculateRevPAR,
  calculateADR,
  calculateWorkedHours,
  calculateOvertimeHours,
  calculateAbsenceDeduction,
  isValidNIF,
  isValidAngolanPhone,
  formatAngolanPhone,
  datesOverlap,
  isDateBetween,
  getMonthRange,
  slugify,
  truncate,
  maskPin,
  generateAccessPin,
  formatHours,
} from './index.js'

// ── calculateNights ───────────────────────────

describe('calculateNights', () => {
  it('calcula 4 noites entre 1 e 5 de Maio', () => {
    expect(calculateNights('2026-05-01', '2026-05-05')).toBe(4)
  })

  it('calcula 1 noite (mínimo)', () => {
    expect(calculateNights('2026-05-01', '2026-05-01')).toBe(1)
  })

  it('funciona com objetos Date', () => {
    expect(calculateNights(new Date('2026-05-01'), new Date('2026-05-10'))).toBe(9)
  })

  it('calcula corretamente em meses diferentes', () => {
    expect(calculateNights('2026-01-30', '2026-02-02')).toBe(3)
  })
})

// ── isWithinGeofence ──────────────────────────

describe('isWithinGeofence', () => {
  // Cabo Ledo: -9.0333, 13.2667 — raio 300m
  const centerLat = -9.0333
  const centerLng = 13.2667
  const radius    = 300

  it('retorna true para coordenadas no centro', () => {
    expect(isWithinGeofence(centerLat, centerLng, centerLat, centerLng, radius)).toBe(true)
  })

  it('retorna true para coordenadas dentro do raio (~100m)', () => {
    // ~100m a norte
    expect(isWithinGeofence(-9.0324, 13.2667, centerLat, centerLng, radius)).toBe(true)
  })

  it('retorna false para coordenadas fora do raio (~1km)', () => {
    // ~1km a norte
    expect(isWithinGeofence(-9.0243, 13.2667, centerLat, centerLng, radius)).toBe(false)
  })
})

// ── gpsDistance ───────────────────────────────

describe('gpsDistance', () => {
  it('distância entre o mesmo ponto é 0', () => {
    expect(gpsDistance(-9.0333, 13.2667, -9.0333, 13.2667)).toBe(0)
  })

  it('distância entre Cabo Ledo e Sangano é ~10km', () => {
    const dist = gpsDistance(-9.0333, 13.2667, -9.1000, 13.2000)
    expect(dist).toBeGreaterThan(9000)
    expect(dist).toBeLessThan(12000)
  })
})

// ── generateInvoiceNumber ─────────────────────

describe('generateInvoiceNumber', () => {
  it('formata número corretamente', () => {
    expect(generateInvoiceNumber('FT', 1)).toBe('FT FT/00001')
  })

  it('padding funciona com número grande', () => {
    expect(generateInvoiceNumber('FT', 99999)).toBe('FT FT/99999')
  })

  it('usa série personalizada', () => {
    expect(generateInvoiceNumber('ND', 42)).toBe('FT ND/00042')
  })
})

// ── extractTax / applyTax ─────────────────────

describe('extractTax', () => {
  it('extrai IVA de 14% de valor total', () => {
    const result = extractTax(11400, 14)
    expect(result.baseAmount).toBe(10000)
    expect(result.taxAmount).toBe(1400)
  })

  it('soma de base + IVA é igual ao total', () => {
    const total = 25000
    const result = extractTax(total, 14)
    expect(result.baseAmount + result.taxAmount).toBeCloseTo(total, 1)
  })
})

describe('applyTax', () => {
  it('aplica IVA de 14% ao valor base', () => {
    const result = applyTax(10000, 14)
    expect(result.taxAmount).toBe(1400)
    expect(result.totalAmount).toBe(11400)
  })

  it('extractTax e applyTax são inversas', () => {
    const base   = 10000
    const withTax = applyTax(base, 14)
    const back    = extractTax(withTax.totalAmount, 14)
    expect(back.baseAmount).toBeCloseTo(base, 0)
  })
})

// ── calculateOccupancy ────────────────────────

describe('calculateOccupancy', () => {
  it('calcula 100% de ocupação', () => {
    expect(calculateOccupancy(20, 20)).toBe(100)
  })

  it('calcula 50% de ocupação', () => {
    expect(calculateOccupancy(10, 20)).toBe(50)
  })

  it('calcula 0% com 0 quartos ocupados', () => {
    expect(calculateOccupancy(0, 20)).toBe(0)
  })

  it('retorna 0 se totalRooms é 0 (evita divisão por zero)', () => {
    expect(calculateOccupancy(0, 0)).toBe(0)
  })

  it('calcula 87.5% e arredonda a 1 casa decimal', () => {
    expect(calculateOccupancy(7, 8)).toBe(87.5)
  })
})

// ── calculateRevPAR / calculateADR ───────────

describe('calculateRevPAR', () => {
  it('calcula RevPAR corretamente', () => {
    // 450000 AOA de receita / 20 quartos = 22500 AOA/quarto
    expect(calculateRevPAR(450000, 20)).toBe(22500)
  })

  it('retorna 0 se não há quartos', () => {
    expect(calculateRevPAR(450000, 0)).toBe(0)
  })
})

describe('calculateADR', () => {
  it('calcula ADR corretamente', () => {
    // 450000 AOA de receita / 10 quartos-noite = 45000 AOA/noite
    expect(calculateADR(450000, 10)).toBe(45000)
  })

  it('retorna 0 se não há quartos-noite', () => {
    expect(calculateADR(450000, 0)).toBe(0)
  })
})

// ── calculateWorkedHours ──────────────────────

describe('calculateWorkedHours', () => {
  it('calcula 8 horas de trabalho', () => {
    expect(calculateWorkedHours('2026-05-01T08:00:00', '2026-05-01T16:00:00')).toBe(8)
  })

  it('calcula 7.5 horas (com pausa)', () => {
    expect(calculateWorkedHours('2026-05-01T08:00:00', '2026-05-01T15:30:00')).toBe(7.5)
  })
})

// ── calculateOvertimeHours ────────────────────

describe('calculateOvertimeHours', () => {
  it('calcula 2 horas extra além das 8 normais', () => {
    expect(calculateOvertimeHours(10, 8)).toBe(2)
  })

  it('retorna 0 quando não há horas extra', () => {
    expect(calculateOvertimeHours(7.5, 8)).toBe(0)
  })

  it('retorna 0 exato para 8 horas normais', () => {
    expect(calculateOvertimeHours(8, 8)).toBe(0)
  })
})

// ── calculateAbsenceDeduction ─────────────────

describe('calculateAbsenceDeduction', () => {
  it('calcula desconto de 1 falta em 22 dias úteis', () => {
    // Salário 100000 / 22 dias = 4545.45 por dia
    const deduction = calculateAbsenceDeduction(100000, 22, 1)
    expect(deduction).toBeCloseTo(4545.45, 0)
  })

  it('sem faltas = sem desconto', () => {
    expect(calculateAbsenceDeduction(100000, 22, 0)).toBe(0)
  })

  it('retorna 0 se dias úteis é 0', () => {
    expect(calculateAbsenceDeduction(100000, 0, 1)).toBe(0)
  })
})

// ── isValidNIF ────────────────────────────────

describe('isValidNIF', () => {
  it('aceita NIF válido de 9 dígitos', () => {
    expect(isValidNIF('123456789')).toBe(true)
  })

  it('rejeita NIF com letras', () => {
    expect(isValidNIF('12345678A')).toBe(false)
  })

  it('rejeita NIF com menos de 9 dígitos', () => {
    expect(isValidNIF('12345678')).toBe(false)
  })

  it('rejeita NIF com mais de 9 dígitos', () => {
    expect(isValidNIF('1234567890')).toBe(false)
  })

  it('ignora espaços no NIF', () => {
    expect(isValidNIF('123 456 789')).toBe(true)
  })
})

// ── isValidAngolanPhone ───────────────────────

describe('isValidAngolanPhone', () => {
  it('aceita número com prefixo +244', () => {
    expect(isValidAngolanPhone('+244912345678')).toBe(true)
  })

  it('aceita número sem prefixo (9 dígitos)', () => {
    expect(isValidAngolanPhone('912345678')).toBe(true)
  })

  it('aceita número com 244 sem +', () => {
    expect(isValidAngolanPhone('244912345678')).toBe(true)
  })

  it('rejeita número que não começa em 9', () => {
    expect(isValidAngolanPhone('+244812345678')).toBe(false)
  })

  it('rejeita número demasiado curto', () => {
    expect(isValidAngolanPhone('91234567')).toBe(false)
  })
})

// ── formatAngolanPhone ────────────────────────

describe('formatAngolanPhone', () => {
  it('formata número 9 dígitos', () => {
    expect(formatAngolanPhone('912345678')).toBe('+244 912 345 678')
  })

  it('normaliza número com prefixo 244', () => {
    expect(formatAngolanPhone('244912345678')).toBe('+244 912 345 678')
  })
})

// ── datesOverlap ──────────────────────────────

describe('datesOverlap', () => {
  it('detecta sobreposição parcial', () => {
    expect(datesOverlap('2026-05-01', '2026-05-05', '2026-05-03', '2026-05-08')).toBe(true)
  })

  it('detecta sobreposição total (B dentro de A)', () => {
    expect(datesOverlap('2026-05-01', '2026-05-10', '2026-05-03', '2026-05-07')).toBe(true)
  })

  it('retorna false para intervalos adjacentes (sem sobreposição)', () => {
    expect(datesOverlap('2026-05-01', '2026-05-05', '2026-05-05', '2026-05-10')).toBe(false)
  })

  it('retorna false para intervalos sem contacto', () => {
    expect(datesOverlap('2026-05-01', '2026-05-03', '2026-05-05', '2026-05-08')).toBe(false)
  })
})

// ── isDateBetween ─────────────────────────────

describe('isDateBetween', () => {
  it('retorna true para data dentro do intervalo', () => {
    expect(isDateBetween('2026-05-03', '2026-05-01', '2026-05-05')).toBe(true)
  })

  it('retorna true para data no limite inferior', () => {
    expect(isDateBetween('2026-05-01', '2026-05-01', '2026-05-05')).toBe(true)
  })

  it('retorna false para data fora do intervalo', () => {
    expect(isDateBetween('2026-05-10', '2026-05-01', '2026-05-05')).toBe(false)
  })
})

// ── getMonthRange ─────────────────────────────

describe('getMonthRange', () => {
  it('devolve primeiro e último dia de Maio 2026', () => {
    const { from, to } = getMonthRange(2026, 5)
    expect(from.getDate()).toBe(1)
    expect(from.getMonth()).toBe(4) // 0-indexed
    expect(to.getDate()).toBe(31)
    expect(to.getHours()).toBe(23)
  })

  it('lida com Fevereiro (mês curto)', () => {
    const { from, to } = getMonthRange(2026, 2)
    expect(to.getDate()).toBe(28) // 2026 não é bissexto
  })
})

// ── slugify ───────────────────────────────────

describe('slugify', () => {
  it('converte para minúsculas e substitui espaços', () => {
    expect(slugify('Cabo Ledo Resort')).toBe('cabo-ledo-resort')
  })

  it('remove acentos', () => {
    expect(slugify('Gestão de Reservas')).toBe('gestao-de-reservas')
  })

  it('remove caracteres especiais', () => {
    expect(slugify('Sea & Soul Resorts!')).toBe('sea-soul-resorts')
  })

  it('não começa nem termina com hífen', () => {
    const result = slugify('  Cabo Ledo  ')
    expect(result).not.toMatch(/^-|-$/)
  })
})

// ── truncate ──────────────────────────────────

describe('truncate', () => {
  it('não trunca texto curto', () => {
    expect(truncate('Texto curto', 20)).toBe('Texto curto')
  })

  it('trunca e adiciona reticências', () => {
    expect(truncate('Texto muito longo demais', 10)).toBe('Texto m...')
  })

  it('texto exato no limite não é truncado', () => {
    expect(truncate('12345', 5)).toBe('12345')
  })
})

// ── maskPin ───────────────────────────────────

describe('maskPin', () => {
  it('mascara PIN de 6 dígitos', () => {
    expect(maskPin('123456')).toBe('****56')
  })

  it('mascara PIN de 4 dígitos', () => {
    expect(maskPin('4829')).toBe('**29')
  })
})

// ── generateAccessPin ─────────────────────────

describe('generateAccessPin', () => {
  it('gera PIN com o comprimento correto', () => {
    expect(generateAccessPin(6)).toHaveLength(6)
    expect(generateAccessPin(4)).toHaveLength(4)
  })

  it('gera apenas dígitos', () => {
    const pin = generateAccessPin(6)
    expect(/^\d+$/.test(pin)).toBe(true)
  })

  it('comprimento por omissão é 6', () => {
    expect(generateAccessPin()).toHaveLength(6)
  })
})

// ── formatHours ───────────────────────────────

describe('formatHours', () => {
  it('formata 8 horas exactas', () => {
    expect(formatHours(8)).toBe('8h')
  })

  it('formata 7.5 horas', () => {
    expect(formatHours(7.5)).toBe('7h 30m')
  })

  it('formata 1.25 horas', () => {
    expect(formatHours(1.25)).toBe('1h 15m')
  })
})

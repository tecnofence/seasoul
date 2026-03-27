import { describe, it, expect } from 'vitest'

// Auth schemas
import { registerSchema, loginSchema, refreshSchema, verifyTwoFaSchema } from '../src/routes/auth/schemas.js'
// Users schemas
import { createUserSchema, updateUserSchema, listUsersQuery } from '../src/routes/users/schemas.js'
// Rooms schemas
import { createRoomSchema, updateRoomSchema, updateRoomStatusSchema, listRoomsQuery } from '../src/routes/rooms/schemas.js'
// Tariffs schemas
import { createTariffSchema, updateTariffSchema } from '../src/routes/tariffs/schemas.js'
// Reservations schemas
import { createReservationSchema, updateReservationSchema, listReservationsQuery } from '../src/routes/reservations/schemas.js'
// Products schemas
import { createProductSchema, updateProductSchema, listProductsQuery } from '../src/routes/products/schemas.js'
// POS schemas
import { createSaleSchema, listSalesQuery } from '../src/routes/pos/schemas.js'
// Invoice schemas
import { emitInvoiceSchema } from '../src/routes/invoices/schemas.js'
// Stock schemas
import { createStockItemSchema, stockMovementSchema } from '../src/routes/stock/schemas.js'
// Suppliers schemas
import { createSupplierSchema } from '../src/routes/suppliers/schemas.js'
// HR schemas
import { createEmployeeSchema, createShiftSchema } from '../src/routes/hr/schemas.js'
// Attendance schemas
import { recordAttendanceSchema } from '../src/routes/attendance/schemas.js'
// Payroll schemas
import { processPayrollSchema, batchPayrollSchema } from '../src/routes/payroll/schemas.js'
// Guest schemas
import { registerGuestSchema, guestLoginSchema } from '../src/routes/guest/schemas.js'
// Chat schemas
import { sendMessageSchema, listMessagesQuery } from '../src/routes/chat/schemas.js'
// Reviews schemas
import { createReviewSchema, replyReviewSchema } from '../src/routes/reviews/schemas.js'
// Notifications schemas
import { createNotificationSchema } from '../src/routes/notifications/schemas.js'
// Service Orders schemas
import { createServiceOrderSchema, updateServiceOrderStatusSchema } from '../src/routes/service-orders/schemas.js'
// Locks schemas
import { generatePinSchema } from '../src/routes/locks/schemas.js'

// ── AUTH ──────────────────────────────────────

describe('Auth schemas', () => {
  describe('registerSchema', () => {
    it('aceita dados válidos', () => {
      const result = registerSchema.safeParse({
        name: 'João Silva',
        email: 'joao@test.com',
        password: '12345678',
        role: 'RECEPTIONIST',
      })
      expect(result.success).toBe(true)
    })

    it('rejeita email inválido', () => {
      const result = registerSchema.safeParse({
        name: 'João',
        email: 'invalid',
        password: '12345678',
        role: 'STAFF',
      })
      expect(result.success).toBe(false)
    })

    it('rejeita password curta', () => {
      const result = registerSchema.safeParse({
        name: 'João',
        email: 'joao@test.com',
        password: '123',
        role: 'STAFF',
      })
      expect(result.success).toBe(false)
    })

    it('rejeita role inválido', () => {
      const result = registerSchema.safeParse({
        name: 'João',
        email: 'joao@test.com',
        password: '12345678',
        role: 'INVALID_ROLE',
      })
      expect(result.success).toBe(false)
    })

    it('aceita resortId opcional', () => {
      const result = registerSchema.safeParse({
        name: 'João',
        email: 'joao@test.com',
        password: '12345678',
        role: 'STAFF',
        resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('loginSchema', () => {
    it('aceita credenciais válidas', () => {
      const result = loginSchema.safeParse({ email: 'a@b.com', password: 'pass' })
      expect(result.success).toBe(true)
    })

    it('rejeita sem password', () => {
      const result = loginSchema.safeParse({ email: 'a@b.com', password: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('refreshSchema', () => {
    it('aceita refresh token', () => {
      const result = refreshSchema.safeParse({ refreshToken: 'abc123' })
      expect(result.success).toBe(true)
    })

    it('rejeita vazio', () => {
      const result = refreshSchema.safeParse({ refreshToken: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('verifyTwoFaSchema', () => {
    it('aceita código de 6 dígitos', () => {
      expect(verifyTwoFaSchema.safeParse({ code: '123456' }).success).toBe(true)
    })

    it('rejeita código curto', () => {
      expect(verifyTwoFaSchema.safeParse({ code: '123' }).success).toBe(false)
    })
  })
})

// ── USERS ─────────────────────────────────────

describe('Users schemas', () => {
  describe('createUserSchema', () => {
    it('aceita todos os roles válidos', () => {
      const roles = ['SUPER_ADMIN', 'RESORT_MANAGER', 'RECEPTIONIST', 'POS_OPERATOR', 'STOCK_MANAGER', 'HR_MANAGER', 'STAFF']
      for (const role of roles) {
        const result = createUserSchema.safeParse({
          name: 'Test User',
          email: 'test@test.com',
          password: '12345678',
          role,
        })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('updateUserSchema', () => {
    it('aceita atualização parcial', () => {
      expect(updateUserSchema.safeParse({ name: 'Novo Nome' }).success).toBe(true)
      expect(updateUserSchema.safeParse({ active: false }).success).toBe(true)
      expect(updateUserSchema.safeParse({}).success).toBe(true)
    })

    it('aceita resortId nulo', () => {
      expect(updateUserSchema.safeParse({ resortId: null }).success).toBe(true)
    })
  })

  describe('listUsersQuery', () => {
    it('aplica defaults', () => {
      const result = listUsersQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })

    it('rejeita limit superior a 100', () => {
      const result = listUsersQuery.safeParse({ limit: 200 })
      expect(result.success).toBe(false)
    })
  })
})

// ── ROOMS ─────────────────────────────────────

describe('Rooms schemas', () => {
  describe('createRoomSchema', () => {
    it('aceita dados válidos', () => {
      const result = createRoomSchema.safeParse({
        resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        number: '101',
        type: 'STANDARD',
        floor: 1,
        capacity: 2,
        pricePerNight: 25000,
      })
      expect(result.success).toBe(true)
    })

    it('aceita todos os tipos de quarto', () => {
      for (const type of ['STANDARD', 'SUPERIOR', 'SUITE', 'VILLA']) {
        const result = createRoomSchema.safeParse({
          resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
          number: '101',
          type,
          floor: 1,
          capacity: 2,
          pricePerNight: 25000,
        })
        expect(result.success).toBe(true)
      }
    })

    it('rejeita preço negativo', () => {
      const result = createRoomSchema.safeParse({
        resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        number: '101',
        type: 'STANDARD',
        floor: 1,
        capacity: 2,
        pricePerNight: -100,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateRoomStatusSchema', () => {
    it('aceita todos os status', () => {
      for (const status of ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'CLEANING']) {
        expect(updateRoomStatusSchema.safeParse({ status }).success).toBe(true)
      }
    })

    it('rejeita status inválido', () => {
      expect(updateRoomStatusSchema.safeParse({ status: 'INVALID' }).success).toBe(false)
    })
  })
})

// ── TARIFFS ───────────────────────────────────

describe('Tariffs schemas', () => {
  it('aceita tarifa válida', () => {
    const result = createTariffSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      name: 'Época Alta',
      roomType: 'STANDARD',
      pricePerNight: 30000,
      validFrom: '2026-06-01T00:00:00.000Z',
      validUntil: '2026-09-30T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('aplica minNights default a 1', () => {
    const result = createTariffSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      name: 'Test',
      roomType: 'SUITE',
      pricePerNight: 50000,
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2026-12-31T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.minNights).toBe(1)
  })
})

// ── RESERVATIONS ──────────────────────────────

describe('Reservations schemas', () => {
  const validReservation = {
    resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
    roomId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
    guestName: 'Roberto Almeida',
    guestEmail: 'roberto@email.com',
    guestPhone: '+244 923 100 001',
    checkIn: '2026-04-01T14:00:00.000Z',
    checkOut: '2026-04-05T11:00:00.000Z',
    adults: 2,
    totalAmount: 100000,
  }

  it('aceita reserva válida', () => {
    expect(createReservationSchema.safeParse(validReservation).success).toBe(true)
  })

  it('aplica defaults', () => {
    const result = createReservationSchema.safeParse(validReservation)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.children).toBe(0)
      expect(result.data.bookingSource).toBe('DIRECT')
      expect(result.data.depositPaid).toBe(0)
    }
  })

  it('aceita todas as fontes de booking', () => {
    for (const source of ['DIRECT', 'WEBSITE', 'PHONE', 'BOOKING_COM', 'EXPEDIA', 'AIRBNB', 'OTHER']) {
      const result = createReservationSchema.safeParse({ ...validReservation, bookingSource: source })
      expect(result.success).toBe(true)
    }
  })

  it('rejeita email inválido do hóspede', () => {
    const result = createReservationSchema.safeParse({ ...validReservation, guestEmail: 'invalid' })
    expect(result.success).toBe(false)
  })

  it('rejeita valor total negativo', () => {
    const result = createReservationSchema.safeParse({ ...validReservation, totalAmount: -100 })
    expect(result.success).toBe(false)
  })

  describe('listReservationsQuery', () => {
    it('aplica defaults de paginação', () => {
      const result = listReservationsQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })
  })
})

// ── PRODUCTS ──────────────────────────────────

describe('Products schemas', () => {
  it('aceita produto válido', () => {
    const result = createProductSchema.safeParse({
      name: 'Cerveja Cuca',
      category: 'Bebidas',
      department: 'BAR',
      unitPrice: 800,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.taxRate).toBe(14) // default IVA
  })

  it('rejeita preço negativo', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      category: 'Test',
      department: 'Test',
      unitPrice: -10,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita taxRate acima de 100', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      category: 'Test',
      department: 'Test',
      unitPrice: 100,
      taxRate: 150,
    })
    expect(result.success).toBe(false)
  })

  describe('updateProductSchema', () => {
    it('aceita atualização parcial', () => {
      expect(updateProductSchema.safeParse({ name: 'Novo' }).success).toBe(true)
      expect(updateProductSchema.safeParse({ active: false }).success).toBe(true)
      expect(updateProductSchema.safeParse({}).success).toBe(true)
    })
  })

  describe('listProductsQuery', () => {
    it('aplica defaults', () => {
      const result = listProductsQuery.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(20)
      }
    })
  })
})

// ── POS ───────────────────────────────────────

describe('POS schemas', () => {
  it('aceita venda válida', () => {
    const result = createSaleSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      paymentMethod: 'CASH',
      items: [{ productId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', qty: 2, unitPrice: 800 }],
    })
    expect(result.success).toBe(true)
  })

  it('aceita todos os métodos de pagamento', () => {
    for (const method of ['CASH', 'CARD', 'ROOM_CHARGE', 'TRANSFER']) {
      const result = createSaleSchema.safeParse({
        resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        paymentMethod: method,
        items: [{ productId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', qty: 1, unitPrice: 100 }],
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejeita venda sem itens', () => {
    const result = createSaleSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      paymentMethod: 'CASH',
      items: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejeita quantidade negativa', () => {
    const result = createSaleSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      paymentMethod: 'CASH',
      items: [{ productId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', qty: -1, unitPrice: 800 }],
    })
    expect(result.success).toBe(false)
  })

  it('aplica taxRate default 14%', () => {
    const result = createSaleSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      paymentMethod: 'CASH',
      items: [{ productId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', qty: 1, unitPrice: 1000 }],
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.items[0].taxRate).toBe(14)
  })
})

// ── INVOICES ──────────────────────────────────

describe('Invoices schemas', () => {
  it('aceita saleId válido', () => {
    expect(emitInvoiceSchema.safeParse({ saleId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' }).success).toBe(true)
  })

  it('rejeita saleId inválido', () => {
    expect(emitInvoiceSchema.safeParse({ saleId: 'invalid' }).success).toBe(false)
  })
})

// ── STOCK ─────────────────────────────────────

describe('Stock schemas', () => {
  it('aceita stock item válido', () => {
    const result = createStockItemSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      name: 'Cerveja Cuca (cx 24)',
      department: 'BAR',
      unit: 'caixa',
      minQty: 10,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.currentQty).toBe(0) // default
  })

  describe('stockMovementSchema', () => {
    it('aceita movimento IN', () => {
      const result = stockMovementSchema.safeParse({
        stockItemId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'IN',
        qty: 50,
        reason: 'Compra ao fornecedor',
      })
      expect(result.success).toBe(true)
    })

    it('aceita movimento OUT', () => {
      const result = stockMovementSchema.safeParse({
        stockItemId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'OUT',
        qty: 5,
        reason: 'Consumo diário',
      })
      expect(result.success).toBe(true)
    })

    it('aceita ADJUSTMENT', () => {
      const result = stockMovementSchema.safeParse({
        stockItemId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'ADJUSTMENT',
        qty: 25,
        reason: 'Inventário físico',
      })
      expect(result.success).toBe(true)
    })

    it('rejeita quantidade zero', () => {
      const result = stockMovementSchema.safeParse({
        stockItemId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'IN',
        qty: 0,
        reason: 'test',
      })
      expect(result.success).toBe(false)
    })
  })
})

// ── SUPPLIERS ─────────────────────────────────

describe('Suppliers schemas', () => {
  it('aceita fornecedor com NIF válido (9 dígitos)', () => {
    expect(createSupplierSchema.safeParse({ name: 'Fornecedor X', nif: '123456789' }).success).toBe(true)
  })

  it('rejeita NIF com letras', () => {
    expect(createSupplierSchema.safeParse({ name: 'Fornecedor X', nif: '12345678A' }).success).toBe(false)
  })

  it('rejeita NIF curto', () => {
    expect(createSupplierSchema.safeParse({ name: 'Fornecedor X', nif: '12345' }).success).toBe(false)
  })

  it('aceita sem NIF', () => {
    expect(createSupplierSchema.safeParse({ name: 'Fornecedor X' }).success).toBe(true)
  })
})

// ── HR ────────────────────────────────────────

describe('HR schemas', () => {
  it('aceita colaborador válido', () => {
    const result = createEmployeeSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      name: 'António Luís',
      nif: '123456789',
      role: 'Rececionista',
      department: 'RECEÇÃO',
      baseSalary: 180000,
      startDate: '2024-01-15T00:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita salário negativo', () => {
    const result = createEmployeeSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      name: 'Test',
      nif: '123456789',
      role: 'Test',
      department: 'Test',
      baseSalary: -100,
      startDate: '2024-01-15T00:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  describe('createShiftSchema', () => {
    it('aceita turno válido', () => {
      const result = createShiftSchema.safeParse({
        employeeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        date: '2026-04-01T00:00:00.000Z',
        startTime: '2026-04-01T08:00:00.000Z',
        endTime: '2026-04-01T16:00:00.000Z',
        department: 'RECEÇÃO',
      })
      expect(result.success).toBe(true)
    })
  })
})

// ── ATTENDANCE ────────────────────────────────

describe('Attendance schemas', () => {
  it('aceita registo com GPS válido', () => {
    const result = recordAttendanceSchema.safeParse({
      employeeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'ENTRY',
      lat: -9.0333,
      lng: 13.2333,
    })
    expect(result.success).toBe(true)
  })

  it('aceita todos os tipos', () => {
    for (const type of ['ENTRY', 'EXIT', 'BREAK_START', 'BREAK_END']) {
      const result = recordAttendanceSchema.safeParse({
        employeeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type,
        lat: -9.0333,
        lng: 13.2333,
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejeita latitude fora de alcance', () => {
    expect(recordAttendanceSchema.safeParse({
      employeeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'ENTRY',
      lat: 100,
      lng: 13.2333,
    }).success).toBe(false)
  })

  it('rejeita longitude fora de alcance', () => {
    expect(recordAttendanceSchema.safeParse({
      employeeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'ENTRY',
      lat: -9.0,
      lng: 200,
    }).success).toBe(false)
  })
})

// ── PAYROLL ───────────────────────────────────

describe('Payroll schemas', () => {
  it('aceita processamento válido', () => {
    const result = processPayrollSchema.safeParse({
      employeeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      month: 3,
      year: 2026,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita mês inválido', () => {
    expect(processPayrollSchema.safeParse({ employeeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', month: 13, year: 2026 }).success).toBe(false)
    expect(processPayrollSchema.safeParse({ employeeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', month: 0, year: 2026 }).success).toBe(false)
  })

  it('rejeita ano anterior a 2024', () => {
    expect(processPayrollSchema.safeParse({ employeeId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', month: 1, year: 2023 }).success).toBe(false)
  })

  describe('batchPayrollSchema', () => {
    it('aceita batch válido', () => {
      const result = batchPayrollSchema.safeParse({
        resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        month: 3,
        year: 2026,
      })
      expect(result.success).toBe(true)
    })
  })
})

// ── GUEST ─────────────────────────────────────

describe('Guest schemas', () => {
  it('aceita registo válido', () => {
    const result = registerGuestSchema.safeParse({
      name: 'Roberto Almeida',
      phone: '+244 923 100 001',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.language).toBe('pt') // default
  })

  it('aceita todos os idiomas', () => {
    for (const language of ['pt', 'en', 'fr', 'es']) {
      expect(registerGuestSchema.safeParse({ name: 'Test', phone: '123456789', language }).success).toBe(true)
    }
  })

  it('rejeita telefone curto', () => {
    expect(registerGuestSchema.safeParse({ name: 'Test', phone: '123' }).success).toBe(false)
  })

  it('aceita login por telefone', () => {
    expect(guestLoginSchema.safeParse({ phone: '+244 923 100 001' }).success).toBe(true)
  })
})

// ── CHAT ──────────────────────────────────────

describe('Chat schemas', () => {
  it('aceita mensagem válida', () => {
    expect(sendMessageSchema.safeParse({
      reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      content: 'Olá, preciso de toalhas extras',
    }).success).toBe(true)
  })

  it('rejeita mensagem vazia', () => {
    expect(sendMessageSchema.safeParse({
      reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      content: '',
    }).success).toBe(false)
  })

  it('rejeita mensagem acima de 2000 caracteres', () => {
    expect(sendMessageSchema.safeParse({
      reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      content: 'a'.repeat(2001),
    }).success).toBe(false)
  })

  describe('listMessagesQuery', () => {
    it('aplica defaults de paginação', () => {
      const result = listMessagesQuery.safeParse({ reservationId: 'test-id' })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.limit).toBe(50)
      }
    })
  })
})

// ── REVIEWS ───────────────────────────────────

describe('Reviews schemas', () => {
  it('aceita avaliação válida', () => {
    const result = createReviewSchema.safeParse({
      reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      overallRating: 5,
      cleanliness: 4,
      service: 5,
      comment: 'Excelente estadia!',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.language).toBe('pt')
  })

  it('rejeita rating fora de 1-5', () => {
    expect(createReviewSchema.safeParse({ reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', overallRating: 0 }).success).toBe(false)
    expect(createReviewSchema.safeParse({ reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx', overallRating: 6 }).success).toBe(false)
  })

  it('aceita resposta válida', () => {
    expect(replyReviewSchema.safeParse({ reply: 'Obrigado!' }).success).toBe(true)
  })

  it('rejeita resposta vazia', () => {
    expect(replyReviewSchema.safeParse({ reply: '' }).success).toBe(false)
  })
})

// ── NOTIFICATIONS ─────────────────────────────

describe('Notifications schemas', () => {
  it('aceita notificação válida', () => {
    const result = createNotificationSchema.safeParse({
      userId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'RESERVATION_CONFIRMED',
      title: 'Reserva Confirmada',
      body: 'A sua reserva #123 foi confirmada.',
      channel: 'PUSH',
    })
    expect(result.success).toBe(true)
  })

  it('aceita todos os tipos de notificação', () => {
    const types = [
      'RESERVATION_CONFIRMED', 'RESERVATION_REMINDER', 'CHECKIN_READY',
      'PIN_GENERATED', 'CHECKOUT_REMINDER', 'INVOICE_READY',
      'STOCK_ALERT', 'ATTENDANCE_MISSING', 'PAYROLL_PROCESSED', 'MAINTENANCE_ASSIGNED',
    ]
    for (const type of types) {
      expect(createNotificationSchema.safeParse({
        userId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type,
        title: 'Test',
        body: 'Test',
        channel: 'IN_APP',
      }).success).toBe(true)
    }
  })

  it('aceita todos os canais', () => {
    for (const channel of ['PUSH', 'SMS', 'EMAIL', 'IN_APP']) {
      expect(createNotificationSchema.safeParse({
        guestId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type: 'CHECKIN_READY',
        title: 'Test',
        body: 'Test',
        channel,
      }).success).toBe(true)
    }
  })
})

// ── SERVICE ORDERS ────────────────────────────

describe('Service Orders schemas', () => {
  it('aceita pedido válido', () => {
    const result = createServiceOrderSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'ROOM_SERVICE',
      items: [{ name: 'Toalhas extras', qty: 2 }],
    })
    expect(result.success).toBe(true)
  })

  it('aceita todos os tipos', () => {
    for (const type of ['ROOM_SERVICE', 'HOUSEKEEPING', 'SPA', 'RESTAURANT', 'ACTIVITY', 'TRANSPORT', 'OTHER']) {
      const result = createServiceOrderSchema.safeParse({
        resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
        type,
        items: [{ name: 'Item', qty: 1 }],
      })
      expect(result.success).toBe(true)
    }
  })

  it('rejeita sem itens', () => {
    const result = createServiceOrderSchema.safeParse({
      resortId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      type: 'ROOM_SERVICE',
      items: [],
    })
    expect(result.success).toBe(false)
  })

  describe('updateServiceOrderStatusSchema', () => {
    it('aceita todos os status', () => {
      for (const status of ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']) {
        expect(updateServiceOrderStatusSchema.safeParse({ status }).success).toBe(true)
      }
    })
  })
})

// ── LOCKS ─────────────────────────────────────

describe('Locks schemas', () => {
  it('aceita geração de PIN', () => {
    expect(generatePinSchema.safeParse({ reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx' }).success).toBe(true)
  })

  it('aceita datas opcionais', () => {
    const result = generatePinSchema.safeParse({
      reservationId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      validFrom: '2026-04-01T14:00:00.000Z',
      validUntil: '2026-04-05T11:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })
})

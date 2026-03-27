// Sea and Soul ERP — Helpers de Teste
// ENGERIS — engeris.co.ao

import Fastify, { type FastifyInstance } from 'fastify'
import jwtPlugin from '@fastify/jwt'
import { vi } from 'vitest'

// ── Mock Prisma ───────────────────────────────

export function createMockPrisma() {
  return {
    user: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      findFirst:   vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      updateMany:  vi.fn(),
      count:       vi.fn(),
    },
    refreshToken: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      updateMany:  vi.fn(),
      delete:      vi.fn(),
    },
    reservation: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      findFirst:   vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      count:       vi.fn(),
    },
    room: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      count:       vi.fn(),
    },
    resort: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      count:       vi.fn(),
    },
    product: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      count:       vi.fn(),
    },
    sale: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      count:       vi.fn(),
    },
    saleItem: {
      createMany:  vi.fn(),
    },
    stockItem: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      count:       vi.fn(),
    },
    stockMovement: {
      findMany:    vi.fn(),
      create:      vi.fn(),
    },
    employee: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      count:       vi.fn(),
    },
    attendanceRecord: {
      findMany:    vi.fn(),
      create:      vi.fn(),
      count:       vi.fn(),
    },
    payroll: {
      findUnique:  vi.fn(),
      findMany:    vi.fn(),
      create:      vi.fn(),
      update:      vi.fn(),
      count:       vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: unknown) => Promise<unknown>) => {
      return fn(createMockPrisma())
    }),
    $disconnect: vi.fn(),
  }
}

export type MockPrisma = ReturnType<typeof createMockPrisma>

// ── Factory de App de Teste ───────────────────

const TEST_JWT_SECRET = 'test-secret-min-32-characters-long!!'

export async function buildTestApp(overridePrisma?: Partial<MockPrisma>) {
  const app = Fastify({ logger: false })

  await app.register(jwtPlugin, { secret: TEST_JWT_SECRET })

  const mockPrisma = { ...createMockPrisma(), ...overridePrisma }

  app.decorate('prisma', mockPrisma)
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.code(401).send({ error: 'Token inválido ou expirado' })
    }
  })

  // Não chamar app.ready() aqui — o teste regista as rotas e chama ready()

  return { app, prisma: mockPrisma }
}

// ── Helpers de JWT ────────────────────────────

export function signToken(
  app: FastifyInstance,
  payload: {
    id: string
    email: string
    role: string
    resortId?: string | null
  },
) {
  return app.jwt.sign(payload, { expiresIn: '15m' })
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// ── Dados de Teste ────────────────────────────

// IDs no formato CUID (começa em 'c', sem espaços/hifens, ≥9 chars)
export const TEST_IDS = {
  user:         'cltest0001useradmin000001',
  resort:       'cltest0002resortcaboledo0',
  resortSangano:'cltest0003resortsangano00',
  room:         'cltest0004roomstandard001',
  reservation:  'cltest0005reservation0001',
}

export const mockUser = {
  id:           TEST_IDS.user,
  name:         'Admin Teste',
  email:        'admin@seasoul.ao',
  passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4tbWmE7uUm', // "password123"
  role:         'SUPER_ADMIN' as const,
  resortId:     null,
  twoFaSecret:  null,
  twoFaEnabled: false,
  active:       true,
  createdAt:    new Date('2026-01-01'),
  updatedAt:    new Date('2026-01-01'),
}

export const mockRoom = {
  id:            TEST_IDS.room,
  resortId:      TEST_IDS.resort,
  number:        '101',
  type:          'STANDARD' as const,
  floor:         1,
  capacity:      2,
  pricePerNight: 25000,
  seamDeviceId:  null,
  status:        'AVAILABLE' as const,
  description:   null,
  amenities:     [],
  createdAt:     new Date('2026-01-01'),
  updatedAt:     new Date('2026-01-01'),
}

export const mockReservation = {
  id:                 TEST_IDS.reservation,
  resortId:           TEST_IDS.resort,
  roomId:             TEST_IDS.room,
  guestId:            null,
  guestName:          'João Silva',
  guestEmail:         'joao@email.com',
  guestPhone:         '+244912345678',
  checkIn:            new Date('2026-05-01T14:00:00Z'),
  checkOut:           new Date('2026-05-05T12:00:00Z'),
  nights:             4,
  adults:             2,
  children:           0,
  status:             'CONFIRMED' as const,
  bookingSource:      'DIRECT' as const,
  accessPinEncrypted: null,
  pinValidFrom:       null,
  pinValidUntil:      null,
  totalAmount:        100000,
  depositPaid:        0,
  paymentStatus:      'PENDING' as const,
  notes:              null,
  internalNotes:      null,
  createdAt:          new Date('2026-04-01'),
  updatedAt:          new Date('2026-04-01'),
}

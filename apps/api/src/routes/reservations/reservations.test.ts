// Tests: Reservations Routes
import { describe, it, expect, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import reservationsRoutes from './index.js'
import {
  buildTestApp,
  signToken,
  authHeader,
  mockUser,
  mockRoom,
  mockReservation,
  TEST_IDS,
} from '../../test/helpers.js'

const openApps: FastifyInstance[] = []

async function setup() {
  const { app, prisma } = await buildTestApp()
  await app.register(reservationsRoutes, { prefix: '/v1/reservations' })
  await app.ready()
  openApps.push(app)
  const token = signToken(app, { id: mockUser.id, email: mockUser.email, role: mockUser.role })
  return { app, prisma, token }
}

afterEach(async () => {
  for (const app of openApps) await app.close()
  openApps.length = 0
})

describe('GET /v1/reservations', () => {
  it('devolve lista paginada de reservas', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findMany.mockResolvedValue([mockReservation])
    prisma.reservation.count.mockResolvedValue(1)

    const res = await app.inject({
      method: 'GET',
      url:    '/v1/reservations',
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
  })

  it('filtra por resort_id e status', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findMany.mockResolvedValue([])
    prisma.reservation.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url:    '/v1/reservations?resortId=resort_cabo_ledo&status=CONFIRMED',
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(200)
    expect(prisma.reservation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          resortId: 'resort_cabo_ledo',
          status:   'CONFIRMED',
        }),
      }),
    )
  })

  it('retorna 401 sem autenticação', async () => {
    const { app } = await setup()

    const res = await app.inject({
      method: 'GET',
      url:    '/v1/reservations',
    })

    expect(res.statusCode).toBe(401)
  })
})

describe('GET /v1/reservations/:id', () => {
  it('devolve reserva pelo ID', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findUnique.mockResolvedValue({
      ...mockReservation,
      room:    mockRoom,
      resort:  { id: 'resort_cabo_ledo', name: 'Cabo Ledo Resort' },
      guest:   null,
      sales:   [],
      serviceOrders: [],
    })

    const res = await app.inject({
      method: 'GET',
      url:    '/v1/reservations/res_test_01',
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe(TEST_IDS.reservation)
    expect(res.json().data.guestName).toBe('João Silva')
  })

  it('retorna 404 para ID inexistente', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'GET',
      url:    '/v1/reservations/nao_existe',
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toMatch(/não encontrada/i)
  })
})

describe('POST /v1/reservations', () => {
  // checkIn/checkOut em ISO 8601 datetime (obrigatório pelo schema)
  const validPayload = {
    resortId:    TEST_IDS.resort,
    roomId:      TEST_IDS.room,
    guestName:   'Maria Costa',
    guestEmail:  'maria@email.com',
    guestPhone:  '+244923456789',
    checkIn:     '2026-06-01T14:00:00Z',
    checkOut:    '2026-06-04T12:00:00Z',
    adults:      2,
    totalAmount: 75000,
  }

  it('cria reserva com dados válidos', async () => {
    const { app, prisma, token } = await setup()

    prisma.room.findUnique.mockResolvedValue(mockRoom)
    prisma.reservation.findFirst.mockResolvedValue(null) // sem conflito
    prisma.reservation.create.mockResolvedValue({
      ...mockReservation,
      ...validPayload,
      nights: 3,
      room:   { id: mockRoom.id, number: mockRoom.number, type: mockRoom.type },
      resort: { id: 'resort_cabo_ledo', name: 'Cabo Ledo Resort' },
    })

    const res = await app.inject({
      method: 'POST',
      url:    '/v1/reservations',
      headers: authHeader(token),
      payload: validPayload,
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toMatch(/criada/i)
    expect(prisma.reservation.create).toHaveBeenCalledOnce()
  })

  it('rejeita quando check-out é antes do check-in', async () => {
    const { app, token } = await setup()

    const res = await app.inject({
      method: 'POST',
      url:    '/v1/reservations',
      headers: authHeader(token),
      payload: {
        ...validPayload,
        checkIn:  '2026-06-05T14:00:00Z',
        checkOut: '2026-06-01T12:00:00Z', // antes do check-in
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/check-out/i)
  })

  it('rejeita quando quarto não existe no resort', async () => {
    const { app, prisma, token } = await setup()

    prisma.room.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url:    '/v1/reservations',
      headers: authHeader(token),
      payload: validPayload,
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toMatch(/quarto não encontrado/i)
  })

  it('rejeita quando quarto tem conflito de datas', async () => {
    const { app, prisma, token } = await setup()

    prisma.room.findUnique.mockResolvedValue(mockRoom)
    prisma.reservation.findFirst.mockResolvedValue(mockReservation) // conflito

    const res = await app.inject({
      method: 'POST',
      url:    '/v1/reservations',
      headers: authHeader(token),
      payload: validPayload,
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error).toMatch(/indisponível/i)
  })

  it('rejeita quarto de resort diferente', async () => {
    const { app, prisma, token } = await setup()

    prisma.room.findUnique.mockResolvedValue({
      ...mockRoom,
      resortId: TEST_IDS.resortSangano, // resort diferente do payload
    })

    const res = await app.inject({
      method: 'POST',
      url:    '/v1/reservations',
      headers: authHeader(token),
      payload: validPayload,
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('PATCH /v1/reservations/:id/check-in', () => {
  it('efetua check-in numa reserva CONFIRMED', async () => {
    const { app, prisma, token } = await setup()

    const reservaComQuarto = { ...mockReservation, room: mockRoom }
    prisma.reservation.findUnique.mockResolvedValue(reservaComQuarto)

    const updatedRes = { ...mockReservation, status: 'CHECKED_IN' }
    prisma['$transaction'].mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      prisma.reservation.update.mockResolvedValue({ ...updatedRes, room: { id: mockRoom.id, number: mockRoom.number, type: mockRoom.type }, resort: { id: 'resort_cabo_ledo', name: 'Cabo Ledo Resort' } })
      prisma.room.update.mockResolvedValue({ ...mockRoom, status: 'OCCUPIED' })
      return fn(prisma)
    })

    const res = await app.inject({
      method: 'PATCH',
      url:    `/v1/reservations/${mockReservation.id}/check-in`,
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toMatch(/check-in efetuado/i)
  })

  it('rejeita check-in numa reserva já em CHECKED_IN', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findUnique.mockResolvedValue({
      ...mockReservation,
      status: 'CHECKED_IN',
      room: mockRoom,
    })

    const res = await app.inject({
      method: 'PATCH',
      url:    `/v1/reservations/${mockReservation.id}/check-in`,
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/check-in não permitido/i)
  })

  it('retorna 404 para reserva inexistente', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url:    '/v1/reservations/nao_existe/check-in',
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(404)
  })
})

describe('PATCH /v1/reservations/:id/check-out', () => {
  it('efetua check-out e coloca quarto em CLEANING', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findUnique.mockResolvedValue({
      ...mockReservation,
      status: 'CHECKED_IN',
      room: mockRoom,
    })

    prisma['$transaction'].mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => {
      prisma.reservation.update.mockResolvedValue({
        ...mockReservation,
        status: 'CHECKED_OUT',
        room:   { id: mockRoom.id, number: mockRoom.number, type: mockRoom.type },
        resort: { id: 'resort_cabo_ledo', name: 'Cabo Ledo Resort' },
      })
      prisma.room.update.mockResolvedValue({ ...mockRoom, status: 'CLEANING' })
      return fn(prisma)
    })

    const res = await app.inject({
      method: 'PATCH',
      url:    `/v1/reservations/${mockReservation.id}/check-out`,
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toMatch(/check-out efetuado/i)
  })

  it('rejeita check-out numa reserva CONFIRMED', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findUnique.mockResolvedValue({
      ...mockReservation,
      status: 'CONFIRMED',
      room: mockRoom,
    })

    const res = await app.inject({
      method: 'PATCH',
      url:    `/v1/reservations/${mockReservation.id}/check-out`,
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/check-out não permitido/i)
  })
})

describe('PATCH /v1/reservations/:id/cancel', () => {
  it('cancela uma reserva CONFIRMED', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findUnique.mockResolvedValue(mockReservation)
    prisma.reservation.update.mockResolvedValue({
      ...mockReservation,
      status: 'CANCELLED',
      room:   { id: mockRoom.id, number: mockRoom.number, type: mockRoom.type },
      resort: { id: 'resort_cabo_ledo', name: 'Cabo Ledo Resort' },
    })

    const res = await app.inject({
      method: 'PATCH',
      url:    `/v1/reservations/${mockReservation.id}/cancel`,
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toMatch(/cancelada/i)
  })

  it('não permite cancelar reserva já CHECKED_OUT', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findUnique.mockResolvedValue({
      ...mockReservation,
      status: 'CHECKED_OUT',
    })

    const res = await app.inject({
      method: 'PATCH',
      url:    `/v1/reservations/${mockReservation.id}/cancel`,
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toMatch(/já finalizada/i)
  })

  it('liberta quarto ao cancelar reserva CHECKED_IN', async () => {
    const { app, prisma, token } = await setup()

    prisma.reservation.findUnique.mockResolvedValue({
      ...mockReservation,
      status: 'CHECKED_IN',
    })
    prisma.room.update.mockResolvedValue({})
    prisma.reservation.update.mockResolvedValue({
      ...mockReservation,
      status: 'CANCELLED',
      room:   { id: mockRoom.id, number: mockRoom.number, type: mockRoom.type },
      resort: { id: 'resort_cabo_ledo', name: 'Cabo Ledo Resort' },
    })

    const res = await app.inject({
      method: 'PATCH',
      url:    `/v1/reservations/${mockReservation.id}/cancel`,
      headers: authHeader(token),
    })

    expect(res.statusCode).toBe(200)
    // Verifica que o quarto foi libertado (status AVAILABLE)
    expect(prisma.room.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: 'AVAILABLE' },
      }),
    )
  })
})

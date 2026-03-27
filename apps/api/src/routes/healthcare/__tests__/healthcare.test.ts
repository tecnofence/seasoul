import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import healthcareRoutes from '../index.js'

const mockPrisma = {
  patient: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  appointment: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

const superAdminUser = {
  id: 'user-1',
  email: 'admin@engeris.ao',
  role: 'SUPER_ADMIN',
  tenantId: 'tenant-1',
  type: 'staff' as const,
}

const regularUser = {
  id: 'user-2',
  email: 'staff@engeris.ao',
  role: 'STAFF',
  tenantId: 'tenant-1',
  type: 'staff' as const,
}

const noTenantUser = {
  id: 'user-3',
  email: 'orphan@engeris.ao',
  role: 'STAFF',
  tenantId: undefined,
  type: 'staff' as const,
}

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Healthcare API — /v1/healthcare', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(healthcareRoutes, { prefix: '/v1/healthcare' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Patients ──

  it('GET /v1/healthcare/patients — should list patients with pagination', async () => {
    const mockPatients = [{ id: 'pat-1', name: 'João Silva', gender: 'MALE' }]
    mockPrisma.patient.findMany.mockResolvedValue(mockPatients)
    mockPrisma.patient.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/healthcare/patients?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET /v1/healthcare/patients — should filter by gender', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([])
    mockPrisma.patient.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/healthcare/patients?gender=FEMALE' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ gender: 'FEMALE' }),
      }),
    )
  })

  it('GET /v1/healthcare/patients — should enforce tenant isolation', async () => {
    mockPrisma.patient.findMany.mockResolvedValue([])
    mockPrisma.patient.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/healthcare/patients' })

    expect(mockPrisma.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
    )
  })

  it('GET /v1/healthcare/patients/:id — should return patient by ID (200)', async () => {
    const mockPatient = { id: 'pat-1', name: 'Ana Costa', tenantId: 'tenant-1' }
    mockPrisma.patient.findFirst.mockResolvedValue(mockPatient)

    const res = await app.inject({ method: 'GET', url: '/v1/healthcare/patients/pat-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('pat-1')
  })

  it('GET /v1/healthcare/patients/:id — should return 404 for non-existent patient', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/healthcare/patients/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  it('POST /v1/healthcare/patients — should create a patient (201)', async () => {
    const mockPatient = { id: 'pat-1', name: 'Maria Fernandes', tenantId: 'tenant-1' }
    mockPrisma.patient.create.mockResolvedValue(mockPatient)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/healthcare/patients',
      payload: { name: 'Maria Fernandes' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toEqual(mockPatient)
  })

  it('POST /v1/healthcare/patients — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/healthcare/patients',
      payload: { phone: '923456789' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST /v1/healthcare/patients — should return 400 when user has no tenant', async () => {
    const noTenantApp = buildApp(noTenantUser)
    await noTenantApp.register(healthcareRoutes, { prefix: '/v1/healthcare' })
    await noTenantApp.ready()

    const res = await noTenantApp.inject({
      method: 'POST',
      url: '/v1/healthcare/patients',
      payload: { name: 'Teste' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('Tenant')
    await noTenantApp.close()
  })

  it('PATCH /v1/healthcare/patients/:id — should update a patient', async () => {
    const existing = { id: 'pat-1', name: 'Old Name', tenantId: 'tenant-1' }
    const updated = { ...existing, name: 'New Name' }
    mockPrisma.patient.findFirst.mockResolvedValue(existing)
    mockPrisma.patient.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/healthcare/patients/pat-1',
      payload: { name: 'New Name' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.name).toBe('New Name')
  })

  it('PATCH /v1/healthcare/patients/:id — should return 404 for non-existent patient', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/healthcare/patients/non-existent',
      payload: { name: 'Nope' },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── Appointments ──

  it('GET /v1/healthcare/appointments — should list appointments with pagination', async () => {
    const mockAppts = [{ id: 'apt-1', specialty: 'Cardiologia', status: 'SCHEDULED' }]
    mockPrisma.appointment.findMany.mockResolvedValue(mockAppts)
    mockPrisma.appointment.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/healthcare/appointments' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('POST /v1/healthcare/appointments — should create an appointment (201)', async () => {
    const mockPatient = { id: 'pat-1', name: 'Ana', tenantId: 'tenant-1' }
    const mockAppt = { id: 'apt-1', patientId: 'pat-1', specialty: 'Ortopedia' }
    mockPrisma.patient.findFirst.mockResolvedValue(mockPatient)
    mockPrisma.appointment.create.mockResolvedValue(mockAppt)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/healthcare/appointments',
      payload: {
        patientId: 'pat-1',
        specialty: 'Ortopedia',
        scheduledAt: '2026-04-15T10:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(201)
  })

  it('POST /v1/healthcare/appointments — should return 404 when patient not found in tenant', async () => {
    mockPrisma.patient.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/healthcare/appointments',
      payload: {
        patientId: 'pat-unknown',
        specialty: 'Dermatologia',
        scheduledAt: '2026-04-15T10:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /v1/healthcare/appointments/:id/status — should update appointment status', async () => {
    const existing = { id: 'apt-1', status: 'SCHEDULED', tenantId: 'tenant-1' }
    const updated = { ...existing, status: 'COMPLETED', completedAt: new Date() }
    mockPrisma.appointment.findFirst.mockResolvedValue(existing)
    mockPrisma.appointment.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/healthcare/appointments/apt-1/status',
      payload: { status: 'COMPLETED', diagnosis: 'Fractura curada' },
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
          diagnosis: 'Fractura curada',
        }),
      }),
    )
  })

  it('PATCH /v1/healthcare/appointments/:id/status — should return 404 for non-existent appointment', async () => {
    mockPrisma.appointment.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/healthcare/appointments/non-existent/status',
      payload: { status: 'CANCELLED' },
    })

    expect(res.statusCode).toBe(404)
  })
})

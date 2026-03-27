import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import fleetRoutes from '../index.js'

// ── Mock Prisma ──────────────────────────────────
const mockPrisma = {
  vehicle: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  fuelLog: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
}

// ── Mock Users ───────────────────────────────────
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
  email: 'noorg@engeris.ao',
  role: 'STAFF',
  tenantId: undefined as string | undefined,
  type: 'staff' as const,
}

// ── Helpers ──────────────────────────────────────
function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

// ── TESTES ───────────────────────────────────────
describe('Fleet API — /v1/fleet', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(fleetRoutes, { prefix: '/v1/fleet' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ═══════════════════════════════════════════
  // VEICULOS
  // ═══════════════════════════════════════════

  describe('GET /v1/fleet', () => {
    it('deve listar veiculos com paginacao', async () => {
      const vehicles = [
        { id: 'v1', plate: 'LD-00-01-AA', brand: 'Toyota', model: 'Hilux', _count: { fuelLogs: 5 } },
      ]
      mockPrisma.vehicle.findMany.mockResolvedValue(vehicles)
      mockPrisma.vehicle.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/fleet?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(1)
      expect(body.totalPages).toBe(1)
    })

    it('deve filtrar veiculos por status', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([])
      mockPrisma.vehicle.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/fleet?status=AVAILABLE' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'AVAILABLE' }) }),
      )
    })

    it('deve suportar busca por search', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([])
      mockPrisma.vehicle.count.mockResolvedValue(0)

      const res = await app.inject({ method: 'GET', url: '/v1/fleet?search=Toyota' })

      expect(res.statusCode).toBe(200)
      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ brand: { contains: 'Toyota', mode: 'insensitive' } }),
            ]),
          }),
        }),
      )
    })
  })

  describe('GET /v1/fleet/:id', () => {
    it('deve retornar veiculo por ID', async () => {
      const vehicle = { id: 'v1', plate: 'LD-00-01-AA', tenantId: 'tenant-1', fuelLogs: [] }
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle)

      const res = await app.inject({ method: 'GET', url: '/v1/fleet/v1' })

      expect(res.statusCode).toBe(200)
      expect(res.json().data.id).toBe('v1')
    })

    it('deve retornar 404 se veiculo nao existe', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null)

      const res = await app.inject({ method: 'GET', url: '/v1/fleet/inexistente' })

      expect(res.statusCode).toBe(404)
    })
  })

  describe('POST /v1/fleet', () => {
    it('deve criar veiculo com sucesso', async () => {
      const created = { id: 'v1', plate: 'LD-00-01-AA', brand: 'Toyota', model: 'Hilux', type: 'CAR' }
      mockPrisma.vehicle.findUnique.mockResolvedValue(null) // plate uniqueness check
      mockPrisma.vehicle.create.mockResolvedValue(created)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/fleet',
        payload: {
          plate: 'LD-00-01-AA',
          brand: 'Toyota',
          model: 'Hilux',
          type: 'CAR',
        },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.id).toBe('v1')
    })

    it('deve retornar 400 para dados invalidos (plate em falta)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/fleet',
        payload: { brand: 'Toyota', model: 'Hilux', type: 'CAR' },
      })

      expect(res.statusCode).toBe(400)
    })

    it('deve retornar 400 se utilizador sem tenant', async () => {
      const noTenantApp = buildApp(noTenantUser)
      await noTenantApp.register(fleetRoutes, { prefix: '/v1/fleet' })
      await noTenantApp.ready()

      const res = await noTenantApp.inject({
        method: 'POST',
        url: '/v1/fleet',
        payload: {
          plate: 'LD-00-01-AA',
          brand: 'Toyota',
          model: 'Hilux',
          type: 'CAR',
        },
      })

      expect(res.statusCode).toBe(400)
      expect(res.json().error).toContain('Tenant')
      await noTenantApp.close()
    })

    it('deve retornar 409 para matricula duplicada no tenant', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValue({ id: 'v-existing', plate: 'LD-00-01-AA' })

      const res = await app.inject({
        method: 'POST',
        url: '/v1/fleet',
        payload: {
          plate: 'LD-00-01-AA',
          brand: 'Toyota',
          model: 'Hilux',
          type: 'CAR',
        },
      })

      expect(res.statusCode).toBe(409)
      expect(res.json().error).toContain('atrícula')
    })
  })

  describe('PATCH /v1/fleet/:id/status', () => {
    it('deve atualizar estado do veiculo', async () => {
      const existing = { id: 'v1', status: 'AVAILABLE', tenantId: 'tenant-1' }
      const updated = { ...existing, status: 'IN_USE' }
      mockPrisma.vehicle.findFirst.mockResolvedValue(existing)
      mockPrisma.vehicle.update.mockResolvedValue(updated)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/fleet/v1/status',
        payload: { status: 'IN_USE' },
      })

      expect(res.statusCode).toBe(200)
    })

    it('deve retornar 404 para veiculo inexistente', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/fleet/inexistente/status',
        payload: { status: 'MAINTENANCE' },
      })

      expect(res.statusCode).toBe(404)
    })
  })

  // ═══════════════════════════════════════════
  // REGISTOS DE COMBUSTIVEL
  // ═══════════════════════════════════════════

  describe('GET /v1/fleet/fuel-logs', () => {
    it('deve listar registos de combustivel com paginacao', async () => {
      const logs = [{ id: 'fl1', vehicleId: 'v1', liters: 50, vehicle: { id: 'v1', plate: 'LD-00-01-AA', brand: 'Toyota', model: 'Hilux' } }]
      mockPrisma.fuelLog.findMany.mockResolvedValue(logs)
      mockPrisma.fuelLog.count.mockResolvedValue(1)

      const res = await app.inject({ method: 'GET', url: '/v1/fleet/fuel-logs?page=1&limit=10' })

      expect(res.statusCode).toBe(200)
      const body = res.json()
      expect(body.data).toHaveLength(1)
      expect(body.total).toBe(1)
    })
  })

  describe('POST /v1/fleet/fuel-logs', () => {
    it('deve registar abastecimento com sucesso', async () => {
      const vehicle = { id: 'v1', tenantId: 'tenant-1', mileage: 50000 }
      const created = { id: 'fl1', vehicleId: 'v1', liters: 50, vehicle: { id: 'v1', plate: 'LD-00-01-AA' } }
      mockPrisma.vehicle.findFirst.mockResolvedValue(vehicle)
      mockPrisma.fuelLog.create.mockResolvedValue(created)
      mockPrisma.vehicle.update.mockResolvedValue({ ...vehicle, mileage: 51000 })

      const res = await app.inject({
        method: 'POST',
        url: '/v1/fleet/fuel-logs',
        payload: {
          vehicleId: 'v1',
          date: '2026-03-01',
          liters: 50,
          pricePerLiter: 350,
          mileage: 51000,
        },
      })

      expect(res.statusCode).toBe(201)
      expect(res.json().data.id).toBe('fl1')
    })

    it('deve retornar 404 se veiculo nao pertence ao tenant', async () => {
      mockPrisma.vehicle.findFirst.mockResolvedValue(null)

      const res = await app.inject({
        method: 'POST',
        url: '/v1/fleet/fuel-logs',
        payload: {
          vehicleId: 'v-wrong',
          date: '2026-03-01',
          liters: 50,
          pricePerLiter: 350,
          mileage: 51000,
        },
      })

      expect(res.statusCode).toBe(404)
    })

    it('deve retornar 400 para dados de abastecimento invalidos', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/fleet/fuel-logs',
        payload: { vehicleId: 'v1' },
      })

      expect(res.statusCode).toBe(400)
    })
  })

  // ═══════════════════════════════════════════
  // TENANT ISOLATION
  // ═══════════════════════════════════════════

  describe('Tenant isolation', () => {
    it('deve filtrar veiculos pelo tenantId do utilizador', async () => {
      mockPrisma.vehicle.findMany.mockResolvedValue([])
      mockPrisma.vehicle.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/fleet' })

      expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })

    it('deve filtrar fuel logs pelo tenantId do utilizador', async () => {
      mockPrisma.fuelLog.findMany.mockResolvedValue([])
      mockPrisma.fuelLog.count.mockResolvedValue(0)

      await app.inject({ method: 'GET', url: '/v1/fleet/fuel-logs' })

      expect(mockPrisma.fuelLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
      )
    })
  })
})

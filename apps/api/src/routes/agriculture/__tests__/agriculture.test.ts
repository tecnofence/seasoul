import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import agricultureRoutes from '../index.js'

const mockPrisma = {
  farm: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  crop: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  harvest: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
}

const superAdminUser = {
  id: 'user-1', email: 'admin@engeris.ao', role: 'SUPER_ADMIN',
  tenantId: 'tenant-1', type: 'staff' as const,
}

const regularUser = {
  id: 'user-2', email: 'staff@engeris.ao', role: 'STAFF',
  tenantId: 'tenant-1', type: 'staff' as const,
}

const noTenantUser = {
  id: 'user-3', email: 'noTenant@engeris.ao', role: 'SUPER_ADMIN',
  tenantId: undefined, type: 'staff' as const,
}

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Agriculture API — /v1/agriculture', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(agricultureRoutes, { prefix: '/v1/agriculture' })
    await app.ready()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  // ── FARMS ──

  it('GET /farms — should list farms with pagination (200)', async () => {
    const farms = [{ id: 'farm-1', name: 'Fazenda Ledo', tenantId: 'tenant-1' }]
    mockPrisma.farm.findMany.mockResolvedValue(farms)
    mockPrisma.farm.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/agriculture/farms?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET /farms/:id — should return a farm by ID (200)', async () => {
    const farm = { id: 'farm-1', name: 'Fazenda Ledo', tenantId: 'tenant-1', crops: [], harvests: [], _count: { crops: 0, harvests: 0 } }
    mockPrisma.farm.findFirst.mockResolvedValue(farm)

    const res = await app.inject({ method: 'GET', url: '/v1/agriculture/farms/farm-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('farm-1')
  })

  it('GET /farms/:id — should return 404 for non-existent farm', async () => {
    mockPrisma.farm.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/agriculture/farms/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Fazenda não encontrada')
  })

  it('POST /farms — should create a farm (201)', async () => {
    const created = { id: 'farm-2', name: 'Nova Fazenda', tenantId: 'tenant-1' }
    mockPrisma.farm.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/agriculture/farms',
      payload: { name: 'Nova Fazenda', location: 'Cabo Ledo' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.name).toBe('Nova Fazenda')
    expect(res.json().message).toBe('Fazenda criada com sucesso')
  })

  it('POST /farms — should return 400 for missing name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/agriculture/farms',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('POST /farms — should return 400 when tenantId is missing', async () => {
    const appNoTenant = buildApp(noTenantUser)
    await appNoTenant.register(agricultureRoutes, { prefix: '/v1/agriculture' })
    await appNoTenant.ready()

    const res = await appNoTenant.inject({
      method: 'POST',
      url: '/v1/agriculture/farms',
      payload: { name: 'Fazenda Sem Tenant' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Tenant não definido')
    await appNoTenant.close()
  })

  // ── CROPS ──

  it('GET /crops — should list crops with pagination (200)', async () => {
    const crops = [{ id: 'crop-1', name: 'Milho', farmId: 'farm-1' }]
    mockPrisma.crop.findMany.mockResolvedValue(crops)
    mockPrisma.crop.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/agriculture/crops?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
    expect(res.json().total).toBe(1)
  })

  it('POST /crops — should create a crop (201)', async () => {
    const farm = { id: 'farm-1', tenantId: 'tenant-1' }
    const crop = { id: 'crop-1', name: 'Milho', farmId: 'farm-1', farm: { id: 'farm-1', name: 'Fazenda' } }
    mockPrisma.farm.findFirst.mockResolvedValue(farm)
    mockPrisma.crop.create.mockResolvedValue(crop)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/agriculture/crops',
      payload: { farmId: 'farm-1', name: 'Milho' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data.name).toBe('Milho')
  })

  it('POST /crops — should return 404 when farm does not belong to tenant', async () => {
    mockPrisma.farm.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/agriculture/crops',
      payload: { farmId: 'farm-other', name: 'Milho' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Fazenda não encontrada neste tenant')
  })

  it('PATCH /crops/:id/status — should update crop status (200)', async () => {
    const existing = { id: 'crop-1', tenantId: 'tenant-1', status: 'PLANTED' }
    const updated = { ...existing, status: 'GROWING', farm: { id: 'farm-1', name: 'Fazenda' } }
    mockPrisma.crop.findFirst.mockResolvedValue(existing)
    mockPrisma.crop.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/agriculture/crops/crop-1/status',
      payload: { status: 'GROWING' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('GROWING')
  })

  it('PATCH /crops/:id/status — should return 404 for non-existent crop', async () => {
    mockPrisma.crop.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/agriculture/crops/nonexistent/status',
      payload: { status: 'GROWING' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Cultura não encontrada')
  })

  // ── HARVESTS ──

  it('GET /harvests — should list harvests with pagination (200)', async () => {
    const harvests = [{ id: 'harvest-1', quantity: 100, unit: 'kg' }]
    mockPrisma.harvest.findMany.mockResolvedValue(harvests)
    mockPrisma.harvest.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/agriculture/harvests?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('POST /harvests — should create a harvest (201)', async () => {
    const farm = { id: 'farm-1', tenantId: 'tenant-1' }
    const harvest = { id: 'harvest-1', farmId: 'farm-1', quantity: 500, unit: 'kg', farm: { id: 'farm-1', name: 'Fazenda' }, crop: null }
    mockPrisma.farm.findFirst.mockResolvedValue(farm)
    mockPrisma.harvest.create.mockResolvedValue(harvest)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/agriculture/harvests',
      payload: {
        farmId: 'farm-1',
        harvestedAt: '2026-03-01T00:00:00.000Z',
        quantity: 500,
        unit: 'kg',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Colheita registada com sucesso')
  })

  it('POST /harvests — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/agriculture/harvests',
      payload: { farmId: 'farm-1' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('GET /farms — tenant isolation: uses tenantId in query', async () => {
    mockPrisma.farm.findMany.mockResolvedValue([])
    mockPrisma.farm.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/agriculture/farms' })

    expect(mockPrisma.farm.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      })
    )
  })
})

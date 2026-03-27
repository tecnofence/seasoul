import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import alertsRoutes from '../index.js'

const mockPrisma = {
  alertRule: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
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

const managerUser = {
  id: 'user-3', email: 'manager@engeris.ao', role: 'RESORT_MANAGER',
  tenantId: 'tenant-1', type: 'staff' as const,
}

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Alerts API — /v1/alerts', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(alertsRoutes, { prefix: '/v1/alerts' })
    await app.ready()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('GET / — should list alert rules with pagination (200)', async () => {
    const rules = [{ id: 'rule-1', name: 'Contrato Expirando', module: 'contracts' }]
    mockPrisma.alertRule.findMany.mockResolvedValue(rules)
    mockPrisma.alertRule.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/alerts?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET / — should filter by module and active status', async () => {
    mockPrisma.alertRule.findMany.mockResolvedValue([])
    mockPrisma.alertRule.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/alerts?module=stock&active=true' })

    expect(mockPrisma.alertRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ module: 'stock', active: true }),
      })
    )
  })

  it('POST / — should create an alert rule as SUPER_ADMIN (201)', async () => {
    const created = { id: 'rule-2', name: 'Stock Baixo', module: 'stock', tenantId: 'tenant-1' }
    mockPrisma.alertRule.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/alerts',
      payload: {
        name: 'Stock Baixo',
        module: 'stock',
        condition: 'quantity < minimum',
        channels: ['email', 'push'],
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Regra de alerta criada')
  })

  it('POST / — should create an alert rule as RESORT_MANAGER (201)', async () => {
    const appManager = buildApp(managerUser)
    await appManager.register(alertsRoutes, { prefix: '/v1/alerts' })
    await appManager.ready()

    const created = { id: 'rule-3', name: 'Fatura Vencida', module: 'invoicing', tenantId: 'tenant-1' }
    mockPrisma.alertRule.create.mockResolvedValue(created)

    const res = await appManager.inject({
      method: 'POST',
      url: '/v1/alerts',
      payload: {
        name: 'Fatura Vencida',
        module: 'invoicing',
        condition: 'dueDate < now()',
        channels: ['email'],
      },
    })

    expect(res.statusCode).toBe(201)
    await appManager.close()
  })

  it('POST / — should return 403 for non-admin role (STAFF)', async () => {
    const appStaff = buildApp(regularUser)
    await appStaff.register(alertsRoutes, { prefix: '/v1/alerts' })
    await appStaff.ready()

    const res = await appStaff.inject({
      method: 'POST',
      url: '/v1/alerts',
      payload: {
        name: 'Test',
        module: 'stock',
        condition: 'test',
        channels: ['email'],
      },
    })

    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('Sem permissão')
    await appStaff.close()
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/alerts',
      payload: { name: 'Incomplete' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('PATCH /:id — should update an alert rule (200)', async () => {
    const existing = { id: 'rule-1', tenantId: 'tenant-1', name: 'Old Name' }
    const updated = { ...existing, name: 'Updated Name' }
    mockPrisma.alertRule.findFirst.mockResolvedValue(existing)
    mockPrisma.alertRule.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/alerts/rule-1',
      payload: { name: 'Updated Name' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.name).toBe('Updated Name')
    expect(res.json().message).toBe('Regra de alerta atualizada')
  })

  it('PATCH /:id — should return 404 for non-existent rule', async () => {
    mockPrisma.alertRule.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/alerts/nonexistent',
      payload: { name: 'Test' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Regra de alerta não encontrada')
  })

  it('PATCH /:id — should return 403 for non-admin role (STAFF)', async () => {
    const appStaff = buildApp(regularUser)
    await appStaff.register(alertsRoutes, { prefix: '/v1/alerts' })
    await appStaff.ready()

    const res = await appStaff.inject({
      method: 'PATCH',
      url: '/v1/alerts/rule-1',
      payload: { name: 'Nope' },
    })

    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('Sem permissão')
    await appStaff.close()
  })

  it('DELETE /:id — should delete an alert rule (200)', async () => {
    const existing = { id: 'rule-1', tenantId: 'tenant-1' }
    mockPrisma.alertRule.findFirst.mockResolvedValue(existing)
    mockPrisma.alertRule.delete.mockResolvedValue(existing)

    const res = await app.inject({ method: 'DELETE', url: '/v1/alerts/rule-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Regra de alerta eliminada')
  })

  it('DELETE /:id — should return 404 for non-existent rule', async () => {
    mockPrisma.alertRule.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'DELETE', url: '/v1/alerts/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Regra de alerta não encontrada')
  })

  it('DELETE /:id — should return 403 for non-admin role (STAFF)', async () => {
    const appStaff = buildApp(regularUser)
    await appStaff.register(alertsRoutes, { prefix: '/v1/alerts' })
    await appStaff.ready()

    const res = await appStaff.inject({ method: 'DELETE', url: '/v1/alerts/rule-1' })

    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('Sem permissão')
    await appStaff.close()
  })

  it('GET / — tenant isolation: uses tenantId in query', async () => {
    mockPrisma.alertRule.findMany.mockResolvedValue([])
    mockPrisma.alertRule.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/alerts' })

    expect(mockPrisma.alertRule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      })
    )
  })
})

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import apiKeysRoutes from '../index.js'

const mockPrisma = {
  apiKey: {
    findMany:    vi.fn(),
    create:      vi.fn(),
    updateMany:  vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}

const adminUser = {
  id:       'user-admin',
  email:    'admin@engeris.ao',
  role:     'SUPER_ADMIN',
  tenantId: 'tenant-1',
}

const managerUser = {
  id:       'user-manager',
  email:    'manager@engeris.ao',
  role:     'RESORT_MANAGER',
  tenantId: 'tenant-1',
}

const staffUser = {
  id:       'user-staff',
  email:    'staff@engeris.ao',
  role:     'STAFF',
  tenantId: 'tenant-1',
}

function buildApp(user: any = adminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('API Keys — /v1/api-keys', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(apiKeysRoutes, { prefix: '/v1/api-keys' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET /scopes ──

  it('GET /scopes — deve listar scopes disponíveis (200)', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/api-keys/scopes' })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toContain('invoices:read')
    expect(body.data).toContain('invoices:write')
    expect(body.data).toContain('webhooks:manage')
  })

  // ── GET / — listar keys ──

  it('GET / — deve listar API keys do tenant (200)', async () => {
    const mockKeys = [
      { id: 'key-1', name: 'ERP Integration', keyPrefix: 'sk_live_abc', scopes: ['invoices:read'], createdAt: new Date() },
    ]
    mockPrisma.apiKey.findMany.mockResolvedValue(mockKeys)

    const res = await app.inject({ method: 'GET', url: '/v1/api-keys' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
    expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1', active: true }) })
    )
  })

  it('GET / — deve retornar 403 para STAFF (sem permissão)', async () => {
    const staffApp = buildApp(staffUser)
    await staffApp.register(apiKeysRoutes, { prefix: '/v1/api-keys' })
    await staffApp.ready()

    const res = await staffApp.inject({ method: 'GET', url: '/v1/api-keys' })

    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('Sem permissão')
    await staffApp.close()
  })

  it('GET / — deve permitir acesso a RESORT_MANAGER (200)', async () => {
    mockPrisma.apiKey.findMany.mockResolvedValue([])
    const mgrApp = buildApp(managerUser)
    await mgrApp.register(apiKeysRoutes, { prefix: '/v1/api-keys' })
    await mgrApp.ready()

    const res = await mgrApp.inject({ method: 'GET', url: '/v1/api-keys' })

    expect(res.statusCode).toBe(200)
    await mgrApp.close()
  })

  // ── POST / — criar key ──

  it('POST / — deve criar uma API key e devolver token em claro (201)', async () => {
    mockPrisma.apiKey.create.mockResolvedValue({
      id:        'key-new',
      name:      'My Integration',
      keyPrefix: 'sk_live_test1',
      scopes:    ['invoices:read', 'invoices:write'],
      expiresAt: null,
    })
    mockPrisma.auditLog.create.mockResolvedValue({})

    const res = await app.inject({
      method: 'POST',
      url: '/v1/api-keys',
      payload: {
        name:   'My Integration',
        scopes: ['invoices:read', 'invoices:write'],
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.data.key).toMatch(/^sk_live_/)
    expect(body.data.keyPrefix).toBeDefined()
    expect(body.data._warning).toBeDefined()
    expect(mockPrisma.auditLog.create).toHaveBeenCalled()
  })

  it('POST / — deve retornar 400 quando name está em falta', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/api-keys',
      payload: { scopes: ['invoices:read'] },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('name é obrigatório')
  })

  it('POST / — deve retornar 400 quando scopes está em falta', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/api-keys',
      payload: { name: 'Test Key' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('scopes são obrigatórios')
  })

  it('POST / — deve retornar 400 para scopes inválidos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/api-keys',
      payload: { name: 'Test Key', scopes: ['invoices:delete', 'nonexistent:scope'] },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('Scopes inválidos')
  })

  it('POST / — deve retornar 403 para STAFF', async () => {
    const staffApp = buildApp(staffUser)
    await staffApp.register(apiKeysRoutes, { prefix: '/v1/api-keys' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/api-keys',
      payload: { name: 'Hack', scopes: ['invoices:read'] },
    })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })

  it('POST / — deve aceitar expiresAt opcional', async () => {
    mockPrisma.apiKey.create.mockResolvedValue({
      id:        'key-expires',
      name:      'Temp Key',
      keyPrefix: 'sk_live_temp1',
      scopes:    ['reports:read'],
      expiresAt: new Date('2027-01-01'),
    })
    mockPrisma.auditLog.create.mockResolvedValue({})

    const res = await app.inject({
      method: 'POST',
      url: '/v1/api-keys',
      payload: {
        name:      'Temp Key',
        scopes:    ['reports:read'],
        expiresAt: '2027-01-01T00:00:00.000Z',
      },
    })

    expect(res.statusCode).toBe(201)
    expect(mockPrisma.apiKey.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ expiresAt: expect.any(Date) }),
      })
    )
  })

  // ── DELETE /:id ──

  it('DELETE /:id — deve revogar uma API key (200)', async () => {
    mockPrisma.apiKey.updateMany.mockResolvedValue({ count: 1 })
    mockPrisma.auditLog.create.mockResolvedValue({})

    const res = await app.inject({ method: 'DELETE', url: '/v1/api-keys/key-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('API key revogada com sucesso')
    expect(mockPrisma.apiKey.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { active: false } })
    )
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'API_KEY_REVOKED' }),
      })
    )
  })

  it('DELETE /:id — deve retornar 403 para STAFF', async () => {
    const staffApp = buildApp(staffUser)
    await staffApp.register(apiKeysRoutes, { prefix: '/v1/api-keys' })
    await staffApp.ready()

    const res = await staffApp.inject({ method: 'DELETE', url: '/v1/api-keys/key-1' })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })
})

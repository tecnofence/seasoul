import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import accountingRoutes from '../index.js'

const mockPrisma = {
  accountingEntry: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
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

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Accounting API — /v1/accounting', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(accountingRoutes, { prefix: '/v1/accounting' })
    await app.ready()
  })

  afterAll(async () => { await app.close() })
  beforeEach(() => { vi.clearAllMocks() })

  it('GET / — should list accounting entries with pagination (200)', async () => {
    const entries = [{ id: 'entry-1', description: 'Receita Hotel', account: '7100' }]
    mockPrisma.accountingEntry.findMany.mockResolvedValue(entries)
    mockPrisma.accountingEntry.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/accounting?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET / — should filter by account and category', async () => {
    mockPrisma.accountingEntry.findMany.mockResolvedValue([])
    mockPrisma.accountingEntry.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/accounting?account=7100&category=REVENUE' })

    expect(mockPrisma.accountingEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ account: '7100', category: 'REVENUE' }),
      })
    )
  })

  it('POST / — should create an accounting entry (201)', async () => {
    const created = { id: 'entry-2', description: 'Despesa Manutenção', tenantId: 'tenant-1' }
    mockPrisma.accountingEntry.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/accounting',
      payload: {
        date: '2026-03-15T00:00:00.000Z',
        description: 'Despesa Manutenção',
        account: '6200',
        debit: 50000,
        credit: 0,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Lançamento criado com sucesso')
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/accounting',
      payload: { date: '2026-03-15T00:00:00.000Z' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('POST / — should return 400 when tenantId is missing', async () => {
    const appNoTenant = buildApp(noTenantUser)
    await appNoTenant.register(accountingRoutes, { prefix: '/v1/accounting' })
    await appNoTenant.ready()

    const res = await appNoTenant.inject({
      method: 'POST',
      url: '/v1/accounting',
      payload: {
        date: '2026-03-15T00:00:00.000Z',
        description: 'Test', account: '7100', debit: 100, credit: 0,
      },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Tenant não definido')
    await appNoTenant.close()
  })

  it('PATCH /:id — should update an accounting entry (200)', async () => {
    const existing = { id: 'entry-1', tenantId: 'tenant-1', reconciled: false, description: 'Old' }
    const updated = { ...existing, description: 'Updated' }
    mockPrisma.accountingEntry.findFirst.mockResolvedValue(existing)
    mockPrisma.accountingEntry.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/accounting/entry-1',
      payload: { description: 'Updated' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.description).toBe('Updated')
  })

  it('PATCH /:id — should return 404 for non-existent entry', async () => {
    mockPrisma.accountingEntry.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/accounting/nonexistent',
      payload: { description: 'Test' },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Lançamento não encontrado')
  })

  it('PATCH /:id — should return 400 when entry is already reconciled', async () => {
    const existing = { id: 'entry-1', tenantId: 'tenant-1', reconciled: true }
    mockPrisma.accountingEntry.findFirst.mockResolvedValue(existing)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/accounting/entry-1',
      payload: { description: 'Try update' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Não é possível alterar um lançamento já reconciliado')
  })

  it('POST /:id/reconcile — should reconcile an entry (200)', async () => {
    const existing = { id: 'entry-1', tenantId: 'tenant-1', reconciled: false }
    const updated = { ...existing, reconciled: true }
    mockPrisma.accountingEntry.findFirst.mockResolvedValue(existing)
    mockPrisma.accountingEntry.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/accounting/entry-1/reconcile',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Lançamento reconciliado com sucesso')
  })

  it('POST /:id/reconcile — should return 400 when already reconciled', async () => {
    const existing = { id: 'entry-1', tenantId: 'tenant-1', reconciled: true }
    mockPrisma.accountingEntry.findFirst.mockResolvedValue(existing)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/accounting/entry-1/reconcile',
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Lançamento já está reconciliado')
  })

  it('POST /:id/reconcile — should return 404 for non-existent entry', async () => {
    mockPrisma.accountingEntry.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/accounting/nonexistent/reconcile',
    })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Lançamento não encontrado')
  })

  it('GET /balance — should return balance summary (200)', async () => {
    mockPrisma.accountingEntry.aggregate.mockResolvedValue({ _sum: { debit: 100000, credit: 60000 } })
    mockPrisma.accountingEntry.groupBy.mockResolvedValue([
      { category: 'REVENUE', _sum: { debit: 0, credit: 60000 } },
    ])

    const res = await app.inject({ method: 'GET', url: '/v1/accounting/balance' })

    expect(res.statusCode).toBe(200)
    const data = res.json().data
    expect(data.totalDebit).toBe(100000)
    expect(data.totalCredit).toBe(60000)
    expect(data.balance).toBe(40000)
  })

  it('GET /trial-balance — should return trial balance by account (200)', async () => {
    mockPrisma.accountingEntry.groupBy.mockResolvedValue([
      { account: '7100', _sum: { debit: 0, credit: 50000 } },
      { account: '6200', _sum: { debit: 30000, credit: 0 } },
    ])

    const res = await app.inject({ method: 'GET', url: '/v1/accounting/trial-balance' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(2)
  })

  it('GET / — tenant isolation: uses tenantId in query', async () => {
    mockPrisma.accountingEntry.findMany.mockResolvedValue([])
    mockPrisma.accountingEntry.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/accounting' })

    expect(mockPrisma.accountingEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      })
    )
  })
})

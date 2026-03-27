import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import suppliersRoutes from '../index.js'

const mockPrisma = {
  supplier: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
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

function buildApp(user: any = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Suppliers API — /v1/suppliers', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(suppliersRoutes, { prefix: '/v1/suppliers' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — Listar fornecedores ──

  it('should list suppliers with pagination (200)', async () => {
    const suppliers = [{ id: 'sup-1', name: 'Fornecedor A', nif: '123456789', active: true }]
    mockPrisma.supplier.findMany.mockResolvedValue(suppliers)
    mockPrisma.supplier.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/suppliers?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('should filter suppliers by search term', async () => {
    mockPrisma.supplier.findMany.mockResolvedValue([])
    mockPrisma.supplier.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/suppliers?page=1&limit=10&search=Angola',
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.supplier.findMany).toHaveBeenCalled()
  })

  it('should filter suppliers by active status', async () => {
    mockPrisma.supplier.findMany.mockResolvedValue([])
    mockPrisma.supplier.count.mockResolvedValue(0)

    const res = await app.inject({
      method: 'GET',
      url: '/v1/suppliers?page=1&limit=10&active=true',
    })

    expect(res.statusCode).toBe(200)
  })

  // ── GET /:id — Obter fornecedor ──

  it('should return a supplier by ID (200)', async () => {
    const supplier = { id: 'sup-1', name: 'Fornecedor A', stockMovements: [] }
    mockPrisma.supplier.findUnique.mockResolvedValue(supplier)

    const res = await app.inject({ method: 'GET', url: '/v1/suppliers/sup-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('sup-1')
  })

  it('should return 404 when supplier not found', async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/suppliers/nonexistent' })

    expect(res.statusCode).toBe(404)
    expect(res.json().error).toBe('Fornecedor não encontrado')
  })

  // ── POST / — Criar fornecedor ──

  it('should create a supplier (201)', async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue(null) // no duplicate NIF
    mockPrisma.supplier.create.mockResolvedValue({ id: 'sup-new', name: 'Novo Fornecedor', nif: '987654321' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/suppliers',
      payload: { name: 'Novo Fornecedor', nif: '987654321', phone: '+244923456789' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().message).toBe('Fornecedor criado com sucesso')
  })

  it('should return 400 when create body is invalid', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/suppliers',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Dados inválidos')
  })

  it('should return 409 when NIF is duplicate', async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue({ id: 'sup-existing', nif: '123456789' })

    const res = await app.inject({
      method: 'POST',
      url: '/v1/suppliers',
      payload: { name: 'Duplicate', nif: '123456789', phone: '+244923456789' },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json().error).toBe('NIF já registado')
  })

  it('should return 403 for unauthorized user on create', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(suppliersRoutes, { prefix: '/v1/suppliers' })
    await staffApp.ready()

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/suppliers',
      payload: { name: 'Test', nif: '111111111', phone: '+244923456789' },
    })

    expect(res.statusCode).toBe(403)
    expect(res.json().error).toBe('Sem permissão')
    await staffApp.close()
  })

  // ── PUT /:id — Atualizar fornecedor ──

  it('should update a supplier (200)', async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue({ id: 'sup-1', name: 'Old Name', nif: '123456789' })
    mockPrisma.supplier.update.mockResolvedValue({ id: 'sup-1', name: 'New Name' })

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/suppliers/sup-1',
      payload: { name: 'New Name' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Fornecedor atualizado')
  })

  it('should return 404 when updating non-existent supplier', async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PUT',
      url: '/v1/suppliers/nonexistent',
      payload: { name: 'Updated' },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── DELETE /:id — Desativar fornecedor ──

  it('should deactivate a supplier (200)', async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue({ id: 'sup-1', active: true })
    mockPrisma.supplier.update.mockResolvedValue({ id: 'sup-1', active: false })

    const res = await app.inject({ method: 'DELETE', url: '/v1/suppliers/sup-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().message).toBe('Fornecedor desativado')
  })

  it('should return 404 when deleting non-existent supplier', async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'DELETE', url: '/v1/suppliers/nonexistent' })

    expect(res.statusCode).toBe(404)
  })

  it('should return 403 for STAFF role on delete', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(suppliersRoutes, { prefix: '/v1/suppliers' })
    await staffApp.ready()

    const res = await staffApp.inject({ method: 'DELETE', url: '/v1/suppliers/sup-1' })

    expect(res.statusCode).toBe(403)
    await staffApp.close()
  })
})

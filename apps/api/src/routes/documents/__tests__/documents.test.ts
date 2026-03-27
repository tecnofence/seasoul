import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import documentsRoutes from '../index.js'

const mockPrisma = {
  document: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Documents API — /v1/documents', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(documentsRoutes, { prefix: '/v1/documents' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── GET / — List documents ──

  it('GET / — should list documents with pagination (200)', async () => {
    const docs = [
      { id: 'doc-1', name: 'passport.pdf', type: 'ID_DOCUMENT', entityType: 'Guest', entityId: 'g1', createdAt: new Date() },
      { id: 'doc-2', name: 'contract.pdf', type: 'CONTRACT', entityType: 'Employee', entityId: 'emp-1', createdAt: new Date() },
    ]
    mockPrisma.document.findMany.mockResolvedValue(docs)
    mockPrisma.document.count.mockResolvedValue(2)

    const res = await app.inject({ method: 'GET', url: '/v1/documents' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(2)
    expect(body).toHaveProperty('total', 2)
    expect(body).toHaveProperty('page', 1)
    expect(body).toHaveProperty('totalPages', 1)
  })

  it('GET / — should filter by entityType and entityId', async () => {
    mockPrisma.document.findMany.mockResolvedValue([])
    mockPrisma.document.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/documents?entityType=Guest&entityId=g1' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ entityType: 'Guest', entityId: 'g1' }),
      }),
    )
  })

  it('GET / — should filter by document type', async () => {
    mockPrisma.document.findMany.mockResolvedValue([])
    mockPrisma.document.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/documents?type=CONTRACT' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'CONTRACT' }),
      }),
    )
  })

  it('GET / — should support pagination parameters', async () => {
    mockPrisma.document.findMany.mockResolvedValue([])
    mockPrisma.document.count.mockResolvedValue(50)

    const res = await app.inject({ method: 'GET', url: '/v1/documents?page=2&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('page', 2)
    expect(body).toHaveProperty('limit', 10)
    expect(body).toHaveProperty('totalPages', 5)
  })

  // ── GET /:id — Get document by ID ──

  it('GET /:id — should return document detail (200)', async () => {
    const doc = { id: 'doc-1', name: 'passport.pdf', type: 'ID_DOCUMENT', fileUrl: 'https://minio.local/docs/passport.pdf' }
    mockPrisma.document.findUnique.mockResolvedValue(doc)

    const res = await app.inject({ method: 'GET', url: '/v1/documents/doc-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveProperty('id', 'doc-1')
    expect(res.json().data).toHaveProperty('fileUrl')
  })

  it('GET /:id — should return 404 for non-existent document', async () => {
    mockPrisma.document.findUnique.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/documents/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  // ── POST / — Create document ──

  it('POST / — should create document (201)', async () => {
    const created = {
      id: 'doc-new',
      entityType: 'Guest',
      entityId: 'g1',
      type: 'ID_DOCUMENT',
      name: 'passport.pdf',
      fileUrl: 'https://minio.local/docs/passport.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 102400,
      uploadedBy: 'user-1',
    }
    mockPrisma.document.create.mockResolvedValue(created)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/documents',
      payload: {
        entityType: 'Guest',
        entityId: 'g1',
        type: 'ID_DOCUMENT',
        name: 'passport.pdf',
        fileUrl: 'https://minio.local/docs/passport.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 102400,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toHaveProperty('id', 'doc-new')
    expect(mockPrisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ uploadedBy: 'user-1' }),
      }),
    )
  })

  it('POST / — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/documents',
      payload: {},
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST / — should return 400 for invalid fileUrl', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/documents',
      payload: {
        entityType: 'Guest',
        entityId: 'g1',
        type: 'ID_DOCUMENT',
        name: 'passport.pdf',
        fileUrl: 'not-a-url',
        mimeType: 'application/pdf',
        sizeBytes: 102400,
      },
    })

    expect(res.statusCode).toBe(400)
  })

  // ── DELETE /:id — Delete document ──

  it('DELETE /:id — should delete document (200)', async () => {
    mockPrisma.document.findUnique.mockResolvedValue({ id: 'doc-1', name: 'old.pdf' })
    mockPrisma.document.delete.mockResolvedValue({ id: 'doc-1' })

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/documents/doc-1',
    })

    expect(res.statusCode).toBe(200)
    expect(res.json()).toHaveProperty('message')
    expect(mockPrisma.document.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'doc-1' } }),
    )
  })

  it('DELETE /:id — should return 404 for non-existent document', async () => {
    mockPrisma.document.findUnique.mockResolvedValue(null)

    const res = await app.inject({
      method: 'DELETE',
      url: '/v1/documents/non-existent',
    })

    expect(res.statusCode).toBe(404)
  })

  it('DELETE /:id — should set uploadedBy from authenticated user on create', async () => {
    const staffApp = buildApp(regularUser)
    await staffApp.register(documentsRoutes, { prefix: '/v1/documents' })
    await staffApp.ready()

    mockPrisma.document.create.mockResolvedValue({ id: 'doc-staff', uploadedBy: 'user-2' })

    const res = await staffApp.inject({
      method: 'POST',
      url: '/v1/documents',
      payload: {
        entityType: 'Employee',
        entityId: 'emp-1',
        type: 'CONTRACT',
        name: 'contract.pdf',
        fileUrl: 'https://minio.local/docs/contract.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 204800,
      },
    })

    expect(res.statusCode).toBe(201)
    expect(mockPrisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ uploadedBy: 'user-2' }),
      }),
    )
    await staffApp.close()
  })
})

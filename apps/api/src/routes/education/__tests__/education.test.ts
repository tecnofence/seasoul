import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'
import educationRoutes from '../index.js'

const mockPrisma = {
  course: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  enrollment: {
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

function buildApp(user = superAdminUser): FastifyInstance {
  const app = Fastify()
  app.decorate('prisma', mockPrisma as any)
  app.decorate('authenticate', async (request: any, _reply: any) => {
    request.user = user
  })
  return app
}

describe('Education API — /v1/education', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = buildApp()
    await app.register(educationRoutes, { prefix: '/v1/education' })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Courses ──

  it('GET /v1/education/courses — should list courses with pagination', async () => {
    const mockCourses = [{ id: 'crs-1', name: 'Gestão Hoteleira', status: 'PUBLISHED' }]
    mockPrisma.course.findMany.mockResolvedValue(mockCourses)
    mockPrisma.course.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/education/courses?page=1&limit=10' })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.data).toHaveLength(1)
    expect(body.total).toBe(1)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
  })

  it('GET /v1/education/courses — should filter by status', async () => {
    mockPrisma.course.findMany.mockResolvedValue([])
    mockPrisma.course.count.mockResolvedValue(0)

    const res = await app.inject({ method: 'GET', url: '/v1/education/courses?status=DRAFT' })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'DRAFT' }),
      }),
    )
  })

  it('GET /v1/education/courses — should enforce tenant isolation', async () => {
    mockPrisma.course.findMany.mockResolvedValue([])
    mockPrisma.course.count.mockResolvedValue(0)

    await app.inject({ method: 'GET', url: '/v1/education/courses' })

    expect(mockPrisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ tenantId: 'tenant-1' }),
      }),
    )
  })

  it('GET /v1/education/courses/:id — should return course by ID (200)', async () => {
    const mockCourse = { id: 'crs-1', name: 'Turismo', tenantId: 'tenant-1' }
    mockPrisma.course.findFirst.mockResolvedValue(mockCourse)

    const res = await app.inject({ method: 'GET', url: '/v1/education/courses/crs-1' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe('crs-1')
  })

  it('GET /v1/education/courses/:id — should return 404 for non-existent course', async () => {
    mockPrisma.course.findFirst.mockResolvedValue(null)

    const res = await app.inject({ method: 'GET', url: '/v1/education/courses/non-existent' })

    expect(res.statusCode).toBe(404)
  })

  it('POST /v1/education/courses — should create a course (201)', async () => {
    const mockCourse = { id: 'crs-1', name: 'Gestão de Resorts', status: 'DRAFT' }
    mockPrisma.course.create.mockResolvedValue(mockCourse)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/education/courses',
      payload: { name: 'Gestão de Resorts' },
    })

    expect(res.statusCode).toBe(201)
    expect(res.json().data).toEqual(mockCourse)
  })

  it('POST /v1/education/courses — should return 400 for missing required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/education/courses',
      payload: { description: 'No name provided' },
    })

    expect(res.statusCode).toBe(400)
  })

  it('POST /v1/education/courses — should return 400 when user has no tenant', async () => {
    const noTenantApp = buildApp(noTenantUser)
    await noTenantApp.register(educationRoutes, { prefix: '/v1/education' })
    await noTenantApp.ready()

    const res = await noTenantApp.inject({
      method: 'POST',
      url: '/v1/education/courses',
      payload: { name: 'Teste' },
    })

    expect(res.statusCode).toBe(400)
    expect(res.json().error).toContain('Tenant')
    await noTenantApp.close()
  })

  it('PATCH /v1/education/courses/:id — should update a course', async () => {
    const existing = { id: 'crs-1', name: 'Old Name', tenantId: 'tenant-1' }
    const updated = { ...existing, name: 'New Name' }
    mockPrisma.course.findFirst.mockResolvedValue(existing)
    mockPrisma.course.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/education/courses/crs-1',
      payload: { name: 'New Name' },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json().data.name).toBe('New Name')
  })

  it('PATCH /v1/education/courses/:id — should return 404 for non-existent course', async () => {
    mockPrisma.course.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/education/courses/non-existent',
      payload: { name: 'Nope' },
    })

    expect(res.statusCode).toBe(404)
  })

  // ── Enrollments ──

  it('GET /v1/education/enrollments — should list enrollments with pagination', async () => {
    const mockEnrollments = [{ id: 'enr-1', studentName: 'Ana', status: 'ACTIVE' }]
    mockPrisma.enrollment.findMany.mockResolvedValue(mockEnrollments)
    mockPrisma.enrollment.count.mockResolvedValue(1)

    const res = await app.inject({ method: 'GET', url: '/v1/education/enrollments' })

    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
  })

  it('POST /v1/education/enrollments — should create an enrollment (201)', async () => {
    const mockCourse = { id: 'crs-1', name: 'Curso Teste', tenantId: 'tenant-1' }
    const mockEnrollment = { id: 'enr-1', studentName: 'Carlos', courseId: 'crs-1' }
    mockPrisma.course.findFirst.mockResolvedValue(mockCourse)
    mockPrisma.enrollment.create.mockResolvedValue(mockEnrollment)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/education/enrollments',
      payload: {
        courseId: 'crs-1',
        studentName: 'Carlos',
      },
    })

    expect(res.statusCode).toBe(201)
  })

  it('POST /v1/education/enrollments — should return 404 when course not found in tenant', async () => {
    mockPrisma.course.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'POST',
      url: '/v1/education/enrollments',
      payload: {
        courseId: 'crs-unknown',
        studentName: 'Pedro',
      },
    })

    expect(res.statusCode).toBe(404)
  })

  it('PATCH /v1/education/enrollments/:id/status — should update enrollment status', async () => {
    const existing = { id: 'enr-1', status: 'ACTIVE', tenantId: 'tenant-1' }
    const updated = { ...existing, status: 'COMPLETED', completedAt: new Date() }
    mockPrisma.enrollment.findFirst.mockResolvedValue(existing)
    mockPrisma.enrollment.update.mockResolvedValue(updated)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/education/enrollments/enr-1/status',
      payload: { status: 'COMPLETED' },
    })

    expect(res.statusCode).toBe(200)
    expect(mockPrisma.enrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED',
          completedAt: expect.any(Date),
        }),
      }),
    )
  })

  it('PATCH /v1/education/enrollments/:id/status — should return 404 for non-existent enrollment', async () => {
    mockPrisma.enrollment.findFirst.mockResolvedValue(null)

    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/education/enrollments/non-existent/status',
      payload: { status: 'CANCELLED' },
    })

    expect(res.statusCode).toBe(404)
  })
})

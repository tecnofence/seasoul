import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ── Schemas de validação ──

const listPatientsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
})

const createPatientSchema = z.object({
  name: z.string().min(1),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  nif: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
})

const updatePatientSchema = z.object({
  name: z.string().min(1).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  nif: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medicalNotes: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
})

const listAppointmentsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  patientId: z.string().optional(),
  specialty: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
})

const createAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().optional(),
  specialty: z.string().min(1),
  scheduledAt: z.coerce.date(),
  duration: z.number().int().positive().default(30),
  reason: z.string().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().default('AOA'),
  notes: z.string().optional(),
})

const updateAppointmentStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
  diagnosis: z.string().optional(),
  prescription: z.string().optional(),
  notes: z.string().optional(),
})

// ── Rotas de Saúde ──

export default async function healthcareRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ════════════════════════════════════════════
  // PACIENTES
  // ════════════════════════════════════════════

  // ── GET /patients — Listar pacientes ──
  app.get('/patients', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listPatientsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, search, gender } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (gender) where.gender = gender
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nif: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    const [patients, total] = await Promise.all([
      app.prisma.patient.findMany({
        where,
        include: {
          _count: { select: { appointments: true } },
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      app.prisma.patient.count({ where }),
    ])

    return reply.send({
      data: patients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── POST /patients — Criar paciente ──
  app.post('/patients', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createPatientSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    const patient = await app.prisma.patient.create({
      data: {
        ...parsed.data,
        tenantId: user.tenantId,
        dateOfBirth: parsed.data.dateOfBirth ?? undefined,
      },
    })

    return reply.code(201).send({ data: patient, message: 'Paciente criado com sucesso' })
  })

  // ── GET /patients/:id — Obter paciente com consultas recentes ──
  app.get<{ Params: { id: string } }>('/patients/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }

    const patient = await app.prisma.patient.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
      include: {
        _count: { select: { appointments: true } },
        appointments: { orderBy: { scheduledAt: 'desc' }, take: 20 },
      },
    })

    if (!patient) {
      return reply.code(404).send({ error: 'Paciente não encontrado' })
    }

    return reply.send({ data: patient })
  })

  // ── PATCH /patients/:id — Atualizar paciente ──
  app.patch<{ Params: { id: string } }>('/patients/:id', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updatePatientSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.patient.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Paciente não encontrado' })
    }

    const patient = await app.prisma.patient.update({
      where: { id: request.params.id },
      data: parsed.data,
    })

    return reply.send({ data: patient, message: 'Paciente atualizado com sucesso' })
  })

  // ════════════════════════════════════════════
  // CONSULTAS (APPOINTMENTS)
  // ════════════════════════════════════════════

  // ── GET /appointments — Listar consultas ──
  app.get('/appointments', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = listAppointmentsQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, status, patientId, specialty, dateFrom, dateTo } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId: user.tenantId }
    if (status) where.status = status
    if (patientId) where.patientId = patientId
    if (specialty) where.specialty = specialty
    if (dateFrom || dateTo) {
      where.scheduledAt = {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      }
    }

    const [appointments, total] = await Promise.all([
      app.prisma.appointment.findMany({
        where,
        include: { patient: { select: { id: true, name: true, phone: true } } },
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
      }),
      app.prisma.appointment.count({ where }),
    ])

    return reply.send({
      data: appointments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })

  // ── POST /appointments — Criar consulta ──
  app.post('/appointments', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = createAppointmentSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    if (!user.tenantId) {
      return reply.code(400).send({ error: 'Tenant não definido' })
    }

    // Verificar que o paciente pertence ao mesmo tenant
    const patient = await app.prisma.patient.findFirst({
      where: { id: parsed.data.patientId, tenantId: user.tenantId },
    })
    if (!patient) {
      return reply.code(404).send({ error: 'Paciente não encontrado neste tenant' })
    }

    const { price, ...rest } = parsed.data

    const appointment = await app.prisma.appointment.create({
      data: {
        ...rest,
        tenantId: user.tenantId,
        price: price !== undefined ? new Decimal(String(price)) : undefined,
      },
      include: { patient: { select: { id: true, name: true } } },
    })

    return reply.code(201).send({ data: appointment, message: 'Consulta criada com sucesso' })
  })

  // ── PATCH /appointments/:id/status — Atualizar estado da consulta ──
  app.patch<{ Params: { id: string } }>('/appointments/:id/status', async (request, reply) => {
    const user = request.user as { id: string; tenantId?: string; role: string }
    const parsed = updateAppointmentStatusSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Estado inválido', details: parsed.error.flatten() })
    }

    const existing = await app.prisma.appointment.findFirst({
      where: { id: request.params.id, tenantId: user.tenantId },
    })
    if (!existing) {
      return reply.code(404).send({ error: 'Consulta não encontrada' })
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }
    if (parsed.data.diagnosis) updateData.diagnosis = parsed.data.diagnosis
    if (parsed.data.prescription) updateData.prescription = parsed.data.prescription
    if (parsed.data.notes) updateData.notes = parsed.data.notes

    const appointment = await app.prisma.appointment.update({
      where: { id: request.params.id },
      data: updateData,
      include: { patient: { select: { id: true, name: true } } },
    })

    return reply.send({ data: appointment, message: 'Estado da consulta atualizado' })
  })
}

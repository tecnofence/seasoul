import type { FastifyInstance } from 'fastify'
import { Decimal } from '@prisma/client/runtime/library'
import { processPayrollSchema, batchPayrollSchema, listPayrollQuery } from './schemas.js'

const NORMAL_DAILY_HOURS = 8
const WORKING_DAYS_MONTH = 22
const OVERTIME_MULTIPLIER = 1.5

export default async function payrollRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // ── GET / — Listar folhas de salário ──
  app.get('/', async (request, reply) => {
    const parsed = listPayrollQuery.safeParse(request.query)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Parâmetros inválidos', details: parsed.error.flatten() })
    }

    const { page, limit, resortId, month, year, processed } = parsed.data
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (month) where.month = month
    if (year) where.year = year
    if (processed !== undefined) where.processed = processed
    if (resortId) {
      where.employee = { resortId }
    }

    const [data, total] = await Promise.all([
      app.prisma.payroll.findMany({
        where,
        include: {
          employee: {
            select: { id: true, name: true, nif: true, department: true, resortId: true },
          },
        },
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      app.prisma.payroll.count({ where }),
    ])

    return reply.send({ data, total, page, limit, totalPages: Math.ceil(total / limit) })
  })

  // ── POST /process — Calcular salário de um colaborador ──
  app.post('/process', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'HR_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = processPayrollSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { employeeId, month, year } = parsed.data
    const payroll = await calculatePayroll(app, employeeId, month, year)

    return reply.code(201).send({ data: payroll, message: 'Salário calculado' })
  })

  // ── POST /batch — Processar salários de todos os colaboradores de um resort ──
  app.post('/batch', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER', 'HR_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão' })
    }

    const parsed = batchPayrollSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Dados inválidos', details: parsed.error.flatten() })
    }

    const { resortId, month, year } = parsed.data

    const employees = await app.prisma.employee.findMany({
      where: { resortId, active: true },
      select: { id: true },
    })

    const results = []
    const errors = []

    for (const emp of employees) {
      try {
        const payroll = await calculatePayroll(app, emp.id, month, year)
        results.push(payroll)
      } catch (err: any) {
        errors.push({ employeeId: emp.id, error: err.message })
      }
    }

    return reply.send({
      data: { processed: results.length, errors: errors.length, results, errors },
      message: `${results.length} salários processados, ${errors.length} erros`,
    })
  })

  // ── PATCH /:id/approve — Aprovar folha de salário ──
  app.patch<{ Params: { id: string } }>('/:id/approve', async (request, reply) => {
    if (!['SUPER_ADMIN', 'RESORT_MANAGER'].includes(request.user.role)) {
      return reply.code(403).send({ error: 'Sem permissão para aprovar salários' })
    }

    const payroll = await app.prisma.payroll.findUnique({ where: { id: request.params.id } })
    if (!payroll) {
      return reply.code(404).send({ error: 'Folha de salário não encontrada' })
    }

    if (payroll.processed) {
      return reply.code(400).send({ error: 'Salário já processado' })
    }

    const updated = await app.prisma.payroll.update({
      where: { id: request.params.id },
      data: { processed: true, processedAt: new Date() },
      include: {
        employee: { select: { id: true, name: true, department: true } },
      },
    })

    return reply.send({ data: updated, message: 'Salário aprovado e processado' })
  })
}

// ── Helper: calcular salário de um colaborador ──
async function calculatePayroll(
  app: FastifyInstance,
  employeeId: string,
  month: number,
  year: number,
) {
  const employee = await app.prisma.employee.findUnique({ where: { id: employeeId } })
  if (!employee) throw new Error('Colaborador não encontrado')

  // Verificar se já existe
  const existing = await app.prisma.payroll.findUnique({
    where: { employeeId_month_year: { employeeId, month, year } },
  })
  if (existing) throw new Error(`Salário de ${month}/${year} já calculado para este colaborador`)

  // Buscar registos de assiduidade do mês
  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0, 23, 59, 59, 999)

  const records = await app.prisma.attendanceRecord.findMany({
    where: { employeeId, createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: 'asc' },
  })

  // Calcular horas trabalhadas
  let totalHours = 0
  const daysPresent = new Set<string>()

  for (let i = 0; i < records.length; i++) {
    const rec = records[i]
    daysPresent.add(rec.createdAt.toISOString().split('T')[0])

    if (rec.type === 'ENTRY') {
      const exit = records.slice(i + 1).find((r) => r.type === 'EXIT')
      if (exit) {
        const ms = exit.createdAt.getTime() - rec.createdAt.getTime()
        totalHours += ms / (1000 * 60 * 60)
      }
    }
  }

  const expectedHours = WORKING_DAYS_MONTH * NORMAL_DAILY_HOURS
  const overtimeHours = Math.max(0, totalHours - expectedHours)
  const absenceDays = Math.max(0, WORKING_DAYS_MONTH - daysPresent.size)

  const baseSalaryNum = employee.baseSalary.toNumber()
  const dailyRate = baseSalaryNum / WORKING_DAYS_MONTH
  const hourlyRate = dailyRate / NORMAL_DAILY_HOURS

  const overtimePay = overtimeHours * hourlyRate * OVERTIME_MULTIPLIER
  const absenceDeduct = absenceDays * dailyRate
  const netSalary = baseSalaryNum + overtimePay - absenceDeduct

  const payroll = await app.prisma.payroll.create({
    data: {
      employeeId,
      month,
      year,
      baseSalary: employee.baseSalary,
      hoursWorked: new Decimal(Math.round(totalHours * 100) / 100),
      overtimeHours: new Decimal(Math.round(overtimeHours * 100) / 100),
      overtimePay: new Decimal(Math.round(overtimePay * 100) / 100),
      absenceDays,
      absenceDeduct: new Decimal(Math.round(absenceDeduct * 100) / 100),
      netSalary: new Decimal(Math.round(Math.max(0, netSalary) * 100) / 100),
    },
    include: {
      employee: { select: { id: true, name: true, nif: true, department: true } },
    },
  })

  return payroll
}

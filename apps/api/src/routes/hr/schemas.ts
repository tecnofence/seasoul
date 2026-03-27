import { z } from 'zod'

export const createEmployeeSchema = z.object({
  resortId: z.string().cuid(),
  name: z.string().min(2, 'Nome obrigatório'),
  nif: z.string().regex(/^\d{9}$/, 'NIF deve ter 9 dígitos'),
  role: z.string().min(1, 'Cargo obrigatório'),
  department: z.string().min(1, 'Departamento obrigatório'),
  baseSalary: z.number().positive('Salário deve ser positivo'),
  startDate: z.string().datetime({ message: 'Data inválida (ISO 8601)' }),
})

export const updateEmployeeSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  baseSalary: z.number().positive().optional(),
  active: z.boolean().optional(),
})

export const createShiftSchema = z.object({
  employeeId: z.string().cuid(),
  date: z.string().datetime(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  department: z.string().min(1),
})

export const listEmployeesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  resortId: z.string().optional(),
  department: z.string().optional(),
  active: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
export type CreateShiftInput = z.infer<typeof createShiftSchema>
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuery>

import { z } from 'zod'

export const processPayrollSchema = z.object({
  employeeId: z.string().cuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
})

export const batchPayrollSchema = z.object({
  resortId: z.string().cuid(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
})

export const listPayrollQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  resortId: z.string().optional(),
  month: z.coerce.number().int().optional(),
  year: z.coerce.number().int().optional(),
  processed: z.coerce.boolean().optional(),
})

export type ProcessPayrollInput = z.infer<typeof processPayrollSchema>
export type BatchPayrollInput = z.infer<typeof batchPayrollSchema>
export type ListPayrollQuery = z.infer<typeof listPayrollQuery>

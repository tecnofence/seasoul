import { z } from 'zod'

export const recordAttendanceSchema = z.object({
  employeeId: z.string().cuid(),
  type: z.enum(['ENTRY', 'EXIT', 'BREAK_START', 'BREAK_END']),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export const listAttendanceQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  employeeId: z.string().optional(),
  resortId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  validGps: z.coerce.boolean().optional(),
})

export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuery>

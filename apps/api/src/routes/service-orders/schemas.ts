import { z } from 'zod'

const serviceItemSchema = z.object({
  name: z.string().min(1),
  qty: z.number().int().positive(),
  price: z.number().min(0).optional(),
  notes: z.string().optional(),
})

export const createServiceOrderSchema = z.object({
  resortId: z.string().cuid(),
  reservationId: z.string().cuid(),
  type: z.enum(['ROOM_SERVICE', 'HOUSEKEEPING', 'SPA', 'RESTAURANT', 'ACTIVITY', 'TRANSPORT', 'OTHER']),
  items: z.array(serviceItemSchema).min(1),
  notes: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
})

export const updateServiceOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  assignedTo: z.string().cuid().optional(),
})

export const listServiceOrdersQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  resortId: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  reservationId: z.string().optional(),
})

export type CreateServiceOrderInput = z.infer<typeof createServiceOrderSchema>
export type UpdateServiceOrderStatusInput = z.infer<typeof updateServiceOrderStatusSchema>
export type ListServiceOrdersQuery = z.infer<typeof listServiceOrdersQuery>

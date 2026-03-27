import { z } from 'zod'

export const createNotificationSchema = z.object({
  userId: z.string().cuid().optional(),
  guestId: z.string().cuid().optional(),
  resortId: z.string().cuid().optional(),
  type: z.enum([
    'RESERVATION_CONFIRMED',
    'RESERVATION_REMINDER',
    'CHECKIN_READY',
    'PIN_GENERATED',
    'CHECKOUT_REMINDER',
    'INVOICE_READY',
    'STOCK_ALERT',
    'ATTENDANCE_MISSING',
    'PAYROLL_PROCESSED',
    'MAINTENANCE_ASSIGNED',
  ]),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.record(z.unknown()).optional(),
  channel: z.enum(['PUSH', 'SMS', 'EMAIL', 'IN_APP']),
})

export const listNotificationsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  userId: z.string().optional(),
  guestId: z.string().optional(),
  status: z.string().optional(),
  channel: z.string().optional(),
})

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>

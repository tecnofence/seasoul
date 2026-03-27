import { z } from 'zod'

export const createReservationSchema = z.object({
  resortId: z.string().cuid(),
  roomId: z.string().cuid(),
  guestId: z.string().cuid().optional(),
  guestName: z.string().min(2, 'Nome do hóspede obrigatório'),
  guestEmail: z.string().email('Email inválido'),
  guestPhone: z.string().min(9, 'Telefone inválido'),
  checkIn: z.string().datetime({ message: 'Data check-in inválida (ISO 8601)' }),
  checkOut: z.string().datetime({ message: 'Data check-out inválida (ISO 8601)' }),
  adults: z.number().int().positive(),
  children: z.number().int().min(0).default(0),
  bookingSource: z.enum(['DIRECT', 'WEBSITE', 'PHONE', 'BOOKING_COM', 'EXPEDIA', 'AIRBNB', 'OTHER']).default('DIRECT'),
  totalAmount: z.number().positive('Valor total deve ser positivo'),
  depositPaid: z.number().min(0).default(0),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
})

export const updateReservationSchema = z.object({
  roomId: z.string().cuid().optional(),
  guestName: z.string().min(2).optional(),
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().min(9).optional(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  adults: z.number().int().positive().optional(),
  children: z.number().int().min(0).optional(),
  bookingSource: z.enum(['DIRECT', 'WEBSITE', 'PHONE', 'BOOKING_COM', 'EXPEDIA', 'AIRBNB', 'OTHER']).optional(),
  totalAmount: z.number().positive().optional(),
  depositPaid: z.number().min(0).optional(),
  paymentStatus: z.enum(['PENDING', 'PARTIAL', 'PAID', 'REFUNDED']).optional(),
  notes: z.string().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
})

export const listReservationsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  resortId: z.string().optional(),
  status: z.string().optional(),
  roomId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().optional(),
})

export type CreateReservationInput = z.infer<typeof createReservationSchema>
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>
export type ListReservationsQuery = z.infer<typeof listReservationsQuery>

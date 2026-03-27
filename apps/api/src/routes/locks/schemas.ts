import { z } from 'zod'

export const generatePinSchema = z.object({
  reservationId: z.string().cuid(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
})

export const listLocksQuery = z.object({
  resortId: z.string().optional(),
  status: z.string().optional(),
})

export type GeneratePinInput = z.infer<typeof generatePinSchema>
export type ListLocksQuery = z.infer<typeof listLocksQuery>

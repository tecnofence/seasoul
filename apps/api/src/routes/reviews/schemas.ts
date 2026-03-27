import { z } from 'zod'

export const createReviewSchema = z.object({
  reservationId: z.string().cuid(),
  overallRating: z.number().int().min(1).max(5),
  cleanliness: z.number().int().min(1).max(5).optional(),
  service: z.number().int().min(1).max(5).optional(),
  location: z.number().int().min(1).max(5).optional(),
  valueForMoney: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(2000).optional(),
  language: z.enum(['pt', 'en', 'fr', 'es']).default('pt'),
})

export const replyReviewSchema = z.object({
  reply: z.string().min(1).max(2000),
})

export const listReviewsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  resortId: z.string().optional(),
  published: z.coerce.boolean().optional(),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type ReplyReviewInput = z.infer<typeof replyReviewSchema>
export type ListReviewsQuery = z.infer<typeof listReviewsQuery>

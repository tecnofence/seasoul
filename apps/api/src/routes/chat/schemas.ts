import { z } from 'zod'

export const sendMessageSchema = z.object({
  reservationId: z.string().cuid(),
  content: z.string().min(1, 'Mensagem não pode estar vazia').max(2000),
})

export const listMessagesQuery = z.object({
  reservationId: z.string(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type ListMessagesQuery = z.infer<typeof listMessagesQuery>

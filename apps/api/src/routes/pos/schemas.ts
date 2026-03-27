import { z } from 'zod'

const saleItemSchema = z.object({
  productId: z.string().cuid(),
  qty: z.number().int().positive('Quantidade deve ser positiva'),
  unitPrice: z.number().positive('Preço unitário deve ser positivo'),
  taxRate: z.number().min(0).default(14),
})

export const createSaleSchema = z.object({
  resortId: z.string().cuid(),
  reservationId: z.string().cuid().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'ROOM_CHARGE', 'TRANSFER']),
  items: z.array(saleItemSchema).min(1, 'Pelo menos um item obrigatório'),
})

export const listSalesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  resortId: z.string().optional(),
  status: z.string().optional(),
  paymentMethod: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type CreateSaleInput = z.infer<typeof createSaleSchema>
export type ListSalesQuery = z.infer<typeof listSalesQuery>

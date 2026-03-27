import { z } from 'zod'

export const emitInvoiceSchema = z.object({
  saleId: z.string().cuid(),
})

export const listInvoicesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  resortId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
})

export type EmitInvoiceInput = z.infer<typeof emitInvoiceSchema>
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuery>

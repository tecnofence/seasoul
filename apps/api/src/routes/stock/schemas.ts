import { z } from 'zod'

export const createStockItemSchema = z.object({
  resortId: z.string().cuid(),
  name: z.string().min(2, 'Nome obrigatório'),
  department: z.string().min(1, 'Departamento obrigatório'),
  unit: z.string().min(1, 'Unidade obrigatória'),
  currentQty: z.number().min(0).default(0),
  minQty: z.number().min(0, 'Quantidade mínima deve ser >= 0'),
})

export const updateStockItemSchema = z.object({
  name: z.string().min(2).optional(),
  department: z.string().optional(),
  unit: z.string().optional(),
  minQty: z.number().min(0).optional(),
})

export const stockMovementSchema = z.object({
  stockItemId: z.string().cuid(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  qty: z.number().positive('Quantidade deve ser positiva'),
  reason: z.string().min(1, 'Razão obrigatória'),
  supplierId: z.string().cuid().optional(),
})

export const listStockQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  resortId: z.string().optional(),
  department: z.string().optional(),
  lowStock: z.coerce.boolean().optional(),
})

export type CreateStockItemInput = z.infer<typeof createStockItemSchema>
export type UpdateStockItemInput = z.infer<typeof updateStockItemSchema>
export type StockMovementInput = z.infer<typeof stockMovementSchema>
export type ListStockQuery = z.infer<typeof listStockQuery>

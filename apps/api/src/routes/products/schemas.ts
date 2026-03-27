import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(200),
  category: z.string().min(1, 'Categoria obrigatória'),
  department: z.string().min(1, 'Departamento obrigatório'),
  unitPrice: z.number().positive('Preço unitário deve ser positivo'),
  taxRate: z.number().min(0).max(100).default(14),
})

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  unitPrice: z.number().positive().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  active: z.boolean().optional(),
})

export const listProductsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  category: z.string().optional(),
  department: z.string().optional(),
  active: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

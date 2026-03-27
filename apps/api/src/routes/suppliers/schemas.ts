import { z } from 'zod'

export const createSupplierSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  nif: z.string().regex(/^\d{9}$/, 'NIF deve ter 9 dígitos').optional(),
  contact: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  address: z.string().optional(),
})

export const updateSupplierSchema = z.object({
  name: z.string().min(2).optional(),
  nif: z.string().regex(/^\d{9}$/).optional(),
  contact: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().nullable().optional(),
  active: z.boolean().optional(),
})

export const listSuppliersQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  active: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
export type ListSuppliersQuery = z.infer<typeof listSuppliersQuery>

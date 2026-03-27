import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  role: z.enum([
    'SUPER_ADMIN',
    'RESORT_MANAGER',
    'RECEPTIONIST',
    'POS_OPERATOR',
    'STOCK_MANAGER',
    'HR_MANAGER',
    'STAFF',
  ]),
  resortId: z.string().cuid().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum([
    'SUPER_ADMIN',
    'RESORT_MANAGER',
    'RECEPTIONIST',
    'POS_OPERATOR',
    'STOCK_MANAGER',
    'HR_MANAGER',
    'STAFF',
  ]).optional(),
  resortId: z.string().cuid().nullable().optional(),
  active: z.boolean().optional(),
})

export const listUsersQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.string().optional(),
  resortId: z.string().optional(),
  active: z.coerce.boolean().optional(),
  search: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ListUsersQuery = z.infer<typeof listUsersQuery>

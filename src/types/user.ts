import { z } from 'zod'
import { ObjectIdSchema } from './common'

export const UserRoleSchema = z.enum(['admin', 'author', 'user'])
export const UserStatusSchema = z.enum(['active', 'invited', 'disabled'])

export const UserSchema = z.object({
  _id: ObjectIdSchema,
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  role: UserRoleSchema,
  status: UserStatusSchema,
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const CreateUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
  role: UserRoleSchema.default('user'),
  status: UserStatusSchema.default('invited'),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
})

export const UpdateUserSchema = CreateUserSchema.partial()

export const UserFiltersSchema = z.object({
  role: UserRoleSchema.optional(),
  status: UserStatusSchema.optional(),
  search: z.string().optional(),
})

export type User = z.infer<typeof UserSchema>
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type UserFilters = z.infer<typeof UserFiltersSchema>

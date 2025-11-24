import { z } from 'zod'
import { ObjectIdSchema } from './common'

export const LikeTargetTypeSchema = z.enum(['article', 'comment'])

export const LikeSchema = z.object({
  _id: ObjectIdSchema,
  userId: ObjectIdSchema,
  targetId: ObjectIdSchema,
  targetType: LikeTargetTypeSchema,
  createdAt: z.number(),
})

export const CreateLikeSchema = z.object({
  userId: ObjectIdSchema,
  targetId: ObjectIdSchema,
  targetType: LikeTargetTypeSchema,
})

export const LikeFiltersSchema = z.object({
  userId: ObjectIdSchema.optional(),
  targetId: ObjectIdSchema.optional(),
  targetType: LikeTargetTypeSchema.optional(),
})

export type Like = z.infer<typeof LikeSchema>
export type CreateLikeInput = z.infer<typeof CreateLikeSchema>
export type LikeFilters = z.infer<typeof LikeFiltersSchema>

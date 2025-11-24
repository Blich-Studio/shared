import { z } from 'zod'
import { ObjectIdSchema } from './common'

export const CommentStatusSchema = z.enum(['pending', 'approved', 'rejected', 'spam'])

export const CommentSchema = z.object({
  _id: ObjectIdSchema,
  articleId: ObjectIdSchema,
  userId: ObjectIdSchema,
  content: z.string().min(1).max(1000),
  status: CommentStatusSchema,
  likesCount: z.number().min(0),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const CreateCommentSchema = z.object({
  articleId: ObjectIdSchema,
  userId: ObjectIdSchema,
  content: z.string().min(1).max(1000),
  status: CommentStatusSchema.default('pending'),
})

export const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(1000).optional(),
  status: CommentStatusSchema.optional(),
})

export const CommentFiltersSchema = z.object({
  articleId: ObjectIdSchema.optional(),
  userId: ObjectIdSchema.optional(),
  status: CommentStatusSchema.optional(),
})

export type Comment = z.infer<typeof CommentSchema>
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>
export type UpdateCommentInput = z.infer<typeof UpdateCommentSchema>
export type CommentFilters = z.infer<typeof CommentFiltersSchema>

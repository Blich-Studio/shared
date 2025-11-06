import { z } from 'zod'
import { ObjectIdSchema } from './common'
import { TagSchema } from './tag'

export const ArticleSchema = z.object({
  _id: ObjectIdSchema,
  title: z.string().min(1).max(50),
  slug: z.string().min(1).max(30),
  perex: z.string().min(1).max(200),
  content: z.string().min(1),
  authorId: ObjectIdSchema,
  status: z.enum(['draft', 'published', 'archived']),
  tags: z.array(TagSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Article = z.infer<typeof ArticleSchema>

// Validation schemas for API operations
export const CreateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  authorId: ObjectIdSchema,
  slug: z.string().min(1, 'Slug is required').max(30, 'Slug must be less than 30 characters'),
  perex: z.string().min(1, 'Perex is required').max(200, 'Perex must be less than 200 characters'),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  tags: z.array(TagSchema).default([]),
})

export const UpdateArticleSchema = CreateArticleSchema.partial()

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>

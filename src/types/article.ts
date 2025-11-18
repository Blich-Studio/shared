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
  createdAt: z.number(),
  updatedAt: z.number(),
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

// Query parameter validation schemas
export const ArticlePaginationSchema = z.object({
  page: z
    .string()
    .optional()
    .refine(val => !val || /^\d+$/.test(val), {
      message: 'Invalid page number',
    })
    .transform(val => (val ? parseInt(val, 10) : undefined)),
  limit: z
    .string()
    .optional()
    .refine(val => !val || /^\d+$/.test(val), {
      message: 'Invalid limit number',
    })
    .transform(val => (val ? parseInt(val, 10) : undefined)),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const ArticleFiltersSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  authorId: z.string().optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform(val => {
      if (!val) return undefined
      if (Array.isArray(val)) return val
      return val
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    }),
  search: z.string().optional(),
})

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>
export type ArticlePaginationQuery = z.infer<typeof ArticlePaginationSchema>
export type ArticleFiltersQuery = z.infer<typeof ArticleFiltersSchema>

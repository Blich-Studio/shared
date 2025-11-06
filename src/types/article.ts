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

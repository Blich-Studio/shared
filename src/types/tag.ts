import { z } from 'zod'
import { ObjectIdSchema } from './common'

export const TagSchema = z.object({
  _id: ObjectIdSchema,
  name: z.string().min(1).max(30),
  createdAt: z.date(),
  updatedAt: z.date(),
})

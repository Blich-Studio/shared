import { z } from 'zod'
import { ObjectIdSchema } from './common'

export const TagSchema = z.object({
  _id: ObjectIdSchema,
  name: z.string().min(1).max(30),
  description: z.string().max(200).optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
})

export const CreateTagSchema = z.object({
  name: z.string().min(1).max(30),
  description: z.string().max(200).optional(),
})

export const UpdateTagSchema = CreateTagSchema.partial()

export type Tag = z.infer<typeof TagSchema>
export type CreateTagInput = z.infer<typeof CreateTagSchema>
export type UpdateTagInput = z.infer<typeof UpdateTagSchema>

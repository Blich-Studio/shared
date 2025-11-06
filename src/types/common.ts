import { z } from 'zod'

export const ObjectIdSchema = z.string().refine(val => /^[a-f\d]{24}$/i.test(val), {
  message: 'Invalid MongoDB ObjectId',
})

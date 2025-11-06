import { z } from 'zod'

export const ObjectIdSchema = z.string().refine(val => /^[a-f\d]{24}$/i.test(val), {
  message: 'Invalid MongoDB ObjectId',
})

// Common error types
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}

// HTTP Status Code Only Response Types (RECOMMENDED)
// Success responses just return data
export interface ApiSuccessResponse<T> {
  data: T
  message?: string
}

// Error responses use appropriate HTTP status codes
export interface ApiErrorResponse {
  error: string
  code?: string
  message?: string
  details?: Record<string, unknown>
}

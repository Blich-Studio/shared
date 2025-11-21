import { z } from 'zod'

export const ObjectIdSchema = z.string().refine(val => /^[a-f\d]{24}$/i.test(val), {
  message: 'Invalid MongoDB ObjectId',
})

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

// Pagination types
export interface PaginationQuery {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

// Filtering types
export interface ArticleFilters {
  status?: 'draft' | 'published' | 'archived'
  authorId?: string
  tags?: string[]
  search?: string
}

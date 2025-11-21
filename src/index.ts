export interface Game {
  id: number
  title: string
  slug: string
  description: string
  coverImage?: string
  screenshots?: string[]
  trailerUrl?: string
  status: 'in-development' | 'released' | 'early-access'
  platforms?: string[]
  releaseDate?: string
  links?: {
    steam?: string
    itch?: string
    website?: string
    discord?: string
  }
  published: boolean
  createdAt: number
  updatedAt: number
}

export interface BlogPost {
  id: number
  title: string
  slug: string
  content: string
  excerpt?: string
  featuredImage?: string
  tags?: string[]
  status: 'draft' | 'published'
  publishedAt?: string
  createdAt: number
  updatedAt: number
}

// Export utilities and types
export * from './errors/HttpError'
export * from './types/article'
export * from './types/common'
export * from './utils/date'
export * from './utils/logger'
export * from './utils/logger-examples'
export * from './utils/mongodb'

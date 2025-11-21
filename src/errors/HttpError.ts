/**
 * Custom HTTP Error class for type-safe error handling
 * Extends Error to include HTTP status codes
 *
 * @example
 * throw new HttpError('Not Found', 404)
 * throw new HttpError('Bad Request', 400)
 */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'HttpError'
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}

/**
 * Validation Error class for validation-specific errors
 * Extends HttpError with a 400 status code
 *
 * @example
 * throw new ValidationError('Invalid email format')
 */
export class ValidationError extends HttpError {
  constructor(message: string) {
    super(message, 400)
    this.name = 'ValidationError'
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Not Found Error class for 404 errors
 * Extends HttpError with a 404 status code
 *
 * @example
 * throw new NotFoundError('Article not found')
 */
export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(message, 404)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/**
 * Unauthorized Error class for 401 errors
 * Extends HttpError with a 401 status code
 *
 * @example
 * throw new UnauthorizedError('Invalid credentials')
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string) {
    super(message, 401)
    this.name = 'UnauthorizedError'
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

/**
 * Forbidden Error class for 403 errors
 * Extends HttpError with a 403 status code
 *
 * @example
 * throw new ForbiddenError('Access denied')
 */
export class ForbiddenError extends HttpError {
  constructor(message: string) {
    super(message, 403)
    this.name = 'ForbiddenError'
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

/**
 * Internal Server Error class for 500 errors
 * Extends HttpError with a 500 status code
 *
 * @example
 * throw new InternalServerError('Database connection failed')
 */
export class InternalServerError extends HttpError {
  constructor(message: string) {
    super(message, 500)
    this.name = 'InternalServerError'
    Object.setPrototypeOf(this, InternalServerError.prototype)
  }
}

/**
 * Database Error class for database-related errors
 * Extends InternalServerError for proper HTTP semantics
 *
 * @example
 * throw new DatabaseError('Connection failed')
 */
export class DatabaseError extends InternalServerError {
  constructor(message: string) {
    super(message)
    this.name = 'DatabaseError'
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}

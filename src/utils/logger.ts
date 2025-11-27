import { randomUUID } from 'crypto'
import pino from 'pino'

/**
 * ECS (Elastic Common Schema) Log Levels
 * Defines the severity levels for logging
 */
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * ECS Base Log Entry Interface
 * Defines the structure of a log entry following Elastic Common Schema
 */
export interface ECSLogEntry {
  // ECS Core Fields
  '@timestamp': string
  log: {
    level: LogLevel
    logger?: string
  }
  message: string

  // ECS Event Fields
  event?: {
    action?: string
    category?: string
    type?: string
    kind?: string
    outcome?: 'success' | 'failure' | 'unknown'
    duration?: number
  }

  // ECS HTTP Fields (for request/response logging)
  http?: {
    request?: {
      method?: string
      url?: string
      headers?: Record<string, string>
      body?: unknown
    }
    response?: {
      status_code?: number
      headers?: Record<string, string>
      body?: unknown
    }
  }

  // ECS URL Fields
  url?: {
    original?: string
    path?: string
    query?: string
  }

  // ECS User Fields
  user?: {
    id?: string
    name?: string
    email?: string
  }

  // ECS Error Fields
  error?: {
    type?: string
    message?: string
    stack_trace?: string
    code?: string
  }

  // ECS Service Fields
  service?: {
    name: string
    version?: string
    environment?: string
  }

  // ECS Host Fields
  host?: {
    hostname?: string
    ip?: string
  }

  // ECS Process Fields
  process?: {
    pid?: number
    thread?: {
      id?: number
    }
  }

  // Custom fields for application-specific data
  labels?: Record<string, unknown>
  meta?: Record<string, unknown>
}

/**
 * Logger Configuration
 * Configuration options for creating a new logger instance
 */
export interface LoggerConfig {
  serviceName: string
  serviceVersion?: string
  environment?: string
  level?: LogLevel
  enableConsole?: boolean
  enableJSON?: boolean
  includeStackTrace?: boolean
}

const inferredEnvironment = process.env.NODE_ENV ?? 'development'

// Default configuration
const defaultConfig: Required<LoggerConfig> = {
  serviceName: 'unknown-service',
  serviceVersion: '1.0.0',
  environment: inferredEnvironment,
  level: LogLevel.INFO,
  enableConsole: true,
  enableJSON: inferredEnvironment !== 'development',
  includeStackTrace: true,
}

const sanitizeConfig = (config: LoggerConfig): Partial<LoggerConfig> => {
  return Object.fromEntries(
    Object.entries(config).filter(([, value]) => value !== undefined)
  ) as Partial<LoggerConfig>
}

interface ErrorWithCode extends Error {
  code?: string
}

/**
 * ECS-compliant Logger class using Pino
 */
export class ECSLogger {
  private logger: pino.Logger
  private config: Required<LoggerConfig>

  constructor(config: LoggerConfig) {
    this.config = { ...defaultConfig, ...sanitizeConfig(config) }

    this.logger = pino({
      level: this.config.level,
      base: {
        service: {
          name: this.config.serviceName,
          version: this.config.serviceVersion,
          environment: this.config.environment,
        },
        host: {
          hostname: typeof process !== 'undefined' ? process.env.HOSTNAME : undefined,
        },
        process: {
          pid: typeof process !== 'undefined' ? process.pid : undefined,
        },
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: label => {
          return { log: { level: label as LogLevel } }
        },
        bindings: (bindings: pino.Bindings) => {
          const processInfo =
            typeof bindings.pid === 'number' ? { process: { pid: bindings.pid } } : {}

          const hostInfo =
            typeof bindings.hostname === 'string' ? { host: { hostname: bindings.hostname } } : {}

          return {
            ...processInfo,
            ...hostInfo,
          }
        },
      },
      // Pretty transport stays dev-only to avoid main-thread overhead in production
      transport:
        this.config.environment === 'development' && !this.config.enableJSON
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname,service,log',
              },
            }
          : undefined,
    })
  }

  /**
   * Create a child logger with additional context
   * @param context - Additional context to include in all child logger entries
   * @returns A new ECSLogger instance with inherited context
   */
  child(context: Partial<ECSLogEntry>): ECSLogger {
    const childLogger = new ECSLogger(this.config)
    childLogger.logger = this.logger.child(context)
    return childLogger
  }

  /**
   * Set request context for HTTP logging
   * @param req - HTTP request object containing method, URL, headers, etc.
   * @returns A new ECSLogger instance with request context
   */
  setRequestContext(req: {
    method: string
    url: string
    headers: Record<string, unknown>
    originalUrl?: string
    path: string
    query?: Record<string, string | string[]>
    user?: { id: string; name: string; email: string }
    id?: string
    get: (header: string) => string | undefined
    ip?: string
    connection?: { remoteAddress?: string }
  }): ECSLogger {
    const requestContext: Partial<ECSLogEntry> = {
      http: {
        request: {
          method: req.method,
          url: req.url,
          headers: this.sanitizeHeaders(req.headers),
        },
      },
      url: {
        original: req.originalUrl ?? req.url,
        path: req.path,
        query: this.serializeQueryParams(req.query),
      },
      user: req.user
        ? {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
          }
        : undefined,
      labels: {
        requestId: req.id ?? randomUUID(),
        userAgent: req.get('User-Agent'),
        ip: req.ip ?? req.connection?.remoteAddress,
      },
    }

    return this.child(requestContext)
  }

  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, string> {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token']
    const sanitized: Record<string, string> = {}

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = Array.isArray(value) ? value.join(', ') : String(value)
      }
    }

    return sanitized
  }

  private serializeQueryParams(query?: Record<string, string | string[]>): string | undefined {
    if (!query) {
      return undefined
    }

    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const item of value) {
          params.append(key, item)
        }
      } else if (typeof value === 'string') {
        params.append(key, value)
      }
    }

    const serialized = params.toString()
    return serialized.length > 0 ? serialized : undefined
  }

  private normalizeError(error: unknown): ErrorWithCode {
    if (error instanceof Error) {
      return error as ErrorWithCode
    }

    return new Error(String(error))
  }

  /**
   * Log a trace level message
   * @param message - The log message
   * @param data - Additional ECS fields to include
   */
  trace(message: string, data?: Partial<ECSLogEntry>): void {
    this.logger.trace(data ?? {}, message)
  }

  /**
   * Log a debug level message
   * @param message - The log message
   * @param data - Additional ECS fields to include
   */
  debug(message: string, data?: Partial<ECSLogEntry>): void {
    this.logger.debug(data ?? {}, message)
  }

  /**
   * Log an info level message
   * @param message - The log message
   * @param data - Additional ECS fields to include
   */
  info(message: string, data?: Partial<ECSLogEntry>): void {
    this.logger.info(data ?? {}, message)
  }

  /**
   * Log a warning level message
   * @param message - The log message
   * @param data - Additional ECS fields to include
   */
  warn(message: string, data?: Partial<ECSLogEntry>): void {
    this.logger.warn(data ?? {}, message)
  }

  /**
   * Log an error level message
   * @param message - The log message
   * @param error - Optional error object to log
   * @param data - Additional ECS fields to include
   */
  error(message: string, error?: unknown, data?: Partial<ECSLogEntry>): void {
    const errorData: Partial<ECSLogEntry> = {
      ...data,
      event: {
        ...data?.event,
        outcome: 'failure',
      },
    }

    if (error) {
      const normalizedError = this.normalizeError(error)

      errorData.error = {
        type: normalizedError.name,
        message: normalizedError.message,
        code: normalizedError.code,
        stack_trace: this.config.includeStackTrace ? normalizedError.stack : undefined,
      }
    }

    this.logger.error(errorData, message)
  }

  /**
   * Log a fatal level message
   * @param message - The log message
   * @param error - Optional error object to log
   * @param data - Additional ECS fields to include
   */
  fatal(message: string, error?: unknown, data?: Partial<ECSLogEntry>): void {
    const errorData: Partial<ECSLogEntry> = {
      ...data,
      event: {
        ...data?.event,
        outcome: 'failure',
      },
    }

    if (error) {
      const normalizedError = this.normalizeError(error)

      errorData.error = {
        type: normalizedError.name,
        message: normalizedError.message,
        code: normalizedError.code,
        stack_trace: this.config.includeStackTrace ? normalizedError.stack : undefined,
      }
    }

    this.logger.fatal(errorData, message)
  }

  /**
   * Log HTTP request and response
   * Middleware function to automatically log incoming requests and their responses
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logRequest(req: any, res: any, next: any): void {
    const startTime = Date.now()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const logger = this.setRequestContext(req)

    logger.info('Request received', {
      event: {
        action: 'request',
        category: 'web',
        type: 'access',
      },
    })

    // Log response when finished
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    res.on('finish', () => {
      const duration = Date.now() - startTime
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const level = res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO

      // Use the appropriate log method based on level
      const logMethod =
        level === LogLevel.WARN ? logger.warn.bind(logger) : logger.info.bind(logger)

      logMethod('Request completed', {
        event: {
          action: 'response',
          category: 'web',
          type: 'access',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          outcome: res.statusCode >= 400 ? 'failure' : 'success',
          duration,
        },
        http: {
          response: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            status_code: res.statusCode,
          },
        },
      })
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    next()
  }

  /**
   * Create a timer for performance logging
   * @param label - Label for the timer
   * @returns A function to end the timer and log the duration
   */
  time(label: string): () => void {
    const startTime = Date.now()
    this.debug(`Timer started: ${label}`)

    return () => {
      const duration = Date.now() - startTime
      this.info(`Timer ended: ${label}`, {
        event: {
          action: 'timer',
          category: 'performance',
          duration,
        },
        labels: { timerLabel: label },
      })
    }
  }
}

/**
 * Factory function to create logger instances
 * @param config - Logger configuration options
 * @returns A new ECSLogger instance
 */
export function createLogger(config: LoggerConfig): ECSLogger {
  return new ECSLogger(config)
}

/**
 * Default logger instance (can be configured per service)
 */
export const logger = createLogger({
  serviceName: 'blich-studio',
  environment: process.env.NODE_ENV,
  level: process.env.LOG_LEVEL as LogLevel,
})

/**
 * Concise logging helpers for common patterns
 * Provides shorthand methods for frequently used logging scenarios
 */
export const log = {
  /**
   * Log an error with minimal context
   * @param message - Error message
   * @param error - Error object
   * @param context - Additional context
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (message: string, error?: any, context?: Record<string, any>) => {
    logger.error(message, error, context)
  },

  /**
   * Log a validation error
   * @param message - Validation error message
   * @param id - Optional identifier
   */
  validation: (message: string, id?: string) => {
    logger.error(message, undefined, {
      event: { action: 'validation', category: 'validation', outcome: 'failure' },
      labels: id ? { id } : undefined,
    })
  },

  /**
   * Log a database operation error
   * @param operation - Database operation name
   * @param error - Error object
   * @param id - Optional record identifier
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: (operation: string, error: any, id?: string) => {
    logger.error(`DB ${operation} failed`, error, {
      event: { action: operation, category: 'database', outcome: 'failure' },
      labels: id ? { id } : undefined,
    })
  },

  /**
   * Log a resource not found error
   * @param resource - Resource type that was not found
   * @param id - Optional resource identifier
   */
  notFound: (resource: string, id?: string) => {
    logger.error(`${resource} not found`, undefined, {
      event: { action: 'find', category: 'not_found', outcome: 'failure' },
      labels: id ? { id } : undefined,
    })
  },

  /**
   * Log a successful operation
   * @param operation - Operation name
   * @param id - Optional resource identifier
   * @param extra - Additional fields to include
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  success: (operation: string, id?: string, extra?: Record<string, any>) => {
    logger.info(`${operation} successful`, {
      event: { action: operation, category: 'operation', outcome: 'success' },
      labels: id ? { id } : undefined,
      ...extra,
    })
  },
}

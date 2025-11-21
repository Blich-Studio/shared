import { randomUUID } from 'crypto'
import pino from 'pino'

// ECS (Elastic Common Schema) Log Levels
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// ECS Base Log Entry Interface
export interface ECSLogEntry {
  // ECS Core Fields
  '@timestamp'?: string
  log?: {
    level: LogLevel
    logger?: string
  }
  message?: string

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

// Logger Configuration
export interface LoggerConfig {
  serviceName: string
  serviceVersion?: string
  environment?: string
  level?: LogLevel
  enableConsole?: boolean
  enableJSON?: boolean
  includeStackTrace?: boolean
}

// Default configuration
const defaultConfig: Required<LoggerConfig> = {
  serviceName: 'unknown-service',
  serviceVersion: '1.0.0',
  environment: 'development',
  level: LogLevel.INFO,
  enableConsole: true,
  enableJSON: true,
  includeStackTrace: true,
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
    this.config = { ...defaultConfig, ...config }

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
        bindings: (bindings: Record<string, unknown>) => {
          return {
            process: { pid: bindings.pid as number },
            host: { hostname: bindings.hostname as string },
          }
        },
      },
      transport: !this.config.enableJSON
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
   */
  child(context: Partial<ECSLogEntry>): ECSLogger {
    const childLogger = new ECSLogger(this.config)
    childLogger.logger = this.logger.child(context)
    return childLogger
  }

  /**
   * Set request context for HTTP logging
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
        query: req.query
          ? new URLSearchParams(req.query as Record<string, string>).toString()
          : undefined,
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

  // Public logging methods
  trace(message: string, data?: Partial<ECSLogEntry>): void {
    this.logger.trace(data ?? {}, message)
  }

  debug(message: string, data?: Partial<ECSLogEntry>): void {
    this.logger.debug(data ?? {}, message)
  }

  info(message: string, data?: Partial<ECSLogEntry>): void {
    this.logger.info(data ?? {}, message)
  }

  warn(message: string, data?: Partial<ECSLogEntry>): void {
    this.logger.warn(data ?? {}, message)
  }

  error(message: string, error?: unknown, data?: Partial<ECSLogEntry>): void {
    const errorData: Partial<ECSLogEntry> = {
      ...data,
      event: {
        ...data?.event,
        outcome: 'failure',
      },
    }

    if (error) {
      let err: ErrorWithCode
      if (error instanceof Error) {
        err = error as ErrorWithCode
      } else {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        err = new Error(String(error))
      }

      errorData.error = {
        type: err.name,
        message: err.message,
        code: err.code,
        stack_trace: this.config.includeStackTrace ? err.stack : undefined,
      }
    }

    this.logger.error(errorData, message)
  }

  fatal(message: string, error?: unknown, data?: Partial<ECSLogEntry>): void {
    const errorData: Partial<ECSLogEntry> = {
      ...data,
      event: {
        ...data?.event,
        outcome: 'failure',
      },
    }

    if (error) {
      let err: ErrorWithCode
      if (error instanceof Error) {
        err = error as ErrorWithCode
      } else {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        err = new Error(String(error))
      }

      errorData.error = {
        type: err.name,
        message: err.message,
        code: err.code,
        stack_trace: this.config.includeStackTrace ? err.stack : undefined,
      }
    }

    this.logger.fatal(errorData, message)
  }

  // HTTP-specific logging methods
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

  // Performance logging
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

// Factory function to create logger instances
export function createLogger(config: LoggerConfig): ECSLogger {
  return new ECSLogger(config)
}

// Default logger instance (can be configured per service)
export const logger = createLogger({
  serviceName: 'blich-studio',
  environment: process.env.NODE_ENV,
  level: process.env.LOG_LEVEL as LogLevel,
})

// Concise logging helpers for common patterns
export const log = {
  // Error with minimal context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (message: string, error?: any, context?: Record<string, any>) => {
    logger.error(message, error, context)
  },

  // Validation error
  validation: (message: string, id?: string) => {
    logger.error(message, undefined, {
      event: { action: 'validation', category: 'validation', outcome: 'failure' },
      labels: id ? { id } : undefined,
    })
  },

  // Database operation error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: (operation: string, error: any, id?: string) => {
    logger.error(`DB ${operation} failed`, error, {
      event: { action: operation, category: 'database', outcome: 'failure' },
      labels: id ? { id } : undefined,
    })
  },

  // Not found error
  notFound: (resource: string, id?: string) => {
    logger.error(`${resource} not found`, undefined, {
      event: { action: 'find', category: 'not_found', outcome: 'failure' },
      labels: id ? { id } : undefined,
    })
  },

  // Success operation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  success: (operation: string, id?: string, extra?: Record<string, any>) => {
    logger.info(`${operation} successful`, {
      event: { action: operation, category: 'operation', outcome: 'success' },
      labels: id ? { id } : undefined,
      ...extra,
    })
  },
}

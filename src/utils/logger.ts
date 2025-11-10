import { randomUUID } from 'crypto'

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
      body?: any
    }
    response?: {
      status_code?: number
      headers?: Record<string, string>
      body?: any
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
  labels?: Record<string, any>
  meta?: Record<string, any>
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

// Log level hierarchy for filtering
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.TRACE]: 0,
  [LogLevel.DEBUG]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.WARN]: 3,
  [LogLevel.ERROR]: 4,
  [LogLevel.FATAL]: 5,
}

/**
 * ECS-compliant Logger class
 */
export class ECSLogger {
  private config: Required<LoggerConfig>
  private context: Partial<ECSLogEntry> = {}

  constructor(config: LoggerConfig) {
    this.config = { ...defaultConfig, ...config }
    this.initializeContext()
  }

  private initializeContext(): void {
    this.context = {
      service: {
        name: this.config.serviceName,
        version: this.config.serviceVersion,
        environment: this.config.environment,
      },
      host: {
        hostname: process.env.HOSTNAME || 'unknown-host',
      },
      process: {
        pid: process.pid,
      },
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Partial<ECSLogEntry>): ECSLogger {
    const childLogger = new ECSLogger(this.config)
    childLogger.context = { ...this.context, ...context }
    return childLogger
  }

  /**
   * Set request context for HTTP logging
   */
  setRequestContext(req: any): ECSLogger {
    const requestContext: Partial<ECSLogEntry> = {
      http: {
        request: {
          method: req.method,
          url: req.url,
          headers: this.sanitizeHeaders(req.headers),
        },
      },
      url: {
        original: req.originalUrl || req.url,
        path: req.path,
        query: req.query ? new URLSearchParams(req.query).toString() : undefined,
      },
      user: req.user
        ? {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
          }
        : undefined,
      labels: {
        requestId: req.id || randomUUID(),
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection?.remoteAddress,
      },
    }

    return this.child(requestContext)
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
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

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level]
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Partial<ECSLogEntry>
  ): ECSLogEntry {
    const entry: ECSLogEntry = {
      '@timestamp': new Date().toISOString(),
      log: {
        level,
        logger: this.config.serviceName,
      },
      message,
      ...this.context,
      ...data,
    }

    return entry
  }

  private log(level: LogLevel, message: string, data?: Partial<ECSLogEntry>): void {
    if (!this.shouldLog(level)) return

    const entry = this.createLogEntry(level, message, data)

    if (this.config.enableConsole) {
      this.outputToConsole(entry)
    }

    // Here you could add other outputs like file, remote service, etc.
    // this.outputToFile(entry);
    // this.outputToRemote(entry);
  }

  private outputToConsole(entry: ECSLogEntry): void {
    if (this.config.enableJSON) {
      console.log(JSON.stringify(entry, null, this.config.environment === 'development' ? 2 : 0))
    } else {
      const levelEmoji = {
        [LogLevel.TRACE]: '🔍',
        [LogLevel.DEBUG]: '🐛',
        [LogLevel.INFO]: 'ℹ️',
        [LogLevel.WARN]: '⚠️',
        [LogLevel.ERROR]: '❌',
        [LogLevel.FATAL]: '💀',
      }

      const emoji = levelEmoji[entry.log.level] || '📝'
      const timestamp = entry['@timestamp']
      const service = entry.service?.name || 'unknown'
      const message = entry.message

      console.log(`${emoji} [${timestamp}] ${service} ${entry.log.level.toUpperCase()}: ${message}`)

      // Log additional context in development
      if (this.config.environment === 'development' && Object.keys(entry).length > 3) {
        console.log('  Context:', JSON.stringify(entry, null, 2))
      }
    }
  }

  // Public logging methods
  trace(message: string, data?: Partial<ECSLogEntry>): void {
    this.log(LogLevel.TRACE, message, data)
  }

  debug(message: string, data?: Partial<ECSLogEntry>): void {
    this.log(LogLevel.DEBUG, message, data)
  }

  info(message: string, data?: Partial<ECSLogEntry>): void {
    this.log(LogLevel.INFO, message, data)
  }

  warn(message: string, data?: Partial<ECSLogEntry>): void {
    this.log(LogLevel.WARN, message, data)
  }

  error(message: string, error?: Error | any, data?: Partial<ECSLogEntry>): void {
    const errorData: Partial<ECSLogEntry> = {
      ...data,
      event: {
        ...data?.event,
        outcome: 'failure',
      },
    }

    if (error) {
      errorData.error = {
        type: error.constructor?.name || 'Error',
        message: error.message,
        code: error.code,
        stack_trace: this.config.includeStackTrace ? error.stack : undefined,
      }
    }

    this.log(LogLevel.ERROR, message, errorData)
  }

  fatal(message: string, error?: Error | any, data?: Partial<ECSLogEntry>): void {
    const errorData: Partial<ECSLogEntry> = {
      ...data,
      event: {
        ...data?.event,
        outcome: 'failure',
      },
    }

    if (error) {
      errorData.error = {
        type: error.constructor?.name || 'Error',
        message: error.message,
        code: error.code,
        stack_trace: this.config.includeStackTrace ? error.stack : undefined,
      }
    }

    this.log(LogLevel.FATAL, message, errorData)
  }

  // HTTP-specific logging methods
  logRequest(req: any, res: any, next: any): void {
    const startTime = Date.now()
    const logger = this.setRequestContext(req)

    logger.info('Request received', {
      event: {
        action: 'request',
        category: 'web',
        type: 'access',
      },
    })

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime
      const level = res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO

      logger.log(level, 'Request completed', {
        event: {
          action: 'response',
          category: 'web',
          type: 'access',
          outcome: res.statusCode >= 400 ? 'failure' : 'success',
          duration,
        },
        http: {
          response: {
            status_code: res.statusCode,
          },
        },
      })
    })

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
  environment: process.env.NODE_ENV || 'development',
  level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
})

// Concise logging helpers for common patterns
export const log = {
  // Error with minimal context
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
  success: (operation: string, id?: string, extra?: Record<string, any>) => {
    logger.info(`${operation} successful`, {
      event: { action: operation, category: 'operation', outcome: 'success' },
      labels: id ? { id } : undefined,
      ...extra,
    })
  },
}

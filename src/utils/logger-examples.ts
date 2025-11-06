/**
 * ECS Logger Usage Examples
 *
 * This file demonstrates how to use the ECS-compliant logger
 * in various scenarios throughout your application.
 */

import { createLogger, ECSLogger, LogLevel } from './logger'

// Example 1: Basic Application Logger
export const appLogger = createLogger({
  serviceName: 'my-app',
  serviceVersion: '1.0.0',
  environment: 'production',
  level: LogLevel.INFO,
})

// Example 2: Database Logger
export const dbLogger = createLogger({
  serviceName: 'database-service',
  level: LogLevel.DEBUG,
})

// Example 3: API Logger
export const apiLogger = createLogger({
  serviceName: 'api-gateway',
  level: LogLevel.INFO,
})

// Example usage in Express middleware
export function createRequestLogger(logger: ECSLogger) {
  return (req: any, res: any, next: any) => {
    logger.logRequest(req, res, next)
  }
}

// Example: Database operations
export class DatabaseService {
  private logger: ECSLogger

  constructor() {
    this.logger = dbLogger.child({
      event: { category: 'database' },
    })
  }

  async connect() {
    const endTimer = this.logger.time('database-connection')

    try {
      // Database connection logic here
      this.logger.info('Connected to database', {
        event: {
          action: 'connect',
          outcome: 'success',
        },
      })
    } catch (error) {
      this.logger.error('Failed to connect to database', error, {
        event: {
          action: 'connect',
          outcome: 'failure',
        },
      })
      throw error
    } finally {
      endTimer()
    }
  }

  async findUser(userId: string) {
    const endTimer = this.logger.time('find-user')

    try {
      this.logger.debug('Finding user', {
        labels: { userId },
        event: { action: 'find' },
      })

      // Database query logic here
      const user = { id: userId, name: 'John Doe' }

      this.logger.info('User found', {
        labels: { userId },
        event: {
          action: 'find',
          outcome: 'success',
        },
      })

      return user
    } catch (error) {
      this.logger.error('Failed to find user', error, {
        labels: { userId },
        event: {
          action: 'find',
          outcome: 'failure',
        },
      })
      throw error
    } finally {
      endTimer()
    }
  }
}

// Example: API Controller
export class UserController {
  private logger: ECSLogger

  constructor() {
    this.logger = apiLogger.child({
      event: { category: 'api' },
    })
  }

  async getUser(req: any, res: any) {
    const requestLogger = this.logger.setRequestContext(req)
    const endTimer = requestLogger.time('get-user')

    try {
      const { userId } = req.params

      requestLogger.info('Getting user', {
        labels: { userId },
        event: { action: 'get-user' },
      })

      // Business logic here
      const user = await new DatabaseService().findUser(userId)

      requestLogger.info('User retrieved successfully', {
        labels: { userId },
        event: {
          action: 'get-user',
          outcome: 'success',
        },
      })

      res.json({ success: true, data: user })
    } catch (error) {
      requestLogger.error('Failed to get user', error, {
        event: {
          action: 'get-user',
          outcome: 'failure',
        },
      })

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      })
    } finally {
      endTimer()
    }
  }
}

// Example: Error handling middleware
export function createErrorLogger(logger: ECSLogger) {
  return (error: any, req: any, res: any, next: any) => {
    const requestLogger = logger.setRequestContext(req)

    requestLogger.error('Request error', error, {
      event: {
        category: 'web',
        action: 'error',
        outcome: 'failure',
      },
      http: {
        response: {
          status_code: error.status || 500,
        },
      },
    })

    // Continue with error handling
    next(error)
  }
}

// Example: Application startup
export function logApplicationStart(logger: ECSLogger, config: any) {
  logger.info('Application starting', {
    event: {
      action: 'start',
      category: 'process',
    },
    labels: {
      version: config.version,
      environment: config.environment,
    },
  })
}

// Example: Health check
export function logHealthCheck(logger: ECSLogger, status: 'healthy' | 'unhealthy') {
  if (status === 'healthy') {
    logger.info(`Health check: ${status}`, {
      event: {
        action: 'health-check',
        category: 'monitoring',
        outcome: 'success',
      },
      labels: {
        healthStatus: status,
      },
    })
  } else {
    logger.error(`Health check: ${status}`, undefined, {
      event: {
        action: 'health-check',
        category: 'monitoring',
        outcome: 'failure',
      },
      labels: {
        healthStatus: status,
      },
    })
  }
}

// Example: Performance monitoring
export function logPerformance(logger: ECSLogger, operation: string, duration: number) {
  logger.info(`Performance: ${operation}`, {
    event: {
      action: 'performance',
      category: 'monitoring',
      duration,
    },
    labels: {
      operation,
      durationMs: duration,
    },
  })
}

// Example: Security events
export function logSecurityEvent(logger: ECSLogger, event: string, details: any) {
  logger.warn(`Security event: ${event}`, {
    event: {
      action: 'security',
      category: 'security',
      type: 'alert',
    },
    labels: details,
  })
}

// Example: Business logic events
export function logBusinessEvent(logger: ECSLogger, event: string, data: any) {
  logger.info(`Business event: ${event}`, {
    event: {
      action: event,
      category: 'business',
    },
    labels: data,
  })
}

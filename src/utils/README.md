# ECS Logger

A comprehensive, Elastic Common Schema (ECS) compliant logger for Node.js applications.

## Features

- ✅ **ECS Compliant**: Follows Elastic Common Schema standards
- ✅ **Structured Logging**: JSON output for better searchability
- ✅ **Multiple Log Levels**: TRACE, DEBUG, INFO, WARN, ERROR, FATAL
- ✅ **HTTP Request Logging**: Automatic request/response tracking
- ✅ **Performance Monitoring**: Built-in timing utilities
- ✅ **Child Loggers**: Contextual logging with inheritance
- ✅ **TypeScript Support**: Full type safety
- ✅ **Configurable Output**: Console and JSON formatting

## Quick Start

```typescript
import { createLogger, LogLevel } from '@blich-studio/shared/utils/logger'

// Create a logger for your service
const logger = createLogger({
  serviceName: 'my-api',
  serviceVersion: '1.0.0',
  environment: 'production',
  level: LogLevel.INFO,
})

// Basic logging
logger.info('Application started')
logger.error('Something went wrong', new Error('Database connection failed'))

// With structured data
logger.info('User login', {
  labels: { userId: '123', ip: '192.168.1.1' },
  event: { action: 'login', outcome: 'success' },
})
```

## Configuration

```typescript
interface LoggerConfig {
  serviceName: string // Required: Your service name
  serviceVersion?: string // Optional: Service version
  environment?: string // Optional: Environment (development/production)
  level?: LogLevel // Optional: Minimum log level
  enableConsole?: boolean // Optional: Enable console output (default: true)
  enableJSON?: boolean // Optional: JSON output format (default: true)
  includeStackTrace?: boolean // Optional: Include stack traces in errors
}
```

## Log Levels

- `TRACE`: Most detailed logging
- `DEBUG`: Debug information
- `INFO`: General information
- `WARN`: Warning messages
- `ERROR`: Error conditions
- `FATAL`: Critical errors

## HTTP Request Logging

```typescript
import express from 'express'
import { createLogger } from '@blich-studio/shared/utils/logger'

const app = express()
const logger = createLogger({ serviceName: 'my-api' })

// Automatic request/response logging
app.use((req, res, next) => logger.logRequest(req, res, next))

// Or manual request logging
app.get('/users', (req, res) => {
  const requestLogger = logger.setRequestContext(req)

  requestLogger.info('Fetching users', {
    event: { action: 'list-users' },
  })

  // Your logic here
})
```

## Child Loggers

Create contextual loggers that inherit parent context:

```typescript
const dbLogger = logger.child({
  event: { category: 'database' },
  labels: { database: 'mongodb' },
})

dbLogger.info('Connecting to database')
// Output includes: event.category="database", labels.database="mongodb"
```

## Performance Monitoring

```typescript
// Time a database query
const endTimer = logger.time('database-query')
try {
  await db.collection('users').find({}).toArray()
  logger.info('Query completed')
} finally {
  endTimer() // Automatically logs duration
}

// Manual timing
const start = Date.now()
// ... your operation
const duration = Date.now() - start
logger.info('Operation completed', {
  event: { duration },
})
```

## Error Logging

```typescript
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', error, {
    labels: { operationId: '123' },
    event: {
      action: 'process-data',
      outcome: 'failure',
    },
  })
}
```

## ECS Output Format

When `enableJSON: true`, logs follow ECS format:

```json
{
  "@timestamp": "2024-01-15T10:30:00.000Z",
  "log": {
    "level": "info",
    "logger": "my-api"
  },
  "message": "User login successful",
  "event": {
    "action": "login",
    "category": "authentication",
    "outcome": "success"
  },
  "service": {
    "name": "my-api",
    "version": "1.0.0",
    "environment": "production"
  },
  "user": {
    "id": "123",
    "name": "john.doe"
  },
  "labels": {
    "ip": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }
}
```

## Integration Examples

### Express.js Middleware

```typescript
import { createLogger } from '@blich-studio/shared/utils/logger'

const logger = createLogger({ serviceName: 'api-server' })

// Request logging middleware
app.use((req, res, next) => {
  logger.logRequest(req, res, next)
})

// Error logging middleware
app.use((error, req, res, next) => {
  const requestLogger = logger.setRequestContext(req)
  requestLogger.error('Request error', error)
  res.status(500).json({ error: 'Internal server error' })
})
```

### Database Operations

```typescript
class DatabaseService {
  private logger = createLogger({ serviceName: 'db-service' }).child({
    event: { category: 'database' },
  })

  async connect() {
    const endTimer = this.logger.time('connection')
    try {
      await this.connectToDatabase()
      this.logger.info('Database connected', {
        event: { action: 'connect', outcome: 'success' },
      })
    } catch (error) {
      this.logger.error('Database connection failed', error, {
        event: { action: 'connect', outcome: 'failure' },
      })
    } finally {
      endTimer()
    }
  }
}
```

### Business Logic

```typescript
class UserService {
  private logger = createLogger({ serviceName: 'user-service' })

  async createUser(userData: CreateUserInput) {
    const endTimer = this.logger.time('create-user')

    try {
      this.logger.info('Creating user', {
        labels: { email: userData.email },
        event: { action: 'create-user' },
      })

      const user = await this.userRepository.create(userData)

      this.logger.info('User created successfully', {
        labels: { userId: user.id },
        event: { action: 'create-user', outcome: 'success' },
      })

      return user
    } catch (error) {
      this.logger.error('Failed to create user', error, {
        labels: { email: userData.email },
        event: { action: 'create-user', outcome: 'failure' },
      })
      throw error
    } finally {
      endTimer()
    }
  }
}
```

## Environment Variables

```bash
# Set log level
LOG_LEVEL=debug

# Service information
SERVICE_NAME=my-api
SERVICE_VERSION=1.0.0
NODE_ENV=production
```

## Best Practices

1. **Use appropriate log levels**: INFO for normal operations, WARN for recoverable issues, ERROR for failures
2. **Include context**: Use labels and event fields for searchable data
3. **Performance**: Use child loggers to avoid repeated context setup
4. **Security**: Sensitive data is automatically redacted in headers
5. **Structured data**: Prefer structured logging over string concatenation
6. **Timing**: Use the built-in timing utilities for performance monitoring

## Migration from Console Logging

Replace console statements with structured logging:

```typescript
// Before
console.log('User login:', userId)
console.error('Database error:', error)

// After
logger.info('User login', { labels: { userId } })
logger.error('Database operation failed', error, {
  event: { category: 'database', outcome: 'failure' },
})
```

This ECS logger provides comprehensive logging capabilities that scale with your application and integrate seamlessly with Elasticsearch and Kibana for advanced log analysis and monitoring.

# @blich-studio/shared

Shared utilities, types, and error classes for Blich Studio projects.

## Installation

```bash
bun add @blich-studio/shared
# or
npm install @blich-studio/shared
```

## What's Included

### 📁 Types

Common TypeScript types and interfaces used across Blich Studio projects:

- **Article** - Blog post and article types
- **Asset** - Media asset management types
- **Comment** - Comment system types
- **Common** - Shared common types and utilities
- **Like** - Like/reaction system types
- **Tag** - Tagging system types
- **User** - User profile and authentication types

```typescript
import type { Article, User, Comment } from '@blich-studio/shared/types'
```

### 🛠️ Utilities

#### Logger (ECS Compliant)

A comprehensive, Elastic Common Schema (ECS) compliant logger built on Pino:

```typescript
import { createLogger, LogLevel } from '@blich-studio/shared/utils/logger'

const logger = createLogger({
  serviceName: 'my-api',
  serviceVersion: '1.0.0',
  environment: 'production',
  level: LogLevel.INFO,
})

logger.info('Application started')
logger.error('Something went wrong', new Error('Database connection failed'))
```

**Features:**
- ✅ ECS compliant structured logging
- ✅ Multiple log levels (TRACE, DEBUG, INFO, WARN, ERROR, FATAL)
- ✅ HTTP request/response logging
- ✅ Performance monitoring with timing utilities
- ✅ Child loggers for contextual logging
- ✅ TypeScript support

[Full Logger Documentation →](src/utils/README.md)

#### Date Utilities

Helper functions for working with dates using Day.js:

```typescript
import { formatDate, parseDate, isValidDate } from '@blich-studio/shared/utils/date'
```

#### MongoDB Utilities

Helper functions for MongoDB operations:

```typescript
import { connectToMongoDB, getCollection } from '@blich-studio/shared/utils/mongodb'
```

### ❌ Error Classes

Custom error classes for consistent error handling:

```typescript
import { HttpError, MissingEnvironmentVariableError } from '@blich-studio/shared/errors'

// HTTP errors with status codes
throw new HttpError('Not found', 404)

// Environment validation errors
throw new MissingEnvironmentVariableError('DATABASE_URL')
```

## Usage Examples

### Import Types

```typescript
import type { User, Article, Comment } from '@blich-studio/shared/types'

const user: User = {
  id: '123',
  email: 'user@example.com',
  name: 'John Doe',
}
```

### Use Logger

```typescript
import { createLogger } from '@blich-studio/shared/utils/logger'

const logger = createLogger({ serviceName: 'my-service' })

// Basic logging
logger.info('User logged in', { labels: { userId: '123' } })

// Error logging
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', error)
}

// Child logger with context
const dbLogger = logger.child({
  event: { category: 'database' },
})
dbLogger.info('Connecting to database')
```

### Handle Errors

```typescript
import { HttpError } from '@blich-studio/shared/errors'

app.get('/users/:id', async (req, res) => {
  const user = await findUser(req.params.id)
  if (!user) {
    throw new HttpError('User not found', 404)
  }
  res.json(user)
})
```

## Development

### Build

```bash
bun run build
```

### Type Check

```bash
bun run typecheck
```

### Lint

```bash
bun run lint
bun run lint:fix
```

## Package Structure

```
shared/
├── src/
│   ├── index.ts          # Main exports
│   ├── types/            # TypeScript type definitions
│   │   ├── article.ts
│   │   ├── asset.ts
│   │   ├── comment.ts
│   │   ├── common.ts
│   │   ├── like.ts
│   │   ├── tag.ts
│   │   └── user.ts
│   ├── utils/            # Utility functions
│   │   ├── logger.ts     # ECS compliant logger
│   │   ├── date.ts       # Date utilities
│   │   └── mongodb.ts    # MongoDB helpers
│   └── errors/           # Custom error classes
│       ├── HttpError.ts
│       └── MissingEnvironmentVariableError.ts
└── dist/                 # Compiled output
```

## Dependencies

- **dayjs** - Date manipulation
- **mongodb** - MongoDB driver
- **pino** - Fast JSON logger
- **pino-pretty** - Pretty log formatting
- **zod** - Schema validation

## License

ISC

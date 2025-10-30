![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen)

# Database Adapter Pattern

This repository demonstrates the database adapter pattern for building resilient, testable, and database-agnostic applications. The pattern provides abstraction between your business logic and database implementations, enabling easy switching between databases and fast testing without infrastructure.

## Features

- **Database Abstraction**: Clean interface that hides database implementation details
- **Connection Resilience**: Automatic retry logic with exponential backoff
- **Environment Flexibility**: Same code works with different databases per environment
- **Fast Testing**: Mock adapter enables millisecond test execution
- **TypeScript Support**: Full type safety throughout the application

## Architecture

```
Business Logic → Database Interface → DbAdapter Base Class → Concrete Adapters
                                                            ↓
                                                     PostgreSQL | Mock | MongoDB
```

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local PostgreSQL development)

### Installation

```bash
npm install
```

### Database Setup (Optional)

If you want to use a real PostgreSQL database instead of the mock adapter:

```bash
# Run migrations
npm run db:migrate:latest

# Seed the database with sample data
npm run db:seed:run
```

### Running Tests

```bash
npm test
```

Tests run in milliseconds using the MockAdapter - no database required!

### Local Development with Docker

1. Start PostgreSQL and the application:
```bash
docker-compose up --build
```

2. The API will be available at `http://localhost:3000`

### API Endpoints

- `GET /health` - Health check
- `GET /orders` - Get all orders
- `GET /orders/pending` - Get pending orders

### Manual Testing

```bash
# Health check
curl http://localhost:3000/health

# Get all orders
curl http://localhost:3000/orders

# Get pending orders
curl http://localhost:3000/orders/pending
```

## Project Structure

```
src/
├── database.ts          # Database interface
├── adapter.ts           # Abstract DbAdapter with retry logic
├── knex-adapter.ts      # PostgreSQL adapter using Knex
├── sqlite-adapter.ts    # SQLite adapter using Knex
├── mock-adapter.ts      # In-memory mock adapter for testing
├── database-manager.ts  # Environment-aware database factory
├── order-service.ts     # Example business logic service
├── server.ts           # Express API server
└── __tests__/          # Test files
    ├── mock-adapter.test.ts
    ├── sqlite-adapter.test.ts
    ├── database-manager.test.ts
    └── order-service.test.ts

db/
├── knexfile.js         # Knex configuration
├── migrations/         # Database schema migrations
└── seeds/             # Sample data seeds
```

## Key Components

### Database Interface

```typescript
interface Database {
  query(sql: string, params?: any[]): Promise<any>;
  close(): Promise<void>;
}
```

### Abstract Adapter with Resilience

```typescript
abstract class DbAdapter<T> implements Database {
  // Automatic retry with exponential backoff
  async initialize(): Promise<void> {
    // Retry logic: 1s, 2s, 4s, 8s, 16s
  }
}
```

### Environment Configuration

```typescript
// config/database.ts
export async function createDatabase() {
  if (process.env.NODE_ENV === 'test') {
    return manager.createDatabase(MockAdapter); // Fast tests
  }
  return manager.createDatabase(KnexAdapter); // Real database
}
```

## Testing Strategy

- **Unit Tests**: Business logic with MockAdapter (milliseconds)
- **Integration Tests**: Adapter behavior with real databases (CI/CD)

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

## Switching Databases

The adapter pattern makes database switching a configuration change:

```typescript
// From PostgreSQL to MySQL
const mysqlConfig = { client: 'mysql', connection: MYSQL_URL };
return manager.createDatabase(KnexAdapter, mysqlConfig);

// To SQLite (file-based)
const sqliteConfig = { filename: './data.db' };
return manager.createDatabase(SqliteAdapter, sqliteConfig);

// To SQLite (in-memory)
const memoryConfig = { filename: ':memory:' };
return manager.createDatabase(SqliteAdapter, memoryConfig);
```

**Note:** The adapter pattern works best within the same database paradigm (SQL databases). For NoSQL databases like MongoDB, you'd need a different query interface, which is a topic for a separate discussion.

## Benefits

- **Freedom**: Change databases without rewriting business logic
- **Speed**: Tests run without Docker/infrastructure
- **Reliability**: Automatic connection recovery
- **Maintainability**: Clean separation of concerns

## Common Mistakes to Avoid

1. **Don't initialize database after server starts**
2. **Don't mix adapter internals with business logic**
3. **Don't forget to close connections on shutdown**
4. **Don't test everything with real databases**

## Contributing

1. Clone the repository
2. Run tests: `npm test`
3. Make changes
4. Ensure tests pass
5. Submit a pull request

## License

MIT

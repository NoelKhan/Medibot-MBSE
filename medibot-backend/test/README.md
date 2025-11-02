# MediBot Backend - Test Suite

This directory contains all tests for the MediBot backend application.

## Test Structure

```
test/
├── e2e/                    # End-to-end tests
│   ├── health.e2e-spec.ts  # Health check endpoint tests
│   └── auth.e2e-spec.ts    # Authentication flow tests
├── integration/            # Integration tests (future)
├── unit/                   # Unit tests (future)
└── jest-e2e.json          # E2E test configuration
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests
```bash
npm run test:watch    # Watch mode
npm run test:cov      # With coverage
```

### E2E Tests
```bash
npm run test:e2e
```

### In Docker
```bash
# Start test environment
npm run docker:test

# Run tests
docker-compose -f docker-compose.test.yml run backend npm run test:e2e
```

## Writing Tests

### E2E Tests

E2E tests should test complete user workflows and API endpoints:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Feature Name (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should test something', () => {
    return request(app.getHttpServer())
      .get('/api/endpoint')
      .expect(200);
  });
});
```

### Unit Tests

Unit tests go alongside the source files with `.spec.ts` extension:

```typescript
// src/modules/users/users.service.spec.ts
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    // Setup
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

## Test Database

E2E tests use a separate test database configured in `docker-compose.test.yml`:

- **Host**: localhost
- **Port**: 5433 (different from dev)
- **Database**: medibot_test
- **Username**: medibot_test
- **Password**: test_password

The test database is ephemeral (uses tmpfs) and is recreated for each test run.

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- All pull requests
- Pushes to `main` and `develop` branches

See `.github/workflows/ci-cd.yml` for CI configuration.

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

```bash
npm run test:cov
open coverage/lcov-report/index.html
```

Coverage is also uploaded to Codecov in CI/CD pipeline.

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Up**: Always close connections in `afterAll()`
3. **Use Fixtures**: Create reusable test data
4. **Test Edge Cases**: Don't just test happy paths
5. **Keep Tests Fast**: Mock external services when possible
6. **Meaningful Names**: Test names should describe what they test

## Troubleshooting

### Tests Timing Out

Increase Jest timeout in test file:
```typescript
jest.setTimeout(30000); // 30 seconds
```

### Database Connection Issues

Ensure test database is running:
```bash
docker-compose -f docker-compose.test.yml up -d postgres-test
```

### Port Conflicts

Check if ports 5433 (Postgres) or 6380 (Redis) are already in use:
```bash
lsof -i :5433
lsof -i :6380
```

## Future Improvements

- [ ] Add integration tests for external services
- [ ] Add performance tests
- [ ] Add security tests
- [ ] Increase test coverage to >80%
- [ ] Add visual regression tests
- [ ] Add contract tests for API

# MSW (Mock Service Worker) Integration Guide

> Mock API responses for offline testing and deterministic test execution

---

## Quick Start

### 1. Install MSW

```bash
npm install --save-dev msw
```

### 2. Create Mock Handlers

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock GET /api/users
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
    ]);
  }),

  // Mock POST /api/login
  http.post('/api/login', async ({ request }) => {
    const body = await request.json();

    if (body.username === 'admin' && body.password === 'password') {
      return HttpResponse.json({ token: 'mock-jwt-token' });
    }

    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }),

  // Mock with delay
  http.get('/api/slow-endpoint', async () => {
    await delay(2000);
    return HttpResponse.json({ data: 'slow response' });
  }),
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

### 3. Setup MSW Server

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### 4. Integrate with Global Setup

```typescript
// src/global-setup.ts
import { server } from './mocks/server';

async function globalSetup() {
  // Start MSW server before tests
  server.listen({
    onUnhandledRequest: 'warn', // Warn about unmocked requests
  });

  console.log('✅ MSW server started');
}

export default globalSetup;
```

### 5. Global Teardown

```typescript
// src/global-teardown.ts
import { server } from './mocks/server';

async function globalTeardown() {
  server.close();
  console.log('✅ MSW server stopped');
}

export default globalTeardown;
```

---

## Usage in Tests

### Basic Example

```typescript
import { test, expect } from '@core/fixtures';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

test.describe('API Tests with MSW', () => {
  test('fetch users from mocked API', async ({ request }) => {
    const response = await request.get('/api/users');
    const users = await response.json();

    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('John Doe');
  });

  test('override mock for specific test', async ({ request }) => {
    // Override just for this test
    server.use(
      http.get('/api/users', () => {
        return HttpResponse.json([{ id: 99, name: 'Test User' }]);
      })
    );

    const response = await request.get('/api/users');
    const users = await response.json();

    expect(users).toHaveLength(1);
    expect(users[0].id).toBe(99);
  });

  test.afterEach(() => {
    // Reset handlers after each test
    server.resetHandlers();
  });
});
```

---

## Advanced Patterns

### Dynamic Responses

```typescript
let userIdCounter = 1;

http.post('/api/users', async ({ request }) => {
  const body = await request.json();

  return HttpResponse.json(
    {
      id: userIdCounter++,
      ...body,
      createdAt: new Date().toISOString(),
    },
    { status: 201 }
  );
});
```

### Error Simulation

```typescript
// Simulate network errors
http.get('/api/flaky', () => {
  return HttpResponse.error();
});

// Simulate timeouts
http.get('/api/timeout', async () => {
  await delay(60000); // Exceeds test timeout
  return HttpResponse.json({});
});

// Simulate specific HTTP errors
http.get('/api/forbidden', () => {
  return HttpResponse.json({ error: 'Access denied' }, { status: 403 });
});
```

### Conditional Mocking

```typescript
// src/mocks/setup.ts
const USE_MOCKS = process.env.USE_MOCKS === 'true';

export function setupMocks() {
  if (USE_MOCKS) {
    server.listen();
    console.log('✅ Running with mocked APIs');
  } else {
    console.log('ℹ️  Running with real APIs');
  }
}
```

---

## Configuration

### playwright.config.ts

```typescript
export default defineConfig({
  globalSetup: require.resolve('./src/global-setup.ts'),
  globalTeardown: require.resolve('./src/global-teardown.ts'),

  use: {
    // Use localhost for mocked APIs
    baseURL:
      process.env.USE_MOCKS === 'true' ? 'http://localhost:3000' : 'https://api.production.com',
  },
});
```

---

## Best Practices

1. **Organize handlers by domain**:

   ```
   src/mocks/
   ├── handlers/
   │   ├── auth.ts
   │   ├── users.ts
   │   └── products.ts
   ├── server.ts
   └── index.ts
   ```

2. **Use realistic data**:

   ```typescript
   import { DataGenerator } from '@utils';

   http.get('/api/users/:id', ({ params }) => {
     return HttpResponse.json({
       id: params.id,
       name: DataGenerator.generateFullName(),
       email: DataGenerator.generateEmail(),
     });
   });
   ```

3. **Document mock contracts**:
   ```typescript
   /**
    * Mock handler for POST /api/users
    *
    * Request:
    *   - email: string (required)
    *   - name: string (required)
    *
    * Response 201:
    *   - id: number
    *   - email: string
    *   - name: string
    *   - createdAt: string (ISO date)
    */
   ```

---

## Resources

- [MSW Documentation](https://mswjs.io/)
- [MSW Playwright Integration](https://mswjs.io/docs/integrations/node)
- [Example Repository](https://github.com/mswjs/examples)

---

_Last Updated: January 2026_

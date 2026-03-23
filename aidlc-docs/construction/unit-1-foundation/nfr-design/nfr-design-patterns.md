# NFR Design Patterns — Unit 1: Foundation

## Pattern 1: JWT Validation with In-Memory JWKS Cache

**Problem**: Validating JWTs requires fetching Cognito's JWKS endpoint. Fetching on every request adds latency and creates an external dependency.

**Solution**: Cache JWKS in Lambda memory on cold start.

```
Lambda cold start:
  → Fetch JWKS from https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json
  → Store in module-level variable (persists across warm invocations)

Warm invocation:
  → Use cached JWKS (no network call)
  → Validate JWT locally using cached public keys
```

**Library**: `aws-jwt-verify` — handles JWKS caching and rotation automatically.

---

## Pattern 2: Retry with Exponential Backoff (DynamoDB Writes)

**Problem**: DynamoDB writes can fail transiently (throttling, network blip). Registration must be reliable.

**Solution**: Wrap DynamoDB writes in a retry utility.

```
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxRetries || !isRetryable(err)) throw err
      await sleep(Math.pow(2, attempt) * 100) // 100ms, 200ms, 400ms
    }
  }
}
```

**Applied to**: User record creation on registration.

---

## Pattern 3: Structured Error Responses

**Problem**: Inconsistent error formats make frontend error handling brittle.

**Solution**: All Lambda handlers return a consistent error envelope.

```typescript
interface ErrorResponse {
  error: string      // Human-readable message
  code: string       // Machine-readable code (e.g., "USER_NOT_FOUND", "INVALID_TOKEN")
  statusCode: number // HTTP status code
}
```

**Error code registry** (Unit 1):
- `VALIDATION_ERROR` (400)
- `INVALID_CREDENTIALS` (401)
- `TOKEN_EXPIRED` (401)
- `FORBIDDEN` (403)
- `USER_NOT_FOUND` (404)
- `EMAIL_ALREADY_EXISTS` (409)
- `INTERNAL_ERROR` (500)

---

## Pattern 4: Middleware Chain (RBAC)

**Problem**: Every handler needs to check roles. Duplicating this logic is error-prone.

**Solution**: Compose handlers with a middleware wrapper.

```typescript
function requireRole(role: Role, handler: Handler): Handler {
  return async (event, context) => {
    const userRole = event.requestContext.authorizer?.role
    if (!hasRole(userRole, role)) {
      return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden', code: 'FORBIDDEN' }) }
    }
    return handler(event, context)
  }
}

// Usage:
export const handler = requireRole('ADMIN', listUsersHandler)
```

---

## Pattern 5: Environment-Based Configuration

**Problem**: Hardcoded resource names break across environments (dev, staging, prod).

**Solution**: All resource names injected via Lambda environment variables from SAM template.

```typescript
const config = {
  usersTable: process.env.USERS_TABLE!,
  userPoolId: process.env.USER_POOL_ID!,
  userPoolClientId: process.env.USER_POOL_CLIENT_ID!,
  eventBusName: process.env.EVENT_BUS_NAME!,
  region: process.env.AWS_REGION!,
}
```

SAM template sets these via `Environment.Variables` on each Lambda function.

---

## Pattern 6: Frontend Token Refresh Interceptor

**Problem**: Access tokens expire after 1 hour. Users should not be logged out mid-session.

**Solution**: Axios interceptor automatically refreshes token on 401 responses.

```
Request → API
  ← 401 Unauthorized (token expired)
Interceptor:
  → Call POST /auth/refresh with refreshToken
  ← New accessToken
  → Retry original request with new token
  ← Success response
```

If refresh also fails (refresh token expired): redirect to `/login`.

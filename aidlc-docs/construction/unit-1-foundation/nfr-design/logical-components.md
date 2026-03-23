# Logical Components — Unit 1: Foundation

## Backend Logical Components

### LambdaAuthorizer
- **Type**: API Gateway Lambda Authorizer (TOKEN type)
- **Trigger**: Every protected API Gateway route
- **Responsibilities**: JWT validation, claims extraction, IAM policy generation
- **Cache**: 5-minute result cache in API Gateway (keyed by token)
- **Output**: IAM Allow policy + context `{ userId, email, role }`

### AuthHandlers (Lambda functions)
- `POST /auth/register` → `registerHandler`
- `POST /auth/login` → `loginHandler`
- `POST /auth/refresh` → `refreshTokenHandler`
- `POST /auth/confirm` → `confirmAccountHandler`
- `POST /auth/forgot-password` → `forgotPasswordHandler`
- `POST /auth/reset-password` → `resetPasswordHandler`

### UserHandlers (Lambda functions)
- `GET /users/me` → `getProfileHandler`
- `PUT /users/me` → `updateProfileHandler`
- `GET /users` → `listUsersHandler` (ADMIN only)
- `PUT /users/{userId}/role` → `assignRoleHandler` (ADMIN only)
- `DELETE /users/{userId}` → `deactivateUserHandler` (ADMIN only)

### Shared Modules
- `shared/middleware/authorizer.ts` — Lambda Authorizer implementation
- `shared/middleware/rbac.ts` — `requireRole()` wrapper
- `shared/db/dynamoClient.ts` — DynamoDB DocumentClient wrapper
- `shared/events/eventBridgeClient.ts` — EventBridge publisher wrapper
- `shared/types/index.ts` — Shared TypeScript interfaces (User, Role, AuthContext, ErrorResponse)
- `shared/utils/retry.ts` — `withRetry()` utility
- `shared/utils/errors.ts` — Error response builder

## Frontend Logical Components

### AuthService (`frontend/src/services/authService.ts`)
- Wraps all `/auth/*` API calls
- Manages token storage in localStorage
- Exposes: `login()`, `register()`, `logout()`, `refreshToken()`, `confirmAccount()`, `forgotPassword()`, `resetPassword()`

### UserService (`frontend/src/services/userService.ts`)
- Wraps all `/users/*` API calls
- Exposes: `getProfile()`, `updateProfile()`, `listUsers()`, `assignRole()`, `deactivateUser()`

### apiClient (`frontend/src/services/apiClient.ts`)
- Axios instance with base URL from environment variable
- Request interceptor: injects `Authorization: Bearer {accessToken}` header
- Response interceptor: handles 401 → token refresh → retry

### AuthContext (`frontend/src/context/AuthContext.tsx`)
- React context providing `user`, `isAuthenticated`, `isLoading`
- Methods: `login()`, `logout()`, `refreshToken()`

## AWS Infrastructure Components (provisioned in Unit 1)

| Component | AWS Resource | Purpose |
|---|---|---|
| API Gateway | HTTP API | Single entry point for all REST calls |
| Lambda Authorizer | Lambda function | JWT validation for all protected routes |
| Cognito User Pool | Amazon Cognito | User identity, password management, JWT issuance |
| Cognito App Client | Cognito App Client | Client credentials for SDK auth flows |
| EventBridge Bus | Custom Event Bus | Async event routing (used by Units 2–7) |
| Users Table | DynamoDB Table | User profiles and roles |
| All Other Tables | DynamoDB Tables | Provisioned empty; populated by later units |
| Attachments Bucket | S3 Bucket | Idea file attachments (used by Unit 3) |
| Frontend Bucket | S3 Bucket | React SPA static assets |
| CloudFront Distribution | CloudFront | CDN for frontend SPA delivery |
| CloudWatch Log Groups | CloudWatch | Lambda function logs |

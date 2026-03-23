# Code Generation Plan — Unit 1: Foundation

## Unit Context
- **Unit**: Unit 1 — Foundation (Infrastructure, Auth & User Management)
- **Requirements Covered**: FR-01, NFR-01 through NFR-06
- **Dependencies**: None (root unit)
- **Output**: SAM template.yaml skeleton, backend auth/user handlers, shared middleware, frontend auth pages

---

## Steps

- [x] Step 1: Project Structure Setup
  - Create monorepo directory structure at workspace root
  - Create `backend/package.json`, `backend/tsconfig.json`
  - Create `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`
  - Create `backend/src/` subdirectories: auth/, users/, shared/middleware/, shared/db/, shared/events/, shared/types/, shared/utils/

- [x] Step 2: SAM Template — Full Infrastructure Skeleton
  - Create `template.yaml` with all resources:
    - Cognito User Pool + App Client
    - API Gateway HTTP API with Lambda Authorizer
    - All DynamoDB tables (Users + all tables for Units 2–7)
    - EventBridge Custom Bus
    - S3 Attachments Bucket + Frontend Bucket
    - CloudFront Distribution
    - All Lambda function stubs (Unit 1 implemented; Units 2–7 as stubs)
    - IAM policies per function group
    - Outputs section

- [x] Step 3: Shared Types
  - Create `backend/shared/types/index.ts`
    - User, Role enum, AuthContext, ErrorResponse, TokenSet interfaces

- [x] Step 4: Shared Utilities
  - Create `backend/shared/utils/errors.ts` — error response builder
  - Create `backend/shared/utils/retry.ts` — withRetry() utility
  - Create `backend/shared/utils/validation.ts` — email/password validators

- [x] Step 5: Shared DynamoDB Client
  - Create `backend/shared/db/dynamoClient.ts` — typed DynamoDB DocumentClient wrapper

- [x] Step 6: Shared EventBridge Client
  - Create `backend/shared/events/eventBridgeClient.ts` — publish() helper

- [x] Step 7: Lambda Authorizer
  - Create `backend/shared/middleware/authorizer.ts`
    - JWKS fetch + in-memory cache
    - JWT validation using aws-jwt-verify
    - IAM policy generation with userId/email/role context

- [x] Step 8: RBAC Middleware
  - Create `backend/shared/middleware/rbac.ts`
    - requireRole() handler wrapper
    - hasRole() role hierarchy check

- [x] Step 9: Auth Handlers
  - Create `backend/src/auth/register.ts`
  - Create `backend/src/auth/login.ts`
  - Create `backend/src/auth/refreshToken.ts`
  - Create `backend/src/auth/confirmAccount.ts`
  - Create `backend/src/auth/forgotPassword.ts`
  - Create `backend/src/auth/resetPassword.ts`

- [x] Step 10: User Handlers
  - Create `backend/src/users/getProfile.ts`
  - Create `backend/src/users/updateProfile.ts`
  - Create `backend/src/users/listUsers.ts`
  - Create `backend/src/users/assignRole.ts`
  - Create `backend/src/users/deactivateUser.ts`

- [x] Step 11: Backend Unit Tests
  - Create `backend/src/auth/*.test.ts` — tests for each auth handler
  - Create `backend/src/users/*.test.ts` — tests for each user handler
  - Create `backend/shared/**/*.test.ts` — tests for middleware and utilities

- [x] Step 12: Frontend — Project Setup
  - Create `frontend/index.html`
  - Create `frontend/src/main.tsx`
  - Create `frontend/src/App.tsx` with router setup
  - Create `frontend/src/context/AuthContext.tsx`
  - Create `frontend/src/services/apiClient.ts` (Axios instance + interceptors)
  - Create `frontend/src/services/authService.ts`
  - Create `frontend/src/services/userService.ts`

- [x] Step 13: Frontend — Shared UI Components
  - Create `frontend/src/components/ui/Button.tsx`
  - Create `frontend/src/components/ui/Input.tsx`
  - Create `frontend/src/components/ui/FormError.tsx`
  - Create `frontend/src/components/ui/LoadingSpinner.tsx`
  - Create `frontend/src/components/ui/RoleBadge.tsx`
  - Create `frontend/src/components/layout/AppShell.tsx`
  - Create `frontend/src/components/layout/ProtectedRoute.tsx`

- [x] Step 14: Frontend — Auth Pages
  - Create `frontend/src/pages/auth/LoginPage.tsx`
  - Create `frontend/src/pages/auth/RegisterPage.tsx`
  - Create `frontend/src/pages/auth/ConfirmAccountPage.tsx`
  - Create `frontend/src/pages/auth/ForgotPasswordPage.tsx`

- [x] Step 15: Frontend — Profile Page
  - Create `frontend/src/pages/profile/ProfilePage.tsx`

- [x] Step 16: Frontend — Admin User Management Page
  - Create `frontend/src/pages/admin/users/UserManagementPage.tsx`

- [x] Step 17: Frontend Unit Tests
  - Create tests for AuthContext, auth pages, shared components

- [x] Step 18: Configuration Files
  - Create `frontend/.env.example` with required env vars
  - Create `samconfig.toml` with dev/staging/prod environment configs
  - Create root `README.md` with setup and deployment instructions

- [x] Step 19: Code Summary Documentation
  - Create `aidlc-docs/construction/unit-1-foundation/code/code-summary.md`
    - List all created files with brief descriptions

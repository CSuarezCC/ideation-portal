# Code Summary — Unit 1: Foundation

## Backend Files Created

| File | Description |
|---|---|
| `backend/package.json` | Backend dependencies (AWS SDK v3, aws-jwt-verify, Jest) |
| `backend/tsconfig.json` | TypeScript strict config targeting ES2022 |
| `backend/src/shared/types/index.ts` | Shared interfaces: User, Role, AuthContext, TokenSet, ErrorResponse |
| `backend/src/shared/utils/errors.ts` | errorResponse() and successResponse() helpers |
| `backend/src/shared/utils/retry.ts` | withRetry() with exponential backoff |
| `backend/src/shared/utils/validation.ts` | isValidEmail(), isValidPassword() |
| `backend/src/shared/db/dynamoClient.ts` | Typed DynamoDB DocumentClient wrapper |
| `backend/src/shared/events/eventBridgeClient.ts` | publishEvent() EventBridge helper |
| `backend/src/shared/middleware/authorizer.ts` | Lambda Authorizer — JWKS cache + JWT validation |
| `backend/src/shared/middleware/rbac.ts` | requireRole() wrapper, hasRole() hierarchy check |
| `backend/src/handlers/auth/register.ts` | POST /auth/register handler |
| `backend/src/handlers/auth/login.ts` | POST /auth/login handler |
| `backend/src/handlers/auth/refreshToken.ts` | POST /auth/refresh handler |
| `backend/src/handlers/auth/confirmAccount.ts` | POST /auth/confirm handler |
| `backend/src/handlers/auth/forgotPassword.ts` | POST /auth/forgot-password handler |
| `backend/src/handlers/auth/resetPassword.ts` | POST /auth/reset-password handler |
| `backend/src/handlers/users/getProfile.ts` | GET /users/me handler |
| `backend/src/handlers/users/updateProfile.ts` | PUT /users/me handler |
| `backend/src/handlers/users/listUsers.ts` | GET /users handler (ADMIN only) |
| `backend/src/handlers/users/assignRole.ts` | PUT /users/{userId}/role handler (ADMIN only) |
| `backend/src/handlers/users/deactivateUser.ts` | DELETE /users/{userId} handler (ADMIN only) |
| `backend/src/shared/utils/validation.test.ts` | Unit tests for validation utilities |
| `backend/src/shared/middleware/rbac.test.ts` | Unit tests for RBAC role hierarchy |
| `backend/src/shared/utils/retry.test.ts` | Unit tests for retry utility |

## Frontend Files Created

| File | Description |
|---|---|
| `frontend/package.json` | Frontend dependencies (React 18, Vite, Tailwind, React Hook Form) |
| `frontend/tsconfig.json` | TypeScript strict config for React/Vite |
| `frontend/vite.config.ts` | Vite config with Vitest setup |
| `frontend/index.html` | SPA entry point |
| `frontend/src/main.tsx` | React app bootstrap |
| `frontend/src/App.tsx` | Router setup with all routes |
| `frontend/src/index.css` | Tailwind CSS imports |
| `frontend/src/context/AuthContext.tsx` | Auth context — user state, login/logout, token management |
| `frontend/src/services/apiClient.ts` | Axios instance with auth interceptor + token refresh |
| `frontend/src/services/authService.ts` | Auth API calls (login, register, confirm, reset) |
| `frontend/src/services/userService.ts` | User API calls (profile, role management) |
| `frontend/src/components/ui/Button.tsx` | Reusable button with loading state |
| `frontend/src/components/ui/Input.tsx` | Reusable input with label and error display |
| `frontend/src/components/ui/RoleBadge.tsx` | Role badge component |
| `frontend/src/components/ui/LoadingSpinner.tsx` | Loading spinner (inline + full-page) |
| `frontend/src/components/layout/AppShell.tsx` | Nav bar with role-based links |
| `frontend/src/components/layout/ProtectedRoute.tsx` | Auth + role guard for routes |
| `frontend/src/pages/auth/LoginPage.tsx` | Login form |
| `frontend/src/pages/auth/RegisterPage.tsx` | Registration form |
| `frontend/src/pages/auth/ConfirmAccountPage.tsx` | Account confirmation form |
| `frontend/src/pages/auth/ForgotPasswordPage.tsx` | Two-step password reset flow |
| `frontend/src/pages/profile/ProfilePage.tsx` | User profile view/edit |
| `frontend/src/pages/admin/users/UserManagementPage.tsx` | Admin user list with role assignment |
| `frontend/src/test/setup.ts` | Vitest test setup |
| `frontend/src/pages/auth/LoginPage.test.tsx` | LoginPage component tests |

## Infrastructure Files Created

| File | Description |
|---|---|
| `template.yaml` | Full AWS SAM template — all resources for all units |
| `samconfig.toml` | SAM deployment configs for dev/staging/prod |
| `frontend/.env.example` | Frontend environment variable template |
| `README.md` | Project setup and deployment guide |

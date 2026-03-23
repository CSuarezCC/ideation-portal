# Frontend Components — Unit 1: Foundation

## Component Hierarchy

```
App
├── AuthProvider (context: user, role, tokens)
│   ├── PublicRoute
│   │   ├── LoginPage
│   │   ├── RegisterPage
│   │   ├── ConfirmAccountPage
│   │   └── ForgotPasswordPage
│   └── ProtectedRoute (requires auth)
│       ├── AppShell (nav, notification bell, user menu)
│       │   ├── ProfilePage
│       │   └── [pages from later units]
```

---

## AuthProvider

**Purpose**: React context providing auth state and token management to the entire app.

**State**:
```typescript
{
  user: { userId, email, name, role } | null
  isAuthenticated: boolean
  isLoading: boolean
}
```

**Methods exposed via context**:
- `login(email, password): Promise<void>`
- `logout(): void`
- `refreshToken(): Promise<void>`

**Behavior**:
- On mount: checks localStorage for existing tokens, validates expiry, restores session
- Stores tokens in localStorage (accessToken, refreshToken, idToken)
- Auto-refreshes access token 5 minutes before expiry (background timer)
- On logout: clears localStorage, redirects to `/login`

---

## LoginPage

**Route**: `/login`

**Props**: none

**State**:
```typescript
{ email: string, password: string, error: string | null, isLoading: boolean }
```

**Form Fields**:
- Email input (`data-testid="login-email-input"`)
- Password input (`data-testid="login-password-input"`)
- Submit button (`data-testid="login-submit-button"`)
- Error message display (`data-testid="login-error-message"`)

**Validation**:
- Email: required, valid email format
- Password: required, min 8 characters

**API Integration**: `POST /auth/login`

**On Success**: Redirect to `/dashboard` (or originally requested route)

---

## RegisterPage

**Route**: `/register`

**State**:
```typescript
{ email, password, confirmPassword, name, department, error, isLoading }
```

**Form Fields**:
- Name input (`data-testid="register-name-input"`)
- Email input (`data-testid="register-email-input"`)
- Department input (`data-testid="register-department-input"`, optional)
- Password input (`data-testid="register-password-input"`)
- Confirm Password input (`data-testid="register-confirm-password-input"`)
- Submit button (`data-testid="register-submit-button"`)

**Validation**:
- Name: required
- Email: required, valid format
- Password: required, 8+ chars, uppercase, lowercase, digit
- Confirm Password: must match password

**API Integration**: `POST /auth/register`

**On Success**: Redirect to `/confirm-account?email={email}`

---

## ConfirmAccountPage

**Route**: `/confirm-account`

**State**:
```typescript
{ email: string, code: string, error, isLoading, success }
```

**Form Fields**:
- Email input (pre-filled from query param, `data-testid="confirm-email-input"`)
- Confirmation code input (`data-testid="confirm-code-input"`)
- Submit button (`data-testid="confirm-submit-button"`)
- Resend code link (`data-testid="confirm-resend-link"`)

**API Integration**: `POST /auth/confirm`

**On Success**: Redirect to `/login` with success message

---

## ForgotPasswordPage

**Route**: `/forgot-password`

**Two-step flow**:

Step 1 — Request reset:
- Email input (`data-testid="forgot-email-input"`)
- Submit button (`data-testid="forgot-submit-button"`)
- API: `POST /auth/forgot-password`

Step 2 — Confirm reset (shown after step 1 success):
- Code input (`data-testid="reset-code-input"`)
- New password input (`data-testid="reset-password-input"`)
- Confirm password input (`data-testid="reset-confirm-password-input"`)
- Submit button (`data-testid="reset-submit-button"`)
- API: `POST /auth/reset-password`

**On Success**: Redirect to `/login` with success message

---

## AppShell

**Purpose**: Persistent layout wrapper for all authenticated pages.

**Contains**:
- Top navigation bar with logo and app name
- Role-based navigation links:
  - All roles: Dashboard, My Ideas, Submit Idea
  - PANEL_MEMBER + ADMIN: Evaluations, Analytics
  - ADMIN only: Campaigns, Users
- NotificationBell component (Unit 6 — stub in Unit 1)
- User menu (avatar, name, role badge, Profile link, Logout)

**Props**: `{ children: ReactNode }`

**Role-based rendering**: reads role from AuthContext

---

## ProfilePage

**Route**: `/profile`

**State**:
```typescript
{ profile: UserProfile | null, isEditing: boolean, formData, isLoading, error, success }
```

**Displays**:
- Name, email (read-only), department, role badge, avatar

**Edit mode**:
- Name input (`data-testid="profile-name-input"`)
- Department input (`data-testid="profile-department-input"`)
- Save button (`data-testid="profile-save-button"`)
- Cancel button (`data-testid="profile-cancel-button"`)

**API Integration**: `GET /users/me`, `PUT /users/me`

---

## ProtectedRoute

**Purpose**: HOC/wrapper that redirects unauthenticated users to `/login`.

**Props**: `{ requiredRole?: Role, children: ReactNode }`

**Behavior**:
- If not authenticated: redirect to `/login?redirect={currentPath}`
- If authenticated but wrong role: redirect to `/403`
- Otherwise: render children

---

## Shared UI Components (Unit 1 establishes)

| Component | Purpose | data-testid pattern |
|---|---|---|
| `Button` | Styled button with loading state | `{context}-button` |
| `Input` | Styled text input with error display | `{context}-input` |
| `FormError` | Inline form error message | `{context}-error` |
| `LoadingSpinner` | Full-page or inline loading indicator | `loading-spinner` |
| `RoleBadge` | Colored badge showing user role | `role-badge` |
| `PageLayout` | Consistent page padding/max-width | — |

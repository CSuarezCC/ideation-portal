# Business Logic Model — Unit 1: Foundation

## 1. Registration Flow

```
Input: { email, password, name, department? }

1. Validate email format → error if invalid
2. Validate password complexity → error if fails
3. Call Cognito: AdminCreateUser or SignUp
   → On Cognito error: return error to caller
4. Write User record to DynamoDB:
   { userId: cognitoSub, email, name, department, role: EMPLOYEE, status: ACTIVE, createdAt, updatedAt }
   → On DynamoDB error: log + retry (up to 3 times with exponential backoff)
5. Return { userId, message: "Confirmation email sent" }
```

## 2. Account Confirmation Flow

```
Input: { email, confirmationCode }

1. Call Cognito: ConfirmSignUp(email, confirmationCode)
   → On error (expired/invalid code): return error
2. Return { success: true }
```

## 3. Login Flow

```
Input: { email, password }

1. Call Cognito: InitiateAuth (USER_PASSWORD_AUTH)
   → On error (wrong credentials, unconfirmed, disabled): return appropriate error
2. Extract tokens from Cognito response
3. Return { accessToken, refreshToken, idToken }
```

## 4. Token Refresh Flow

```
Input: { refreshToken }

1. Call Cognito: InitiateAuth (REFRESH_TOKEN_AUTH)
   → On error (expired/invalid): return 401
2. Return { accessToken }
```

## 5. Password Reset Flow

```
Initiate:
Input: { email }
1. Call Cognito: ForgotPassword(email)
   → Always return success (do not reveal if email exists)
2. Return { message: "If the email exists, a reset code has been sent" }

Confirm:
Input: { email, code, newPassword }
1. Validate newPassword complexity
2. Call Cognito: ConfirmForgotPassword(email, code, newPassword)
   → On error: return error
3. Call Cognito: AdminUserGlobalSignOut(email) — invalidate all sessions
4. Return { success: true }
```

## 6. Lambda Authorizer Flow

```
Input: Bearer token from Authorization header

1. Extract token from header → 401 if missing
2. Verify JWT signature using Cognito JWKS endpoint
3. Validate: expiry, issuer (Cognito User Pool URL), audience (App Client ID)
   → 401 if any validation fails
4. Extract claims: sub (userId), email, custom:role
5. Return IAM policy: Allow + context { userId, email, role }
```

## 7. Get User Profile Flow

```
Input: { userId } (from AuthContext)

1. Query DynamoDB Users table by userId (PK)
   → 404 if not found
2. Return UserProfile (exclude sensitive fields)
```

## 8. Update User Profile Flow

```
Input: { userId } (from AuthContext), { name?, department?, avatarUrl? }

1. Validate requesting userId matches target userId (or is ADMIN)
2. Build update expression for provided fields only
3. Update DynamoDB Users table
4. Return updated UserProfile
```

## 9. Assign Role Flow

```
Input: requestingAdminId (from AuthContext), { targetUserId, newRole }

1. Verify requestingAdminId has role = ADMIN → 403 if not
2. Verify targetUserId != requestingAdminId → 400 (cannot change own role)
3. Fetch target user from DynamoDB → 404 if not found
4. Update Cognito: AdminUpdateUserAttributes(targetUserId, custom:role = newRole)
5. Update DynamoDB Users table: { role: newRole, updatedAt }
6. Return { success: true }
```

## 10. Deactivate User Flow

```
Input: requestingAdminId (from AuthContext), { targetUserId }

1. Verify requestingAdminId has role = ADMIN → 403 if not
2. Verify targetUserId != requestingAdminId → 400 (cannot deactivate self)
3. Fetch target user from DynamoDB → 404 if not found
4. Call Cognito: AdminDisableUser(targetUserId)
5. Update DynamoDB Users table: { status: INACTIVE, updatedAt }
6. Return { success: true }
```

## 11. List Users Flow

```
Input: requestingAdminId (from AuthContext), { roleFilter?, page, pageSize }

1. Verify requestingAdminId has role = ADMIN → 403 if not
2. Query DynamoDB Users table:
   - If roleFilter: use GSI on role attribute
   - Paginate using LastEvaluatedKey
3. Return { users: UserProfile[], total, nextPage? }
```

---

## Shared Middleware Logic

### JWT Validation Middleware (Lambda Authorizer)
- Fetches Cognito JWKS on cold start, caches in-memory for Lambda lifetime
- Validates token on every invocation (no DB lookup needed — all claims in JWT)

### RBAC Middleware (per-handler)
- Reads `role` from Lambda request context (injected by Authorizer)
- Compares against required role for the route
- Returns 403 if insufficient role

### DynamoDB Client Wrapper
- Wraps AWS SDK DynamoDB DocumentClient
- Provides typed `get`, `put`, `update`, `query`, `scan` helpers
- Handles marshalling/unmarshalling automatically

### EventBridge Publisher Wrapper
- Wraps AWS SDK EventBridge client
- Provides `publish(eventType, detail)` helper
- Sets source = `ideation-portal`, detail-type = eventType
- Used by Units 2, 3, 4, 7

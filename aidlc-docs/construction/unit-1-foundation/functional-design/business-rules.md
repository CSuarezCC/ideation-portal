# Business Rules — Unit 1: Foundation

## Authentication Rules

### BR-AUTH-01: Registration
- Email must be a valid email format
- Password must meet minimum complexity: 8+ characters, at least one uppercase, one lowercase, one digit
- On successful registration, user is created in Cognito User Pool with status UNCONFIRMED
- A confirmation code is sent to the provided email
- User record is created in DynamoDB `Users` table with role = EMPLOYEE and status = ACTIVE
- If Cognito registration succeeds but DynamoDB write fails, the DynamoDB write must be retried (eventual consistency acceptable)

### BR-AUTH-02: Account Confirmation
- User must confirm their account using the code sent to their email before they can log in
- Confirmation codes expire after 24 hours
- A new confirmation code can be requested if the original expires

### BR-AUTH-03: Login
- Only CONFIRMED Cognito accounts may log in
- INACTIVE users (disabled in Cognito) receive an authentication error
- Successful login returns accessToken, refreshToken, and idToken
- The `custom:role` attribute in Cognito must match the role stored in DynamoDB `Users` table

### BR-AUTH-04: Token Refresh
- A valid, non-expired refresh token is required
- Returns a new accessToken only (refreshToken remains the same)
- If refresh token is expired or revoked, user must log in again

### BR-AUTH-05: Password Reset
- Any registered user may initiate a password reset using their email
- A reset code is sent to the email (valid for 1 hour)
- New password must meet the same complexity requirements as registration
- After successful reset, all existing sessions are invalidated (Cognito global sign-out)

### BR-AUTH-06: Lambda Authorizer
- Every protected API route requires a valid Bearer token in the `Authorization` header
- Authorizer validates token signature, expiry, and issuer against the Cognito User Pool
- On success: injects `userId`, `email`, `role` into the Lambda request context
- On failure: returns HTTP 401 Unauthorized
- Authorizer result is cached for 5 minutes (API Gateway authorizer cache TTL)

---

## User Management Rules

### BR-USER-01: Profile Update
- A user may only update their own profile (name, department, avatarUrl)
- userId and email are immutable after registration
- role and status may only be changed by an ADMIN

### BR-USER-02: Role Assignment
- Only ADMIN may assign or change roles
- Valid role transitions: any role → any other role (no restrictions on transitions)
- When an Admin changes a user's role, the `custom:role` attribute in Cognito must also be updated
- Role change takes effect on the user's next login (existing tokens retain old role until expiry)
- An Admin cannot change their own role (prevents accidental self-demotion)

### BR-USER-03: User Deactivation
- Only ADMIN may deactivate a user
- Deactivation disables the Cognito account (user cannot log in)
- Deactivation sets `status = INACTIVE` in DynamoDB
- A user cannot deactivate themselves
- Deactivated users' existing data (ideas, evaluations) is retained

### BR-USER-04: User Listing
- Only ADMIN may list all users
- Results are paginated (default page size: 20)
- Filtering by role is supported

---

## RBAC Enforcement Rules

### BR-RBAC-01: Route-Level Enforcement
- All protected routes enforce role at the Lambda handler level (not just the Authorizer)
- Authorizer only validates token validity — role enforcement is the handler's responsibility
- Unauthorized role access returns HTTP 403 Forbidden

### BR-RBAC-02: Role Hierarchy
- ADMIN has all capabilities of PANEL_MEMBER and EMPLOYEE
- PANEL_MEMBER has all capabilities of EMPLOYEE
- EMPLOYEE has the most restricted access

### BR-RBAC-03: Self-Access
- Any authenticated user may read and update their own profile regardless of role

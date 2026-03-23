# Domain Entities — Unit 1: Foundation

## User

```
User {
  userId: string (PK — Cognito sub)
  email: string (unique)
  name: string
  department: string (optional)
  avatarUrl: string (optional)
  role: enum { EMPLOYEE, PANEL_MEMBER, ADMIN }
  status: enum { ACTIVE, INACTIVE }
  createdAt: ISO8601 timestamp
  updatedAt: ISO8601 timestamp
}
```

**Business Rules**:
- userId is the Cognito User Pool `sub` claim — immutable after creation
- email must be unique across all users
- Default role on registration: EMPLOYEE
- Only ADMIN can change role or deactivate a user
- A deactivated user cannot log in (Cognito account disabled)
- A user cannot deactivate themselves

---

## Session / Token

Not persisted in DynamoDB — managed entirely by Cognito.

```
TokenSet {
  accessToken: JWT (short-lived, 1 hour)
  refreshToken: opaque string (long-lived, 30 days)
  idToken: JWT (contains user claims: sub, email, custom:role)
}
```

**Business Rules**:
- Access token carries `userId`, `email`, `role` as JWT claims
- Lambda Authorizer validates access token on every protected API call
- Refresh token used to obtain new access token without re-login
- On role change, existing tokens remain valid until expiry (role change takes effect on next login)

---

## AuthContext (request-scoped, not persisted)

Injected by Lambda Authorizer into every protected Lambda invocation:

```
AuthContext {
  userId: string
  email: string
  role: enum { EMPLOYEE, PANEL_MEMBER, ADMIN }
}
```

---

## Entity Relationships (Unit 1 scope)

```
Cognito User Pool
    |
    | (userId = Cognito sub)
    v
User (DynamoDB)
    |
    | (userId referenced by all other entities in later units)
    v
[Ideas, Evaluations, Campaigns, Notifications — defined in later units]
```

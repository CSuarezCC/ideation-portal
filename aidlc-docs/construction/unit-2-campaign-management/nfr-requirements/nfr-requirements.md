# NFR Requirements — Unit 2: Campaign & Category Management

## Performance

| Requirement | Target | Notes |
|---|---|---|
| Campaign CRUD API response | < 500ms (p95) | Single DynamoDB read/write per operation |
| List campaigns | < 1s (p95) | GSI query by status with pagination |
| Lazy status transition | < 200ms overhead | Inline date check + conditional update on read path |
| Category CRUD API response | < 500ms (p95) | Single DynamoDB read/write per operation |
| Panel member assignment | < 500ms (p95) | Single DynamoDB update on campaign record |

## Scalability

| Requirement | Target | Notes |
|---|---|---|
| Concurrent campaign reads | 500–5,000 | Lambda auto-scales; DynamoDB on-demand handles burst |
| Campaign count | Hundreds over portal lifetime | Low cardinality — no partition hot-spotting concern |
| Category count | Up to 100 active categories | Low cardinality — single scan is acceptable |

## Availability

| Requirement | Target | Notes |
|---|---|---|
| Uptime | 99.9% | Inherited from Unit 1 managed services |
| Graceful degradation | Required | If lazy transition fails, return campaign with current status; retry on next read |

## Security

| Requirement | Approach |
|---|---|
| Admin-only mutations | RBAC enforced server-side via requireRole('Admin') middleware |
| Read access | All authenticated users can read campaigns and categories |
| Panel member visibility | Admin and PanelMember roles can view panel assignments |
| Input validation | Server-side validation on all fields before DynamoDB writes |

## Reliability

| Requirement | Approach |
|---|---|
| Lazy transition atomicity | Use DynamoDB conditional update (ConditionExpression on current status) to prevent race conditions |
| EventBridge publish retry | Use shared withRetry() from Unit 1 for event publishing |
| Idempotent transitions | Conditional update ensures transition only fires once even under concurrent reads |

## Maintainability

| Requirement | Approach |
|---|---|
| Shared patterns | Reuse Unit 1 shared middleware (authorizer, RBAC), DB client, EventBridge client, error utilities |
| Handler structure | Same pattern as Unit 1 — one handler per Lambda, structured error responses |
| Type safety | Campaign and Category types added to shared types |

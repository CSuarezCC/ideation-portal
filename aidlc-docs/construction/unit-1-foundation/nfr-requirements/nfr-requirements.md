# NFR Requirements — Unit 1: Foundation

## Performance

| Requirement | Target | Notes |
|---|---|---|
| Login API response time | < 1s (p95) | Cognito auth is the bottleneck; no DB read on login path |
| Register API response time | < 2s (p95) | Cognito + DynamoDB write |
| Token validation (Lambda Authorizer) | < 100ms (p95) | In-memory JWKS cache after cold start |
| Lambda cold start | < 1s | Keep handler bundles small; use Lambda SnapStart if needed |
| Profile read/write | < 500ms (p95) | Single DynamoDB GetItem/UpdateItem |

## Scalability

| Requirement | Target | Notes |
|---|---|---|
| Concurrent users | 500–5,000 | Lambda auto-scales; no pre-provisioning needed |
| DynamoDB throughput | On-demand capacity | Auto-scales with traffic spikes |
| Cognito User Pool | Supports 40,000 req/s by default | Well within medium org scale |
| Lambda Authorizer cache | 5-minute TTL | Reduces Authorizer invocations under load |

## Availability

| Requirement | Target | Notes |
|---|---|---|
| Uptime | 99.9% | Achieved via AWS managed services (Lambda, Cognito, DynamoDB, API Gateway) |
| No single point of failure | Required | All services are multi-AZ by default |
| Graceful degradation | Required | Auth failures return clear error messages; no silent failures |

## Security

| Requirement | Approach |
|---|---|
| Password storage | Cognito manages hashing (SRP protocol) — never stored in DynamoDB |
| Token security | JWT signed by Cognito RS256; validated on every request |
| HTTPS only | Enforced by API Gateway and CloudFront |
| Role enforcement | Server-side at handler level; never trust client-provided role |
| Sensitive data in logs | Never log passwords, tokens, or full user objects |
| CORS | API Gateway CORS configured to allow only the CloudFront domain |

## Reliability

| Requirement | Approach |
|---|---|
| DynamoDB write retry | Up to 3 retries with exponential backoff on registration |
| Idempotent registration | If Cognito succeeds but DynamoDB fails, retry is safe (upsert by userId) |
| Error responses | All errors return structured JSON: `{ error: string, code: string }` |

## Maintainability

| Requirement | Approach |
|---|---|
| TypeScript strict mode | All backend and frontend code uses TypeScript strict |
| Shared types | `backend/src/shared/types/` defines all shared interfaces |
| Environment config | All config (Cognito Pool ID, Table names) via Lambda environment variables |
| No hardcoded values | All resource names injected via SAM template environment variables |

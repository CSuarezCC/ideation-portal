# NFR Requirements — Unit 3: Idea Submission

## Performance

| Requirement | Target | Notes |
|---|---|---|
| Draft CRUD API response | < 500ms (p95) | Single DynamoDB read/write |
| Auto-save API response | < 300ms (p95) | Lightweight partial update, no validation |
| Submit idea API response | < 1s (p95) | Validation + DynamoDB write + EventBridge publish |
| List ideas API response | < 1s (p95) | GSI query with pagination |
| S3 pre-signed URL generation | < 200ms (p95) | No S3 data transfer, just URL signing |
| File upload (client→S3) | Depends on file size | Direct client-to-S3 via pre-signed URL, bypasses Lambda |

## Scalability

| Requirement | Target | Notes |
|---|---|---|
| Concurrent draft saves | 500–5,000 | Lambda auto-scales; DynamoDB on-demand |
| Ideas per campaign | Thousands | GSI campaignId-status-index handles efficiently |
| Attachments per idea | Max 5, 10MB each | S3 handles unlimited storage; pre-signed URLs avoid Lambda bottleneck |

## Availability

| Requirement | Target | Notes |
|---|---|---|
| Uptime | 99.9% | Inherited from managed services |
| Auto-save resilience | Best-effort | If auto-save fails, user retains data in browser; next auto-save retries |

## Security

| Requirement | Approach |
|---|---|
| Draft ownership | Server-side check: submitterId must match authenticated userId |
| Idea visibility | Server-side filtering based on role and idea status (BR-I08) |
| S3 pre-signed URLs | PUT URLs expire after 15 minutes; scoped to specific S3 key |
| Attachment access | Read access via pre-signed GET URLs generated on demand |

## Reliability

| Requirement | Approach |
|---|---|
| Auto-save failure | Silent failure on client; retry on next 30s interval |
| Submit atomicity | DynamoDB write + EventBridge publish; if event fails, idea is still SUBMITTED (event can be retried) |
| S3 upload failure | Client retries; attachment not recorded until upload confirmed |

## Maintainability

| Requirement | Approach |
|---|---|
| Shared patterns | Reuse Unit 1 shared middleware, DB client, EventBridge client, error utilities |
| Idea types | Added to shared types (Idea, IdeaStatus, Attachment interfaces) |

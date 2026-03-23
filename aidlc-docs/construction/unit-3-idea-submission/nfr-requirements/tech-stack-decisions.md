# Tech Stack Decisions — Unit 3: Idea Submission

## Inherited from Units 1-2

All tech stack decisions carry forward. Unit 3 introduces no new technologies.

| Concern | Choice | Source |
|---|---|---|
| Runtime | Node.js 22.14.0 (Lambda) | Unit 1 |
| DynamoDB client | AWS SDK v3 | Unit 1 |
| S3 client | @aws-sdk/s3-request-presigner + @aws-sdk/client-s3 | Unit 1 (bucket provisioned) |
| EventBridge client | AWS SDK v3 | Unit 1 |
| Frontend | React 18 + Vite + Tailwind | Unit 1 |
| ID generation | ULID | Unit 1 |

## Unit 3-Specific Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Pre-signed URL expiry | 15 minutes | Sufficient for upload; short enough to limit exposure |
| Pre-signed URL scope | PUT only, specific key | Prevents unauthorized writes to other keys |
| Auto-save interval | 30 seconds (frontend timer) | Per NFR-07; balances UX with API load |
| Auto-save conflict | Last-write-wins | Simplest approach; acceptable for single-user drafts |
| Attachment storage path | `ideas/{ideaId}/{ulid}-{fileName}` | Organized by idea; ULID prefix prevents collisions |
| Max file size | 10MB | Reasonable for documents; enforced via pre-signed URL conditions |

## DynamoDB Access Patterns — Unit 3

| Access Pattern | Key/Index | Operation |
|---|---|---|
| Get idea by ID | PK: ideaId | GetItem |
| Get user's ideas | GSI: submitterId-index | Query |
| List ideas by campaign+status | GSI: campaignId-status-index | Query |
| Create/update draft | PK: ideaId | PutItem/UpdateItem |
| Delete draft | PK: ideaId | DeleteItem |

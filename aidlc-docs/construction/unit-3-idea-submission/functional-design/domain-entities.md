# Domain Entities — Unit 3: Idea Submission

## Idea Entity

| Field | Type | Required | Description |
|---|---|---|---|
| ideaId | string (ULID) | Yes | Unique identifier |
| title | string | Yes | Idea title |
| description | string | Yes | Problem statement / description |
| solution | string | Yes | Proposed solution |
| benefits | string | Yes | Expected benefits |
| categoryIds | string[] | Yes | One or more category IDs (multi-select) |
| campaignId | string | Yes | Campaign the idea is submitted to |
| submitterId | string | Yes | UserId of the submitter |
| status | IdeaStatus | Yes | Current lifecycle status |
| attachments | Attachment[] | Yes | File attachment metadata (max 5) |
| createdAt | string (ISO 8601) | Yes | Creation timestamp |
| updatedAt | string (ISO 8601) | Yes | Last update / auto-save timestamp |
| submittedAt | string (ISO 8601) | No | Submission timestamp (null while draft) |

### IdeaStatus Enum

| Value | Description |
|---|---|
| DRAFT | Saved but not submitted |
| SUBMITTED | Submitted to active campaign |
| UNDER_REVIEW | Campaign in evaluation phase |
| EVALUATED | All panel members have scored |
| WINNER | Top 3 idea (set by Recognition) |

### Attachment Type

| Field | Type | Description |
|---|---|---|
| fileKey | string | S3 object key |
| fileName | string | Original file name |
| fileSize | number | File size in bytes |
| contentType | string | MIME type |
| uploadedAt | string (ISO 8601) | Upload timestamp |

---

## DynamoDB Table Design

### Ideas Table
- **Partition Key**: `ideaId` (string)
- **GSI-1**: `submitterId-index` — PK: `submitterId` (get user's own ideas)
- **GSI-2**: `campaignId-status-index` — PK: `campaignId`, SK: `status` (list ideas by campaign and status)

### Attachment Constraints
- Max 5 attachments per idea
- Max 10MB per file
- Any document type allowed
- Stored in S3 `AttachmentsBucket` under key: `ideas/{ideaId}/{fileKey}`

# Domain Entities — Unit 2: Campaign & Category Management

## Campaign Entity

| Field | Type | Required | Description |
|---|---|---|---|
| campaignId | string (ULID) | Yes | Unique identifier |
| name | string | Yes | Campaign display name |
| description | string | Yes | Campaign description/purpose |
| submissionStartDate | string (ISO 8601) | Yes | When submissions open |
| submissionEndDate | string (ISO 8601) | Yes | When submissions close |
| evaluationStartDate | string (ISO 8601) | Yes | When evaluation period begins |
| evaluationEndDate | string (ISO 8601) | Yes | When evaluation period ends |
| status | CampaignStatus | Yes | Current lifecycle status |
| panelMemberIds | string[] | Yes | Assigned panel member user IDs |
| createdBy | string | Yes | Admin userId who created |
| createdAt | string (ISO 8601) | Yes | Creation timestamp |
| updatedAt | string (ISO 8601) | Yes | Last update timestamp |
| deletedAt | string (ISO 8601) | No | Soft delete timestamp (null if active) |

### CampaignStatus Enum

| Value | Description |
|---|---|
| DRAFT | Created but not yet scheduled |
| ACTIVE | Submissions open |
| EVALUATION | Submission closed, evaluation in progress |
| CLOSED | Evaluation complete, awaiting recognition |
| ANNOUNCED | Winners announced |

---

## Category Entity

| Field | Type | Required | Description |
|---|---|---|---|
| categoryId | string (ULID) | Yes | Unique identifier |
| name | string | Yes | Category display name |
| description | string | No | Category description |
| isActive | boolean | Yes | Whether category is available for use |
| createdBy | string | Yes | Admin userId who created |
| createdAt | string (ISO 8601) | Yes | Creation timestamp |
| updatedAt | string (ISO 8601) | Yes | Last update timestamp |

---

## CampaignPanelAssignment (Denormalized in Campaign)

Panel member assignments are stored as `panelMemberIds[]` on the Campaign entity. No separate entity needed — the assignment is a simple array of userIds on the campaign record.

---

## DynamoDB Table Design

### Campaigns Table
- **Partition Key**: `campaignId` (string)
- **GSI-1**: `status-createdAt-index` — PK: `status`, SK: `createdAt` (query campaigns by status, sorted by date)

### Categories Table
- **Partition Key**: `categoryId` (string)
- **GSI-1**: `isActive-name-index` — PK: `isActive` (string "true"/"false"), SK: `name` (list active categories alphabetically)

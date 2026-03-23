# Tech Stack Decisions — Unit 7: Recognition System

## Inherited from Units 1-6

All tech stack decisions carry forward. Unit 7 introduces no new technologies.

| Concern | Choice | Source |
|---|---|---|
| Runtime | Node.js 22.14.0 (Lambda) | Unit 1 |
| DynamoDB client | AWS SDK v3 | Unit 1 |
| EventBridge client | AWS SDK v3 | Unit 1 |
| Frontend | React 18 + Vite + Tailwind | Unit 1 |
| ID generation | ULID | Unit 1 |

## Unit 7-Specific Decisions

| Concern | Choice | Rationale |
|---|---|---|
| RecognitionTable key design | PK: campaignId, SK: `IDEA#{ideaId}` or `ANNOUNCEMENT` | Single-table per campaign; winners and announcement co-located |
| Winner sort key prefix | `IDEA#` | Enables begins_with query to fetch all winners for a campaign |
| Announcement sort key | Fixed `ANNOUNCEMENT` | Single announcement per campaign; direct GetItem access |
| Event publishing | EventBridge PutEvents | Consistent with Units 2-4 event patterns |
| Campaign status update | Direct DynamoDB UpdateItem on CampaignsTable | Transition CLOSED → ANNOUNCED |
| Idea status update | Batch UpdateItem on IdeasTable | Set status to WINNER for top 3 ideas |

## DynamoDB Access Patterns — Unit 7

| Access Pattern | Table | Key/Index | Operation |
|---|---|---|---|
| Get top 3 scores for campaign | AggregatedScores | campaignId-compositeScore-index (desc) | Query (Limit: 3) |
| Write winner records | Recognition | PK: campaignId, SK: IDEA#{ideaId} | PutItem × 3 |
| Write announcement | Recognition | PK: campaignId, SK: ANNOUNCEMENT | PutItem |
| Get winners for campaign | Recognition | PK: campaignId, SK begins_with IDEA# | Query |
| Get announcement | Recognition | PK: campaignId, SK: ANNOUNCEMENT | GetItem |
| Check winners exist (idempotency) | Recognition | PK: campaignId, SK begins_with IDEA# | Query (Limit: 1) |
| Update campaign status | Campaigns | PK: campaignId | UpdateItem |
| Update idea status to WINNER | Ideas | PK: ideaId | UpdateItem × 3 |

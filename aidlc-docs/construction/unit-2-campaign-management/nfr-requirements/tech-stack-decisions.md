# Tech Stack Decisions — Unit 2: Campaign & Category Management

## Inherited from Unit 1

All tech stack decisions from Unit 1 carry forward. Unit 2 introduces no new technologies.

| Concern | Choice | Source |
|---|---|---|
| Runtime | Node.js 22.14.0 (Lambda) | Unit 1 |
| Language | TypeScript (strict) | Unit 1 |
| DynamoDB client | AWS SDK v3 | Unit 1 |
| EventBridge client | AWS SDK v3 | Unit 1 |
| Frontend framework | React 18 + Vite + Tailwind | Unit 1 |
| HTTP client | Axios | Unit 1 |
| Form handling | React Hook Form | Unit 1 |
| Testing | Jest (backend), Vitest (frontend) | Unit 1 |

## Unit 2-Specific Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Lazy transition strategy | Inline check on read path | Avoids scheduled Lambda; transitions happen promptly on any campaign read; DynamoDB conditional update prevents race conditions |
| Date library | Native Date/ISO 8601 strings | No external date library needed; all dates stored as ISO 8601 strings, compared as strings |
| ID generation | ULID (ulid package) | Sortable, unique, URL-safe; consistent with Unit 1 pattern |

## DynamoDB Access Patterns — Unit 2

### Campaigns Table
| Access Pattern | Key/Index | Operation |
|---|---|---|
| Get campaign by ID | PK: campaignId | GetItem |
| List campaigns by status | GSI: status-createdAt-index | Query |
| Get active campaign | GSI: status-createdAt-index (status=ACTIVE) | Query (limit 1) |
| Update campaign | PK: campaignId | UpdateItem |
| Soft delete campaign | PK: campaignId | UpdateItem (set deletedAt) |

### Categories Table
| Access Pattern | Key/Index | Operation |
|---|---|---|
| Get category by ID | PK: categoryId | GetItem |
| List active categories | GSI: isActive-name-index (isActive="true") | Query |
| List all categories | Scan | Scan (acceptable — low cardinality) |
| Update category | PK: categoryId | UpdateItem |

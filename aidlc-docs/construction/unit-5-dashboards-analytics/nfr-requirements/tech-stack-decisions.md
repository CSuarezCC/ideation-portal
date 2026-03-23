# Tech Stack Decisions — Unit 5: Dashboards, Leaderboard & Analytics

## Inherited from Units 1-4

All tech stack decisions carry forward. Unit 5 introduces one new frontend dependency.

| Concern | Choice | Source |
|---|---|---|
| Runtime | Node.js 22.14.0 (Lambda) | Unit 1 |
| DynamoDB client | AWS SDK v3 | Unit 1 |
| Frontend | React 18 + Vite + Tailwind | Unit 1 |
| ID generation | ULID | Unit 1 |

## Unit 5-Specific Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Charting library | Recharts | User selected (Q5:B); React-native, composable, lightweight |
| Leaderboard sorting (non-composite) | In-memory sort in Lambda | DynamoDB GSI only supports one sort key; sorting by alternate dimensions requires fetching all + sorting in Lambda. Acceptable for campaign-scoped data (hundreds to low thousands of ideas) |
| Search implementation | In-memory keyword filter | DynamoDB lacks full-text search; campaign-scoped scan + contains filter is acceptable at this scale. No ElasticSearch needed |
| User name resolution | Batch GetItem from UsersTable | Resolve submitter names at query time rather than denormalizing — keeps data consistent, acceptable latency |
| Leaderboard pagination | None (load all) | User selected (Q6:B); campaign-scoped data is bounded |
| Campaign default selection | Most recent Evaluation/Closed campaign | Sensible default; user can switch via dropdown |

## DynamoDB Access Patterns — Unit 5

| Access Pattern | Table | Key/Index | Operation |
|---|---|---|---|
| Leaderboard by composite score | AggregatedScores | GSI: campaignId-compositeScore-index | Query (desc) |
| All aggregated scores for campaign | AggregatedScores | GSI: campaignId-compositeScore-index | Query |
| Aggregated score for idea | AggregatedScores | PK: ideaId | GetItem |
| Ideas by campaign (non-draft) | Ideas | GSI: campaignId-status-index | Query |
| Idea by ID | Ideas | PK: ideaId | GetItem |
| User by ID | Users | PK: userId | GetItem |
| Campaign by ID | Campaigns | PK: campaignId | GetItem |
| List campaigns | Campaigns | Scan or GSI | Query/Scan |
| Panel members for campaign | Campaigns | PK: campaignId | GetItem (panelMemberIds field) |

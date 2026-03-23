# Tech Stack Decisions — Unit 4: Evaluation Engine

## Inherited from Units 1-3

All tech stack decisions carry forward. Unit 4 introduces no new technologies.

| Concern | Choice | Source |
|---|---|---|
| Runtime | Node.js 22.14.0 (Lambda) | Unit 1 |
| DynamoDB client | AWS SDK v3 | Unit 1 |
| EventBridge client | AWS SDK v3 | Unit 1 |
| Frontend | React 18 + Vite + Tailwind | Unit 1 |
| ID generation | ULID | Unit 1 |

## Unit 4-Specific Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Aggregation timing | Synchronous in submitEvaluation handler | Aggregation is lightweight math (≤50 scores); avoids async complexity |
| Anonymized scores storage | Pre-computed in AggregatedScore record | Faster reads; avoids re-querying Evaluations table on every summary view |
| Anonymization approach | Shuffle evaluations, assign index 1..N | Prevents correlation with submission order |
| Score rounding | 2 decimal places | Sufficient precision for averages |
| Duplicate aggregation guard | DynamoDB conditional write (attribute_not_exists) | Prevents race condition if two panel members submit simultaneously |
| Evaluation queue join | In-Lambda join of two DynamoDB queries | Simpler than denormalization; acceptable latency for ≤ thousands of ideas |

## DynamoDB Access Patterns — Unit 4

| Access Pattern | Table | Key/Index | Operation |
|---|---|---|---|
| Get evaluation by idea+panelMember | Evaluations | PK: ideaId, SK: panelMemberId | GetItem |
| Get all evaluations for an idea | Evaluations | PK: ideaId | Query |
| Get all evaluations by panel member | Evaluations | GSI: panelMemberId-index | Query |
| Save/update evaluation | Evaluations | PK: ideaId, SK: panelMemberId | PutItem |
| Get aggregated score by idea | AggregatedScores | PK: ideaId | GetItem |
| Write aggregated score | AggregatedScores | PK: ideaId | PutItem (conditional) |
| Leaderboard by campaign | AggregatedScores | GSI: campaignId-compositeScore-index | Query (ScanIndexForward: false) |
| Get submitted ideas for campaign | Ideas | GSI: campaignId-status-index | Query |

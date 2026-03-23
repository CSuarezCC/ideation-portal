# Domain Entities — Unit 5: Dashboards, Leaderboard & Analytics

> Unit 5 is a **read-only** unit. It does not create or modify any data — it queries existing tables (Ideas, AggregatedScores, Evaluations, Campaigns) and computes views.

## LeaderboardEntry (read model)

Computed at query time from AggregatedScores + Ideas tables.

| Field | Type | Description |
|---|---|---|
| ideaId | string | Idea identifier |
| title | string | Idea title |
| submitterName | string \| null | Author name — null for Employees (anonymized per Q1:B) |
| submitterId | string | Used for role-based name resolution |
| campaignId | string | Campaign the idea belongs to |
| categoryIds | string[] | Idea categories |
| compositeScore | number | Average of 3 dimension averages |
| feasibilityAvg | number | Average feasibility score |
| impactAvg | number | Average impact score |
| innovationAvg | number | Average innovation score |
| totalEvaluations | number | Number of panel members who scored |
| submittedAt | string (ISO 8601) | Idea submission timestamp |

---

## IdeaDetail (read model)

Extended view for idea detail modal/page. Role-dependent fields.

| Field | Type | Description |
|---|---|---|
| ideaId | string | |
| title | string | |
| description | string | |
| solution | string | |
| benefits | string | |
| categoryIds | string[] | |
| campaignId | string | |
| submitterName | string \| null | Anonymized for Employees |
| status | IdeaStatus | |
| compositeScore | number \| null | null if not yet aggregated |
| feasibilityAvg | number \| null | |
| impactAvg | number \| null | |
| innovationAvg | number \| null | |
| totalEvaluations | number \| null | |
| evaluations | AnonymizedEvaluation[] \| null | Only for Admin/Panel Member |
| submittedAt | string | |

---

## TopIdea (read model — analytics)

| Field | Type | Description |
|---|---|---|
| ideaId | string | |
| title | string | |
| submitterName | string | Always visible (analytics is Admin/Panel only) |
| compositeScore | number | |
| feasibilityAvg | number | |
| impactAvg | number | |
| innovationAvg | number | |
| totalEvaluations | number | |

---

## ParticipationMetrics (read model — analytics)

| Field | Type | Description |
|---|---|---|
| campaignId | string | |
| totalIdeasSubmitted | number | Count of ideas with status >= SUBMITTED |
| totalIdeasEvaluated | number | Count of ideas with AggregatedScore |
| totalIdeasPending | number | Submitted but not yet fully evaluated |
| totalPanelMembers | number | Panel members assigned to campaign |
| averageCompositeScore | number | Average composite across all evaluated ideas |

---

## ScoreDistribution (read model — analytics)

| Field | Type | Description |
|---|---|---|
| campaignId | string | |
| dimension | string | 'feasibility' \| 'impact' \| 'innovation' \| 'composite' |
| buckets | ScoreBucket[] | Histogram buckets |

### ScoreBucket

| Field | Type | Description |
|---|---|---|
| rangeLabel | string | e.g., "1-2", "3-4", "5-6", "7-8", "9-10" |
| count | number | Number of ideas in this range |

---

## ComparativeData (read model — analytics)

| Field | Type | Description |
|---|---|---|
| campaignId | string | |
| ideas | ComparativeIdeaRow[] | All evaluated ideas with per-dimension scores |

### ComparativeIdeaRow

| Field | Type | Description |
|---|---|---|
| ideaId | string | |
| title | string | |
| feasibilityAvg | number | |
| impactAvg | number | |
| innovationAvg | number | |
| compositeScore | number | |

---

## CampaignSummary (read model — analytics)

| Field | Type | Description |
|---|---|---|
| campaignId | string | |
| campaignName | string | |
| status | CampaignStatus | |
| participation | ParticipationMetrics | Embedded |
| topIdeas | TopIdea[] | Top N ideas |
| scoreDistribution | ScoreDistribution[] | One per dimension |

---

## No New DynamoDB Tables

Unit 5 queries existing tables only:
- **IdeasTable** — idea metadata (GSI: `campaignId-status-index`)
- **AggregatedScoresTable** — scores (GSI: `campaignId-compositeScore-index`)
- **EvaluationsTable** — individual evaluations (for pending count)
- **CampaignsTable** — campaign metadata
- **UsersTable** — submitter name resolution

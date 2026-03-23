# Domain Entities — Unit 4: Evaluation Engine

## Evaluation

Represents a single Panel Member's scoring of a single idea.

| Field | Type | Description |
|---|---|---|
| ideaId | string (PK) | The idea being evaluated |
| panelMemberId | string (SK) | The panel member who scored |
| campaignId | string | Campaign the idea belongs to |
| status | EvaluationStatus | DRAFT or SUBMITTED |
| feasibilityScore | number (1-10) | null if not yet scored |
| impactScore | number (1-10) | null if not yet scored |
| innovationScore | number (1-10) | null if not yet scored |
| feasibilityJustification | string | Required on submit |
| impactJustification | string | Required on submit |
| innovationJustification | string | Required on submit |
| createdAt | string (ISO 8601) | First save timestamp |
| updatedAt | string (ISO 8601) | Last update timestamp |
| submittedAt | string (ISO 8601) | null until submitted |

**EvaluationStatus**: `DRAFT` | `SUBMITTED`

**Key**: `ideaId` (HASH) + `panelMemberId` (RANGE) — one evaluation per panel member per idea.

**GSI**: `panelMemberId-index` — query all evaluations by a panel member.

---

## AggregatedScore

Stores the computed average scores for an idea after all panel members have submitted.

| Field | Type | Description |
|---|---|---|
| ideaId | string (PK) | The idea |
| campaignId | string | Campaign (GSI hash key) |
| feasibilityAvg | number | Average feasibility score |
| impactAvg | number | Average impact score |
| innovationAvg | number | Average innovation score |
| compositeScore | number (GSI sort key) | Average of the 3 dimension averages |
| totalEvaluations | number | Count of panel members who scored |
| evaluations | AnonymizedEvaluation[] | Anonymized individual scores + justifications |
| calculatedAt | string (ISO 8601) | When aggregation ran |

**Key**: `ideaId` (HASH)

**GSI**: `campaignId-compositeScore-index` — leaderboard queries sorted by composite score.

---

## AnonymizedEvaluation (embedded in AggregatedScore)

| Field | Type | Description |
|---|---|---|
| evaluatorIndex | number | Anonymous index (1, 2, 3...) |
| feasibilityScore | number | |
| impactScore | number | |
| innovationScore | number | |
| feasibilityJustification | string | |
| impactJustification | string | |
| innovationJustification | string | |

---

## IdeaEvalStatus (read model for evaluation queue)

Not a stored entity — computed at query time by joining idea data with evaluation status.

| Field | Type | Description |
|---|---|---|
| ideaId | string | |
| title | string | |
| description | string | |
| categoryIds | string[] | |
| submittedAt | string | |
| evaluationStatus | 'NOT_STARTED' \| 'IN_PROGRESS' \| 'COMPLETED' | Panel member's scoring status for this idea |

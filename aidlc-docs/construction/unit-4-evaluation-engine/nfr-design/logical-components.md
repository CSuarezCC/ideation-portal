# Logical Components — Unit 4: Evaluation Engine

## Backend Logical Components

### EvaluationHandlers (Lambda functions)

| Route | Handler | Auth | Role |
|---|---|---|---|
| GET /evaluations/ideas | getIdeasForEvaluationHandler | Yes | PanelMember, Admin |
| GET /evaluations/pending | getPendingEvaluationsHandler | Yes | PanelMember |
| GET /evaluations/{ideaId}/mine | getMyEvaluationHandler | Yes | PanelMember |
| PUT /evaluations/{ideaId}/progress | saveEvaluationProgressHandler | Yes | PanelMember |
| POST /evaluations/{ideaId}/submit | submitEvaluationHandler | Yes | PanelMember |
| GET /evaluations/{ideaId}/summary | getEvaluationSummaryHandler | Yes | PanelMember, Admin |
| GET /evaluations/{ideaId}/score | getAggregatedScoreHandler | Yes | All |

### Internal Functions
- `triggerAggregation(ideaId, campaignId)` — called within submitEvaluation when all panel members have scored

### Shared Module Additions
- `shared/types/index.ts` — Add Evaluation, EvaluationStatus, AggregatedScore, AnonymizedEvaluation interfaces + new error codes (EVALUATION_NOT_FOUND, EVALUATION_ALREADY_SUBMITTED, EVALUATION_VALIDATION_ERROR, NOT_PANEL_MEMBER, CAMPAIGN_NOT_IN_EVALUATION)

## Frontend Logical Components

### EvaluationService (`frontend/src/services/evaluationService.ts`)
- Wraps all `/evaluations/*` API calls
- Exposes: `getIdeasForEvaluation(campaignId)`, `getPending(campaignId)`, `getMyEvaluation(ideaId)`, `saveProgress(ideaId, data)`, `submit(ideaId, data)`, `getSummary(ideaId)`, `getAggregatedScore(ideaId)`

### Frontend Pages
- `EvaluationQueuePage` — list ideas with evaluation status, sorted unscored-first
- `ScoringFormPage` — 3-dimension scoring form with save progress + submit
- `EvaluationSummaryPage` — aggregated scores + anonymized individual breakdowns

### New Shared UI Components
- `ScoreDisplay` — color-coded score value indicator (reused in dashboard later)

## AWS Infrastructure Components (Unit 4 additions to template.yaml)

### Lambda Functions (7 new)
- GetIdeasForEvaluation, GetPendingEvaluations, GetMyEvaluation, SaveEvaluationProgress, SubmitEvaluation, GetEvaluationSummary, GetAggregatedScore

### IAM Policies per handler
- GetIdeasForEvaluation: DynamoDB Read on Ideas + Evaluations + Campaigns tables
- GetPendingEvaluations: DynamoDB Read on Ideas + Evaluations + Campaigns tables
- GetMyEvaluation: DynamoDB Read on Evaluations table
- SaveEvaluationProgress: DynamoDB CRUD on Evaluations + Read on Campaigns table
- SubmitEvaluation: DynamoDB CRUD on Evaluations + AggregatedScores + Ideas tables, Read on Campaigns, EventBridge PutEvents
- GetEvaluationSummary: DynamoDB Read on AggregatedScores + Evaluations tables
- GetAggregatedScore: DynamoDB Read on AggregatedScores table

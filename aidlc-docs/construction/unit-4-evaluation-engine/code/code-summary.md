# Code Summary — Unit 4: Evaluation Engine

## Backend Files

| File | Status | Description |
|---|---|---|
| `backend/src/shared/types/index.ts` | Modified | Added Evaluation, EvaluationStatus, AggregatedScore, AnonymizedEvaluation + 5 error codes |
| `backend/src/shared/utils/errors.ts` | Modified | Added 5 new error codes to STATUS_MAP |
| `backend/src/handlers/evaluations/getMyEvaluation.ts` | Created | GET /evaluations/{ideaId}/mine — own evaluation for an idea |
| `backend/src/handlers/evaluations/saveEvaluationProgress.ts` | Created | PUT /evaluations/{ideaId}/progress — draft save with lenient validation |
| `backend/src/handlers/evaluations/submitEvaluation.ts` | Created | POST /evaluations/{ideaId}/submit — strict validation, lock, aggregation trigger |
| `backend/src/handlers/evaluations/getIdeasForEvaluation.ts` | Created | GET /evaluations/ideas — two-query join, sorted by eval status |
| `backend/src/handlers/evaluations/getPendingEvaluations.ts` | Created | GET /evaluations/pending — unscored ideas for panel member |
| `backend/src/handlers/evaluations/getEvaluationSummary.ts` | Created | GET /evaluations/{ideaId}/summary — blind scoring enforcement |
| `backend/src/handlers/evaluations/getAggregatedScore.ts` | Created | GET /evaluations/{ideaId}/score — averages only |

## Frontend Files

| File | Status | Description |
|---|---|---|
| `frontend/src/services/evaluationService.ts` | Created | API client for all evaluation endpoints |
| `frontend/src/components/ui/ScoreDisplay.tsx` | Created | Color-coded score value indicator |
| `frontend/src/pages/evaluation/EvaluationQueuePage.tsx` | Created | Evaluation queue with status filter |
| `frontend/src/pages/evaluation/ScoringFormPage.tsx` | Created | 3-dimension scoring form with save/submit |
| `frontend/src/pages/evaluation/EvaluationSummaryPage.tsx` | Created | Aggregated + anonymized individual scores |
| `frontend/src/App.tsx` | Modified | Added 3 evaluation routes |

## Infrastructure Files

| File | Status | Description |
|---|---|---|
| `template.yaml` | Modified | Added 7 evaluation Lambda functions with IAM policies |

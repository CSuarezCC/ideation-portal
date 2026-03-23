# Code Generation Plan — Unit 4: Evaluation Engine

## Unit Context
- **Dependencies**: Unit 1 (auth, RBAC, shared middleware), Unit 2 (campaigns, panel member assignments), Unit 3 (ideas)
- **Tables**: EvaluationsTable (PK: ideaId, SK: panelMemberId), AggregatedScoresTable (PK: ideaId)
- **Events Published**: EvaluationSubmitted, EvaluationAggregationComplete
- **Key Pattern**: Blind scoring enforcement, idempotent aggregation with conditional write

## Steps

- [x] Step 1: Shared Types — Add Evaluation, EvaluationStatus, AggregatedScore, AnonymizedEvaluation interfaces + new error codes
- [x] Step 2: Shared Errors — Add new error codes to STATUS_MAP
- [x] Step 3: Backend — getMyEvaluation handler
- [x] Step 4: Backend — saveEvaluationProgress handler
- [x] Step 5: Backend — submitEvaluation handler (with inline aggregation logic)
- [x] Step 6: Backend — getIdeasForEvaluation handler (two-query join)
- [x] Step 7: Backend — getPendingEvaluations handler
- [x] Step 8: Backend — getEvaluationSummary handler (blind scoring enforcement)
- [x] Step 9: Backend — getAggregatedScore handler
- [x] Step 10: SAM template.yaml — Add 7 evaluation Lambda functions
- [x] Step 11: Frontend — evaluationService.ts
- [x] Step 12: Frontend — ScoreDisplay shared component
- [x] Step 13: Frontend — EvaluationQueuePage, ScoringFormPage, EvaluationSummaryPage
- [x] Step 14: Frontend — Router update (App.tsx)
- [x] Step 15: Code Summary Documentation

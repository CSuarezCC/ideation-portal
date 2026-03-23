# Frontend Components — Unit 4: Evaluation Engine

## Page: EvaluationQueuePage (`/evaluation`)
- Displays all ideas for the panel member's active EVALUATION campaign.
- Sorted: unscored first, then in-progress (DRAFT), then completed.
- Each idea card shows: title, description snippet, category tags, evaluationStatus badge.
- Click navigates to scoring form (`/evaluation/:ideaId`).
- Status filter tabs: All / Not Started / In Progress / Completed.
- Uses `evaluationService.getIdeasForEvaluation(campaignId)`.

## Page: ScoringFormPage (`/evaluation/:ideaId`)
- Top section: read-only idea details (title, description, solution, benefits, categories, attachments).
- Scoring section: 3 dimension blocks, each with:
  - Dimension label (Feasibility / Impact / Innovation)
  - Score slider or number input (1–10)
  - Justification textarea (required on submit)
- Buttons: "Save Progress" (draft save) and "Submit Evaluation" (final, locked).
- Submit shows confirmation dialog ("Scores will be locked. Continue?").
- After submit, redirects to evaluation summary view.
- If evaluation already SUBMITTED, show read-only view of own scores.
- Uses `evaluationService.saveProgress(ideaId, data)` and `evaluationService.submit(ideaId, data)`.

## Page: EvaluationSummaryPage (`/evaluation/:ideaId/summary`)
- Shows aggregated scores (dimension averages + composite) if aggregation complete.
- Shows anonymized individual scores table (Panel Member 1, 2, 3...) with justifications — only if requesting user has submitted their own evaluation.
- If user hasn't submitted yet, shows message: "Submit your evaluation to see detailed results."
- Uses `evaluationService.getSummary(ideaId)`.

## Shared Component: ScoreDisplay
- Reusable component showing a score value with visual indicator (color-coded 1-10 scale).
- Used in evaluation queue cards, summary page, and later in dashboard/leaderboard.

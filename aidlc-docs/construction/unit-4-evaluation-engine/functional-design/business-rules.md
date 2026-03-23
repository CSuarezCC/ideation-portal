# Business Rules — Unit 4: Evaluation Engine

## BR-01: Blind Scoring Enforcement
- A Panel Member MUST NOT see any other panel member's scores for an idea until they have submitted their own evaluation for that idea.
- After submitting, the panel member can see anonymized individual scores (Panel Member 1, 2, 3...) plus justifications — but never real names.
- Server-side enforcement: `getEvaluationSummary` checks if requesting panel member has a SUBMITTED evaluation before returning individual scores.

## BR-02: Score Locking
- Once an evaluation is submitted (status = SUBMITTED), scores and justifications are immutable.
- No updates allowed to a SUBMITTED evaluation. Any PUT to a SUBMITTED evaluation returns error.

## BR-03: Evaluation Submission Validation
- All 3 dimension scores (feasibility, impact, innovation) must be integers 1–10.
- All 3 justification fields must be non-empty strings.
- The idea must be in SUBMITTED or UNDER_REVIEW status.
- The panel member must be assigned to the idea's campaign.

## BR-04: Draft Evaluation (Partial Save)
- Panel Members can save partial progress with any subset of fields populated.
- Draft evaluations have status = DRAFT and can be updated freely.
- No validation on completeness for draft saves — only on submit.

## BR-05: Aggregation Trigger
- When an evaluation is submitted, check if ALL assigned panel members for that idea's campaign have now submitted evaluations for that idea.
- If yes, trigger aggregation immediately (synchronous within the submit handler or via EventBridge event).
- Aggregation requires ALL assigned panel members — no partial aggregation.

## BR-06: Aggregation Algorithm
- For each dimension: average = sum of all panel member scores / total panel members.
- Composite score = (feasibilityAvg + impactAvg + innovationAvg) / 3.
- Round all averages to 2 decimal places.
- Store anonymized individual evaluations (shuffled order, indexed as 1, 2, 3...) in the AggregatedScore record.

## BR-07: Idea Status Transition on Aggregation
- When aggregation completes for an idea, automatically transition the idea's status to EVALUATED.
- Publish `evaluation.aggregation-complete` event to EventBridge.

## BR-08: Campaign Scope
- Panel Members can only evaluate ideas belonging to campaigns they are assigned to.
- The evaluation queue shows only ideas from campaigns where the panel member is assigned and the campaign is in EVALUATION status.

## BR-09: Evaluation Queue Ordering
- Ideas displayed with unscored ideas first, then in-progress (DRAFT), then completed (SUBMITTED).
- Within each group, sort by idea submission date (oldest first).

## BR-10: Panel Member Authorization
- Only users with role PANEL_MEMBER or ADMIN can access evaluation endpoints.
- Admin can view evaluation summaries but cannot submit evaluations.

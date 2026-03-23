# Business Logic Model — Unit 4: Evaluation Engine

## Evaluation Lifecycle

```
[No Evaluation] --> saveProgress --> [DRAFT] --> saveProgress --> [DRAFT] --> submit --> [SUBMITTED]
                                                                                           |
                                                                              (check all scored?)
                                                                              /              \
                                                                           No                Yes
                                                                           |                  |
                                                                        (done)         triggerAggregation
                                                                                             |
                                                                                    [AggregatedScore created]
                                                                                             |
                                                                                    [Idea -> EVALUATED]
                                                                                             |
                                                                                    [EventBridge event]
```

## Handler Logic

### getIdeasForEvaluation(panelMemberId, campaignId)
1. Verify panel member is assigned to campaign and campaign is in EVALUATION status.
2. Query Ideas table for all SUBMITTED/UNDER_REVIEW/EVALUATED ideas in the campaign.
3. Batch query Evaluations table (panelMemberId-index) for this panel member's evaluations.
4. Join: compute evaluationStatus per idea (NOT_STARTED / IN_PROGRESS / COMPLETED).
5. Sort: NOT_STARTED first, then IN_PROGRESS, then COMPLETED. Within groups, oldest submittedAt first.
6. Return IdeaEvalStatus[].

### saveEvaluationProgress(ideaId, data, panelMemberId)
1. Verify panel member is assigned to idea's campaign.
2. Check if existing evaluation exists — if SUBMITTED, reject.
3. Upsert evaluation with status=DRAFT, partial fields allowed.
4. Return updated Evaluation.

### submitEvaluation(ideaId, data, panelMemberId)
1. Verify panel member is assigned to idea's campaign.
2. Check if existing evaluation exists — if SUBMITTED, reject (already locked).
3. Validate all 6 fields present (3 scores 1-10, 3 non-empty justifications).
4. Write evaluation with status=SUBMITTED, submittedAt=now.
5. Publish `evaluation.submitted` event.
6. Check aggregation: query all evaluations for this ideaId, compare count to campaign's panelMemberIds.length.
7. If all scored → call triggerAggregation.
8. Return submitted Evaluation.

### triggerAggregation(ideaId, campaignId)
1. Query all SUBMITTED evaluations for ideaId.
2. Calculate per-dimension averages and composite score (rounded to 2 decimals).
3. Build anonymized evaluations array (shuffled, indexed 1..N).
4. Write AggregatedScore record.
5. Update idea status to EVALUATED.
6. Publish `evaluation.aggregation-complete` event with ideaId, campaignId, compositeScore.

### getMyEvaluation(ideaId, panelMemberId)
1. Direct get from Evaluations table (ideaId + panelMemberId).
2. Return Evaluation or null.

### getEvaluationSummary(ideaId, requestingUserId)
1. Get AggregatedScore for ideaId. If not exists, return null/partial.
2. If requester is Admin → return full summary with anonymized individual scores + justifications.
3. If requester is PanelMember → check if they have a SUBMITTED evaluation for this idea.
   - If yes → return full summary with anonymized individual scores + justifications.
   - If no → return only aggregated averages (no individual breakdown) — blind scoring enforced.

### getAggregatedScore(ideaId)
1. Direct get from AggregatedScores table.
2. Return averages and composite only (no individual breakdown — use getEvaluationSummary for that).

### getPendingEvaluations(panelMemberId, campaignId)
1. Get all submitted ideas for campaign.
2. Get all evaluations by this panel member.
3. Return ideas where panel member has no evaluation or evaluation is DRAFT.

# Functional Design Plan — Unit 4: Evaluation Engine

## Plan Steps

- [x] Step 1: Define Evaluation and AggregatedScore domain entities
- [x] Step 2: Define business rules (blind scoring, locking, aggregation trigger)
- [x] Step 3: Define business logic model (evaluation lifecycle, aggregation algorithm)
- [x] Step 4: Define frontend components (evaluation queue, scoring form, progress view)

## Questions

### Business Logic

**Q1**: When a Panel Member opens the evaluation queue, should they see ALL submitted ideas for the campaign, or only ideas they haven't scored yet?

A) All ideas with scored/unscored status indicator
B) Only unscored ideas (separate "completed" tab)
C) All ideas, but unscored first, then scored

[Answer]: C and A. Sorted by unscored first and an status indicator 

**Q2**: For blind scoring enforcement — after a Panel Member submits their own score for an idea, should they then be able to see individual scores from other panel members, or only the aggregated average?

A) See individual scores per panel member (with names)
B) See individual scores anonymized (Panel Member 1, 2, 3...)
C) Only see aggregated averages per dimension (no individual breakdown)

[Answer]: B

**Q3**: Should the aggregation happen immediately when the last panel member submits (real-time), or on a schedule/manual trigger?

A) Immediately when last panel member submits (event-driven)
B) Admin manually triggers aggregation
C) Both — auto when all scored, but Admin can force early aggregation

[Answer]: A

**Q4**: When aggregation completes for an idea, should the idea status automatically transition to EVALUATED?

A) Yes, auto-transition to EVALUATED
B) No, Admin manually transitions
C) Auto-transition, but Admin can override/revert

[Answer]: A

**Q5**: Should Panel Members be able to save partial evaluation progress (draft scores) and return later, or must they complete all 3 dimensions + justifications in one session?

A) Allow saving partial progress (draft evaluation)
B) Must complete all fields in one session
C) Allow partial save but with a deadline warning

[Answer]: A

**Q6**: For the evaluation summary view (after blind scoring is lifted), what level of detail should be shown?

A) Just aggregated averages per dimension + composite
B) Aggregated averages + anonymized individual scores
C) Aggregated averages + anonymized individual scores + justifications

[Answer]: C

**Q7**: Should there be a minimum number of panel members who must score before aggregation can happen, or does it require ALL assigned panel members?

A) ALL assigned panel members must score
B) Configurable minimum (e.g., 3 out of 5)
C) Majority (>50%) of assigned panel members

[Answer]: A

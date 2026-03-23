# Business Rules — Unit 5: Dashboards, Leaderboard & Analytics

## BR-01: Role-Based Author Visibility (Leaderboard)
- Employees see anonymized leaderboard entries (submitterName = null)
- Panel Members and Admins see full author names
- Enforced at API layer: handler checks requester role and strips submitterName for Employee role

## BR-02: Leaderboard Ranking Dimensions
- Five tabs supported: Composite Score (default), Feasibility, Impact, Innovation, Most Recent
- Composite/Feasibility/Impact/Innovation: sorted descending by the respective score
- Most Recent: sorted descending by submittedAt timestamp
- Only ideas with a completed AggregatedScore appear in score-based tabs
- Most Recent tab shows all submitted ideas (including those not yet evaluated)

## BR-03: Leaderboard Scope
- Leaderboard is scoped to a single campaign at a time
- Campaign selector dropdown allows switching between campaigns
- Default: most recent campaign with status Evaluation or Closed

## BR-04: Analytics Access Control
- Analytics pages restricted to Admin and Panel Member roles only
- Employees receive 403 if attempting to access analytics endpoints
- RBAC enforced at API Gateway authorizer level

## BR-05: Analytics Campaign Scope
- All analytics queries are scoped to a single campaign (campaignId required)
- No cross-campaign analytics views

## BR-06: Score Distribution Bucketing
- Scores bucketed into 5 ranges: 1-2, 3-4, 5-6, 7-8, 9-10
- Each bucket counts the number of ideas whose average score for that dimension falls in the range
- Composite score uses same bucketing

## BR-07: Top Ideas Limit
- getTopIdeas returns top N ideas (default N=10, max N=50)
- Sorted by composite score descending
- Ties broken by feasibility score, then impact, then innovation

## BR-08: Idea Detail Role-Based Fields
- All roles: see idea title, description, solution, benefits, categories, scores (averages)
- Panel Members and Admins: additionally see anonymized individual evaluations
- Employees: do not see individual evaluations
- Author name visibility follows BR-01

## BR-09: Leaderboard Data Freshness
- Leaderboard queries AggregatedScores table directly (no caching layer)
- Data is as fresh as the last aggregation run (triggered synchronously on evaluation submit in Unit 4)
- Meets NFR-03: dashboard refresh within 5s of new evaluation

## BR-10: Participation Metrics Calculation
- totalIdeasSubmitted: count of ideas in campaign with status != DRAFT
- totalIdeasEvaluated: count of ideas with an AggregatedScore record
- totalIdeasPending: totalIdeasSubmitted - totalIdeasEvaluated
- totalPanelMembers: count of panel members assigned to campaign (from CampaignsTable)
- averageCompositeScore: mean of all compositeScore values for evaluated ideas

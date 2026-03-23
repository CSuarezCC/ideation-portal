# Business Logic Model — Unit 5: Dashboards, Leaderboard & Analytics

## Dashboard Handlers

### getLeaderboard(campaignId, dimension, requestingUserId)
1. Validate campaignId exists
2. If dimension is "most_recent":
   - Query IdeasTable GSI `campaignId-status-index` for all non-DRAFT ideas
   - Sort by submittedAt descending
   - For each idea, look up AggregatedScore (may be null for unevaluated ideas)
3. Else (composite, feasibility, impact, innovation):
   - Query AggregatedScoresTable GSI `campaignId-compositeScore-index`
   - If dimension != composite, fetch all records and sort in-memory by the requested dimension
   - Join with IdeasTable to get title, categoryIds, submittedAt
4. Resolve submitter names from UsersTable
5. Apply BR-01: if requester role is Employee, set submitterName = null
6. Return LeaderboardEntry[]

### getIdeaDetail(ideaId, requestingUserId)
1. Fetch idea from IdeasTable
2. Fetch AggregatedScore from AggregatedScoresTable (may be null)
3. Resolve submitter name from UsersTable
4. Apply BR-01: anonymize submitterName for Employee role
5. Apply BR-08: include evaluations array only for Admin/Panel Member
6. Return IdeaDetail

### getLeaderboardSummary(campaignId)
1. Query AggregatedScoresTable GSI for campaign
2. Return: total evaluated ideas count, highest composite score, average composite score

### searchIdeas(query, campaignId, requestingUserId)
1. Query IdeasTable GSI `campaignId-status-index` for non-DRAFT ideas
2. Filter in-memory by keyword match on title and description (case-insensitive contains)
3. For each matching idea, look up AggregatedScore
4. Apply BR-01 for author visibility
5. Return LeaderboardEntry[]

---

## Analytics Handlers

### getTopIdeas(campaignId, limit)
1. Enforce BR-04: reject if requester is Employee
2. Query AggregatedScoresTable GSI `campaignId-compositeScore-index` (descending)
3. Take top `limit` records (default 10, max 50)
4. Join with IdeasTable for title
5. Resolve submitter names (always visible — analytics is Admin/Panel only)
6. Apply BR-07 tie-breaking if needed
7. Return TopIdea[]

### getComparativeAnalysis(campaignId, dimension)
1. Enforce BR-04
2. Query all AggregatedScores for campaign
3. Join with IdeasTable for titles
4. Sort by requested dimension descending
5. Return ComparativeData

### getParticipationMetrics(campaignId)
1. Enforce BR-04
2. Count ideas by status from IdeasTable GSI (non-DRAFT = submitted)
3. Count AggregatedScore records for campaign (= evaluated)
4. Pending = submitted - evaluated
5. Get panel member count from CampaignsTable panelMemberIds array length
6. Calculate average composite from AggregatedScores
7. Return ParticipationMetrics

### getScoreDistribution(campaignId, dimension)
1. Enforce BR-04
2. Query all AggregatedScores for campaign
3. For each idea, get the score for the requested dimension
4. Bucket into 5 ranges per BR-06
5. Return ScoreDistribution

### getCampaignSummary(campaignId)
1. Enforce BR-04
2. Fetch campaign metadata from CampaignsTable
3. Call getParticipationMetrics logic
4. Call getTopIdeas logic (limit=5)
5. Call getScoreDistribution for all 4 dimensions
6. Return CampaignSummary

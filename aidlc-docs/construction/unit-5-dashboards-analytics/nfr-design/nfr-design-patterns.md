# NFR Design Patterns — Unit 5: Dashboards, Leaderboard & Analytics

## Inherited Patterns (from Units 1-4)

- **Retry with Exponential Backoff** — applied to DynamoDB reads
- **Structured Error Responses** — same error envelope
- **Middleware Chain (RBAC)** — requireRole on analytics endpoints
- **Environment-Based Configuration** — table names via env vars
- **In-Lambda Join** (Pattern 14) — reused for leaderboard queries joining AggregatedScores + Ideas + Users

---

## Pattern 16: Role-Based Field Stripping

**Problem**: Leaderboard and idea detail responses must hide certain fields based on requester role (BR-01: author anonymization for Employees, BR-08: individual evaluations hidden for Employees).

**Solution**: A shared utility function that strips fields from response objects based on role.

```
stripByRole(data, requesterRole):
  if requesterRole === 'EMPLOYEE':
    data.submitterName = null
    data.evaluations = undefined
  return data
```

Applied as a post-processing step in every dashboard handler before returning the response. Keeps business logic clean — handlers build the full response, then strip.

---

## Pattern 17: Multi-Dimension Sort with GSI Fallback

**Problem**: Leaderboard supports 5 ranking dimensions but DynamoDB GSI only sorts by composite score. Other dimensions require different sort orders.

**Solution**: 
- **Composite score**: Use GSI `campaignId-compositeScore-index` directly (DynamoDB handles sort)
- **Feasibility/Impact/Innovation**: Query same GSI, then sort in-memory by requested dimension
- **Most Recent**: Query IdeasTable GSI `campaignId-status-index`, sort by submittedAt

```
getLeaderboard(campaignId, dimension):
  if dimension === 'most_recent':
    ideas = Query(Ideas, campaignId-status-index, status != DRAFT)
    sort by submittedAt desc
    batch lookup AggregatedScores (may be null)
  else:
    scores = Query(AggregatedScores, campaignId-compositeScore-index)
    if dimension !== 'composite':
      sort scores by dimension desc
    batch lookup Ideas for titles
  batch lookup Users for names
  apply Pattern 16 (role-based stripping)
```

Acceptable because campaign-scoped data is bounded (hundreds to low thousands of ideas).

---

## Pattern 18: Graceful Null Handling for Read Models

**Problem**: Dashboard queries join multiple tables. Some data may be missing (e.g., idea not yet evaluated has no AggregatedScore; user record may be deleted).

**Solution**: All handlers treat missing joined data as null/default rather than errors.

```
- AggregatedScore not found → scores = null (idea still appears in Most Recent tab)
- User not found → submitterName = "Anonymous"
- Campaign not found → 404 error (this IS an error — campaign is the primary scope)
- Empty result set → return empty array, zero counts (not an error)
```

---

## Pattern 19: In-Memory Keyword Search

**Problem**: searchIdeas needs keyword matching on title and description. DynamoDB has no full-text search.

**Solution**: Query all non-DRAFT ideas for the campaign via GSI, then filter in-memory with case-insensitive substring match.

```
searchIdeas(query, campaignId):
  ideas = Query(Ideas, campaignId-status-index, status != DRAFT)
  queryLower = query.toLowerCase()
  filtered = ideas.filter(i =>
    i.title.toLowerCase().includes(queryLower) ||
    i.description.toLowerCase().includes(queryLower)
  )
```

Acceptable at this scale. If search volume or data size grows significantly, migrate to OpenSearch.

---

## Pattern 20: Composite Aggregation Handler

**Problem**: getCampaignSummary needs data from multiple sources (participation metrics, top ideas, score distributions). Making separate API calls from the frontend would be chatty.

**Solution**: Single backend handler that composes results from internal logic functions (not separate Lambda calls).

```
getCampaignSummary(campaignId):
  [campaign, allScores, allIdeas] = await Promise.all([
    GetItem(Campaigns, campaignId),
    Query(AggregatedScores, campaignId GSI),
    Query(Ideas, campaignId GSI, status != DRAFT)
  ])
  // Compute all metrics from the fetched data in-memory
  participation = computeParticipation(allIdeas, allScores, campaign)
  topIdeas = computeTopIdeas(allScores, limit=5)
  distributions = computeDistributions(allScores)
  return { campaign, participation, topIdeas, distributions }
```

Three parallel DynamoDB queries + in-memory computation. Avoids N+1 query patterns.

---

## New Error Codes

| Code | HTTP | Description |
|---|---|---|
| CAMPAIGN_NOT_FOUND | 404 | Campaign ID does not exist |
| IDEA_NOT_FOUND | 404 | Idea ID does not exist |
| ANALYTICS_ACCESS_DENIED | 403 | Employee role attempted analytics access |
| INVALID_DIMENSION | 400 | Invalid leaderboard dimension parameter |
| INVALID_LIMIT | 400 | Top ideas limit out of range (1-50) |

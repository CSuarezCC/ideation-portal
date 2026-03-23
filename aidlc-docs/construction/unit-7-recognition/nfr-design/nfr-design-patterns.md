# NFR Design Patterns — Unit 7: Recognition System

## Inherited Patterns (from Units 1-6)

- **Retry with Exponential Backoff** — DynamoDB writes and EventBridge
- **Structured Error Responses** — same error envelope
- **Middleware Chain (RBAC)** — auth on all endpoints, role check on announce
- **Environment-Based Configuration** — table names via env vars
- **Event Router** (Pattern 24) — reused in Unit 6 consumer update

---

## Pattern 25: Idempotent Event Consumer (Winner Determination)

**Problem**: `campaign.closed` may fire multiple times. Must not re-determine or overwrite winners.

**Solution**: Before processing, query RecognitionTable for existing winners. If found, skip.

```
processWinners(event):
  campaignId = event.detail.campaignId
  existing = Query(RecognitionTable, PK=campaignId, SK begins_with "IDEA#", Limit=1)
  if existing.Count > 0:
    return  // already determined, skip
  // proceed with winner determination
```

---

## Pattern 26: Two-Phase Recognition (Determine → Announce)

**Problem**: Winners should be determined automatically but not visible until Admin publishes.

**Solution**: Two-phase approach:
1. **Determine** (event-driven): Write WinnerRecords with `announcedAt=null` + WinnerAnnouncement with `publishedAt=null`
2. **Announce** (Admin API): Set timestamps, update campaign/idea statuses, publish event

```
Phase 1 — processWinners (automatic on campaign.closed):
  scores = Query(AggregatedScores, campaignId-compositeScore-index, desc, Limit=3)
  for rank, score in enumerate(scores):
    PutItem(RecognitionTable, { campaignId, SK: "IDEA#"+ideaId, rank, announcedAt: null })
  PutItem(RecognitionTable, { campaignId, SK: "ANNOUNCEMENT", publishedAt: null })

Phase 2 — announceWinners (Admin POST):
  validate campaign.status == CLOSED, winners exist, not already announced
  Update WinnerRecords: set announcedAt = now
  Update WinnerAnnouncement: set publishedAt = now
  Update Campaign: status = ANNOUNCED
  Update Ideas: status = WINNER (for each winner)
  PutEvents(recognition.winners-announced)
```

---

## Pattern 27: Composite Score Tie-Breaking

**Problem**: Multiple ideas may have the same composite score. Need deterministic top 3.

**Solution**: Query by compositeScore desc from GSI, then sort in-memory by feasibilityAvg → impactAvg → innovationAvg for tie-breaking.

```
getTop3(campaignId):
  // Query more than 3 to handle ties at boundary
  scores = Query(AggregatedScores, campaignId-compositeScore-index, desc, Limit=10)
  sorted = scores.sort(compositeScore desc, feasibilityAvg desc, impactAvg desc, innovationAvg desc)
  return sorted.slice(0, 3)
```

---

## New Error Codes

| Code | HTTP | Description |
|---|---|---|
| RECOGNITION_NOT_FOUND | 404 | No winners found for this campaign |
| CAMPAIGN_NOT_CLOSED | 400 | Campaign must be in CLOSED status to announce |
| ALREADY_ANNOUNCED | 409 | Winners have already been announced |

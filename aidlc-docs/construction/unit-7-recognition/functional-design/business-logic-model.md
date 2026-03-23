# Business Logic Model — Unit 7: Recognition System

## Event Flow

```
campaign.closed (EventBridge)
  │
  ▼
processWinners (Lambda consumer)
  ├── Query AggregatedScoresTable for campaignId, sort by compositeScore desc
  ├── Select top 3 (tie-break: feasibility → impact → innovation)
  ├── Check idempotency (skip if winners already exist)
  ├── Write WinnerRecords (rank 1-3, announcedAt=null)
  ├── Write WinnerAnnouncement (publishedAt=null)
  └── Done (no event published yet — awaiting Admin announcement)

Admin: POST /recognition/{campaignId}/announce
  │
  ▼
announceWinners (Lambda API handler)
  ├── Validate: campaign exists, status=CLOSED, winners exist, not already announced
  ├── Update WinnerRecords: set announcedAt
  ├── Update WinnerAnnouncement: set publishedAt
  ├── Update Campaign status: CLOSED → ANNOUNCED
  ├── Update winning Ideas status: EVALUATED → WINNER
  ├── Publish recognition.winners-announced event
  └── Return success

recognition.winners-announced (EventBridge)
  │
  ▼
processEvent (existing Unit 6 consumer — update placeholder)
  ├── Notify each winner (submitter) with rank/badge info
  └── Notify all Admins for HR follow-up
```

## API Endpoints

### GET /recognition/{campaignId}/winners
- Auth: All authenticated users
- Returns winner list for a campaign
- If not yet announced: returns empty array (winners hidden until announcement)
- If announced: returns WinnerRecord[] with rank, badge, idea title, submitter name, score

### GET /recognition/{campaignId}/announcement
- Auth: All authenticated users
- Returns the WinnerAnnouncement for a campaign
- If not yet announced: returns 404
- If announced: returns announcement with message, publishedAt, winners summary

### POST /recognition/{campaignId}/announce
- Auth: Admin only
- Publishes the winner announcement
- Validates campaign is CLOSED and winners exist
- Transitions campaign to ANNOUNCED status
- Returns the published announcement

## Data Access Patterns

| Access Pattern | Table | Key Condition |
|---|---|---|
| Get winners for campaign | RecognitionTable | PK=campaignId, SK begins_with "IDEA#" |
| Get announcement for campaign | RecognitionTable | PK=campaignId, SK="ANNOUNCEMENT" |
| Check if winners exist (idempotency) | RecognitionTable | PK=campaignId, SK begins_with "IDEA#", Limit 1 |
| Get top scores for campaign | AggregatedScoresTable | campaignId-compositeScore-index, ScanIndexForward=false, Limit 3 |

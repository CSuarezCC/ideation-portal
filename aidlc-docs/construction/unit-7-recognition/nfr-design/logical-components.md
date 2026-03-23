# Logical Components — Unit 7: Recognition System

## Backend Lambda Handlers

### EventBridge Consumer (backend/src/handlers/recognition/)

| Handler | Trigger | Description |
|---|---|---|
| processWinners | EventBridge: campaign.closed | Determines top 3 winners, writes WinnerRecords + WinnerAnnouncement (Pattern 25, 26, 27) |

### API Handlers (backend/src/handlers/recognition/)

| Handler | Route | Method | Auth | Description |
|---|---|---|---|---|
| getWinners | /recognition/{campaignId}/winners | GET | All roles | Returns winner list (empty if not yet announced) |
| getAnnouncement | /recognition/{campaignId}/announcement | GET | All roles | Returns announcement (404 if not yet announced) |
| announceWinners | /recognition/{campaignId}/announce | POST | Admin only | Publishes announcement, transitions statuses, fires event |

### Unit 6 Update (backend/src/handlers/notifications/)

| Handler | Change | Description |
|---|---|---|
| processEvent | Update placeholder | Replace `recognition.winners-announced` placeholder with real notification logic |

---

## Frontend Components

### Pages

| Page | Route | Access | Description |
|---|---|---|---|
| WinnersAnnouncementPage | /recognition/:campaignId | All roles | Full announcement with winner cards |

### Embedded Components

| Component | Location | Description |
|---|---|---|
| WinnersSection | Embedded in LeaderboardPage | Gold/Silver/Bronze cards when campaign is ANNOUNCED |
| AdminAnnounceButton | Embedded in LeaderboardPage | POST announce button for Admin when campaign is CLOSED |
| Badge indicators | LeaderboardPage table rows | Small badge icon for winning ideas |

### Frontend Services

| Service | File | Description |
|---|---|---|
| recognitionService | frontend/src/services/recognitionService.ts | API client for /recognition/* endpoints |

---

## Infrastructure

- 1 EventBridge consumer Lambda (processWinners) with rule for campaign.closed
- 3 API Lambda functions (getWinners, getAnnouncement, announceWinners)
- 1 new DynamoDB table: RecognitionTable (PK: campaignId, SK: sk)
- Reads from AggregatedScoresTable (campaignId-compositeScore-index)
- Writes to CampaignsTable (status update), IdeasTable (status update)
- Publishes to EventBridge (recognition.winners-announced)

# Deployment Architecture — Unit 7: Recognition System

## API Routes

| Method | Path | Function | Auth |
|---|---|---|---|
| GET | /recognition/{campaignId}/winners | GetWinnersFunction | All roles |
| GET | /recognition/{campaignId}/announcement | GetAnnouncementFunction | All roles |
| POST | /recognition/{campaignId}/announce | AnnounceWinnersFunction | Admin only |

## EventBridge Events

| Event | Direction | Function |
|---|---|---|
| campaign.closed | Consumed | ProcessWinnersFunction |
| recognition.winners-announced | Published | AnnounceWinnersFunction → NotificationEventConsumerFunction (Unit 6) |

## Architecture Diagram

```
┌──────────────────┐
│   EventBridge     │
│  campaign.closed  │
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ ProcessWinners     │──▶ AggregatedScoresTable (Read)
│ (Event Consumer)   │──▶ WinnersTable (Write)
└────────────────────┘

┌─────────────┐     ┌──────────────┐
│   Frontend   │────▶│  API Gateway  │
│  (React SPA) │     │   (HttpApi)   │
└─────────────┘     └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌──────────────┐
     │ GetWinners │ │ GetAnnoun │ │ Announce     │
     │            │ │ cement    │ │ Winners      │
     └─────┬──────┘ └─────┬────┘ └──────┬───────┘
           │               │             │
           ▼               ▼             ▼
     ┌─────────────────────────────────────────┐
     │  WinnersTable (R)  │ Winners + Campaigns│
     │                    │ + Ideas (R/W)      │
     │                    │ + EventBridge (Pub) │
     └─────────────────────────────────────────┘
```

## WinnersTable Key Design (Existing)

- PK: `campaignId` (String)
- SK: `rank` (Number) — 0=Announcement, 1=Gold, 2=Silver, 3=Bronze

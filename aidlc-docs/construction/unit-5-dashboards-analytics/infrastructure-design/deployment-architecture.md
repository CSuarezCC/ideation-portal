# Deployment Architecture — Unit 5: Dashboards, Leaderboard & Analytics

## API Routes

| Method | Path | Function | Auth |
|---|---|---|---|
| GET | /dashboard/leaderboard | GetLeaderboardFunction | All roles |
| GET | /dashboard/ideas/{ideaId} | GetIdeaDetailFunction | All roles |
| GET | /dashboard/summary | GetLeaderboardSummaryFunction | All roles |
| GET | /dashboard/search | SearchIdeasFunction | All roles |
| GET | /analytics/top-ideas | GetTopIdeasFunction | Admin, Panel |
| GET | /analytics/comparative | GetComparativeAnalysisFunction | Admin, Panel |
| GET | /analytics/participation | GetParticipationMetricsFunction | Admin, Panel |
| GET | /analytics/score-distribution | GetScoreDistributionFunction | Admin, Panel |
| GET | /analytics/campaign-summary | GetCampaignSummaryFunction | Admin, Panel |

## EventBridge Events

None — Unit 5 is read-only. No events published or consumed.

## Architecture Diagram

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────────────────┐
│   Frontend   │────▶│  API Gateway  │────▶│  Lambda Authorizer (Unit 1)  │
│  (React SPA) │     │   (HttpApi)   │     └──────────────────────────────┘
└─────────────┘     └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌───────────┐
     │  Dashboard  │ │ Analytics │ │ Analytics │
     │  Handlers   │ │ Handlers  │ │ Handlers  │
     │  (4 fns)    │ │ (5 fns)   │ │           │
     └─────┬──────┘ └─────┬─────┘ └───────────┘
           │               │
           ▼               ▼
     ┌─────────────────────────────────┐
     │        DynamoDB (Read Only)      │
     │  Ideas | AggregatedScores |      │
     │  Campaigns | Users               │
     └─────────────────────────────────┘
```

## Frontend Dependency Addition

```json
{
  "recharts": "^2.x"
}
```

Added to `frontend/package.json` devDependencies for analytics charts.

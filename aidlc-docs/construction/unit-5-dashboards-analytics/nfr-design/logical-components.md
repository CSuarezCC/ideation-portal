# Logical Components — Unit 5: Dashboards, Leaderboard & Analytics

## Backend Lambda Handlers

### Dashboard Handlers (backend/src/dashboard/)

| Handler | Route | Method | Auth | Description |
|---|---|---|---|---|
| getLeaderboard | /dashboard/leaderboard | GET | All roles | Ranked ideas by dimension (Pattern 17) |
| getIdeaDetail | /dashboard/ideas/{ideaId} | GET | All roles | Full idea detail with role-based fields (Pattern 16) |
| getLeaderboardSummary | /dashboard/summary | GET | All roles | Top-level leaderboard stats |
| searchIdeas | /dashboard/search | GET | All roles | Keyword search (Pattern 19) |

### Analytics Handlers (backend/src/analytics/)

| Handler | Route | Method | Auth | Description |
|---|---|---|---|---|
| getTopIdeas | /analytics/top-ideas | GET | Admin, Panel | Top N ideas with scores |
| getComparativeAnalysis | /analytics/comparative | GET | Admin, Panel | Cross-dimension comparison |
| getParticipationMetrics | /analytics/participation | GET | Admin, Panel | Submission/evaluation counts |
| getScoreDistribution | /analytics/score-distribution | GET | Admin, Panel | Score histogram by dimension |
| getCampaignSummary | /analytics/campaign-summary | GET | Admin, Panel | Composite summary (Pattern 20) |

---

## Frontend Components

### Pages

| Page | Route | Access | Description |
|---|---|---|---|
| LeaderboardPage | /leaderboard | All roles | 5-tab leaderboard with campaign selector |
| IdeaDetailPage | /leaderboard/ideas/:ideaId | All roles | Idea detail with role-based score visibility |
| AnalyticsDashboardPage | /analytics | Admin, Panel | Charts, metrics, top ideas |

### Shared Components

| Component | Description |
|---|---|
| CampaignSelector | Dropdown for campaign selection, defaults to most recent Evaluation/Closed |
| DimensionTabs | Tab bar for leaderboard dimension switching (5 tabs) |
| ScoreBarChart | Recharts bar chart wrapper for score distributions |
| ComparativeChart | Recharts grouped bar chart for cross-dimension comparison |

### Frontend Services

| Service | File | Description |
|---|---|---|
| dashboardService | frontend/src/services/dashboardService.ts | API client for /dashboard/* endpoints |
| analyticsService | frontend/src/services/analyticsService.ts | API client for /analytics/* endpoints |

---

## No New Infrastructure

Unit 5 uses only existing AWS resources:
- Existing DynamoDB tables (Ideas, AggregatedScores, Evaluations, Campaigns, Users)
- Existing API Gateway
- Existing Lambda Authorizer
- No EventBridge events published or consumed
- No S3 usage
- New frontend dependency: Recharts

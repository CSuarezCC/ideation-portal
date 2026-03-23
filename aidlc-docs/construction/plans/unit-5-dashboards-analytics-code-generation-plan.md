# Code Generation Plan — Unit 5: Dashboards, Leaderboard & Analytics

## Unit Context
- **Dependencies**: Unit 1 (auth, RBAC, shared middleware), Unit 3 (ideas), Unit 4 (aggregated scores)
- **Tables (Read Only)**: AggregatedScores, Ideas, Campaigns, Users
- **Events**: None (read-only unit)
- **Key Patterns**: Role-based field stripping (P16), multi-dimension sort (P17), graceful null handling (P18), in-memory keyword search (P19), composite aggregation (P20)
- **New Frontend Dependency**: Recharts

## Steps

- [x] Step 1: Shared Types — Add LeaderboardEntry, IdeaDetail, TopIdea, ParticipationMetrics, ScoreDistribution, ComparativeData, CampaignSummary, ScoreBucket, ComparativeIdeaRow interfaces + new error codes
- [x] Step 2: Backend — getLeaderboard handler (multi-dimension sort, role-based stripping)
- [x] Step 3: Backend — getIdeaDetail handler (role-based field visibility)
- [x] Step 4: Backend — getLeaderboardSummary handler
- [x] Step 5: Backend — searchIdeas handler (in-memory keyword filter)
- [x] Step 6: Backend — getTopIdeas handler (analytics, Admin/Panel only)
- [x] Step 7: Backend — getComparativeAnalysis handler
- [x] Step 8: Backend — getParticipationMetrics handler
- [x] Step 9: Backend — getScoreDistribution handler
- [x] Step 10: Backend — getCampaignSummary handler (composite aggregation)
- [x] Step 11: SAM template.yaml — Add 9 dashboard/analytics Lambda functions
- [x] Step 12: Frontend — dashboardService.ts + analyticsService.ts
- [x] Step 13: Frontend — CampaignSelector, DimensionTabs, ScoreBarChart, ComparativeChart shared components
- [x] Step 14: Frontend — LeaderboardPage, IdeaDetailPage (dashboard), AnalyticsDashboardPage
- [x] Step 15: Frontend — Router update (App.tsx) + install Recharts dependency
- [x] Step 16: Code Summary Documentation

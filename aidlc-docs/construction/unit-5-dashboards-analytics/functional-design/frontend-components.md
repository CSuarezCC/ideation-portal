# Frontend Components — Unit 5: Dashboards, Leaderboard & Analytics

## Pages

### LeaderboardPage
- **Route**: `/leaderboard`
- **Access**: All authenticated users
- **Layout**:
  - Campaign selector dropdown (top) — loads campaigns, defaults to most recent Evaluation/Closed campaign
  - 5 tabs: Composite Score | Feasibility | Impact | Innovation | Most Recent
  - Table/list of LeaderboardEntry items (all loaded at once per Q6:B)
  - Each row: rank number, title, scores (4 dimensions), author name (role-dependent per BR-01)
  - Click row → navigates to idea detail
- **State**: selectedCampaignId, activeTab (dimension), leaderboardData[]
- **API**: `dashboardService.getLeaderboard(campaignId, dimension)`

### IdeaDetailPage (Dashboard context)
- **Route**: `/leaderboard/ideas/:ideaId`
- **Access**: All authenticated users
- **Layout**:
  - Idea metadata: title, description, solution, benefits, categories
  - Score summary: composite + 3 dimension averages (ScoreDisplay components)
  - Anonymized individual evaluations table (Admin/Panel Member only per BR-08)
  - Author name (role-dependent per BR-01)
- **API**: `dashboardService.getIdeaDetail(ideaId)`

### AnalyticsDashboardPage
- **Route**: `/analytics`
- **Access**: Admin and Panel Member only (BR-04)
- **Layout**:
  - Campaign selector dropdown
  - Campaign summary card (name, status, participation counts)
  - Top Ideas section — table of top 10 ideas with score breakdowns
  - Score Distribution section — 4 Recharts bar charts (one per dimension)
  - Participation Metrics section — submitted/evaluated/pending counts
  - Comparative Analysis section — multi-bar chart comparing ideas across dimensions
- **State**: selectedCampaignId, campaignSummary, topIdeas[], scoreDistributions[], participationMetrics, comparativeData
- **API**: `analyticsService.getCampaignSummary(campaignId)` (or individual calls)

---

## Shared Components

### CampaignSelector
- Dropdown component used by both LeaderboardPage and AnalyticsDashboardPage
- Loads campaigns list, defaults to most recent Evaluation/Closed campaign
- Props: `onCampaignChange(campaignId)`, `selectedCampaignId`
- API: reuses `campaignService.listCampaigns()`

### DimensionTabs
- Tab bar for switching leaderboard ranking dimension
- Props: `activeTab`, `onTabChange(dimension)`, `tabs[]`
- 5 tabs: Composite, Feasibility, Impact, Innovation, Most Recent

### ScoreBarChart (Recharts wrapper)
- Renders a bar chart for score distribution
- Props: `data: ScoreBucket[]`, `title: string`, `color: string`
- Uses Recharts `BarChart`, `Bar`, `XAxis`, `YAxis`, `Tooltip`

### ComparativeChart (Recharts wrapper)
- Grouped bar chart comparing ideas across dimensions
- Props: `data: ComparativeIdeaRow[]`, `highlightDimension?: string`
- Uses Recharts `BarChart` with multiple `Bar` elements (one per dimension)

---

## API Integration

| Component | Endpoint | Service |
|---|---|---|
| LeaderboardPage | GET /dashboard/leaderboard | dashboardService |
| IdeaDetailPage | GET /dashboard/ideas/:ideaId | dashboardService |
| AnalyticsDashboardPage | GET /analytics/campaign-summary | analyticsService |
| AnalyticsDashboardPage | GET /analytics/top-ideas | analyticsService |
| AnalyticsDashboardPage | GET /analytics/score-distribution | analyticsService |
| AnalyticsDashboardPage | GET /analytics/participation | analyticsService |
| AnalyticsDashboardPage | GET /analytics/comparative | analyticsService |
| CampaignSelector | GET /campaigns | campaignService (existing) |

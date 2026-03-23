# Logical Components — Unit 2: Campaign & Category Management

## Backend Logical Components

### CampaignHandlers (Lambda functions)

| Route | Handler | Auth | Role |
|---|---|---|---|
| POST /campaigns | createCampaignHandler | Yes | Admin |
| GET /campaigns | listCampaignsHandler | Yes | All |
| GET /campaigns/active | getActiveCampaignHandler | Yes | All |
| GET /campaigns/{id} | getCampaignHandler | Yes | All |
| PUT /campaigns/{id} | updateCampaignHandler | Yes | Admin |
| PUT /campaigns/{id}/status | transitionStatusHandler | Yes | Admin |
| DELETE /campaigns/{id} | deleteCampaignHandler | Yes | Admin |
| POST /campaigns/{id}/panel-members | assignPanelMembersHandler | Yes | Admin |
| GET /campaigns/{id}/panel-members | getPanelMembersHandler | Yes | Admin, PanelMember |

### CategoryHandlers (Lambda functions)

| Route | Handler | Auth | Role |
|---|---|---|---|
| GET /campaigns/categories | listCategoriesHandler | Yes | All |
| POST /campaigns/categories | createCategoryHandler | Yes | Admin |
| PUT /campaigns/categories/{id} | updateCategoryHandler | Yes | Admin |
| PUT /campaigns/categories/{id}/deactivate | deactivateCategoryHandler | Yes | Admin |

### Campaign Transition Engine (internal module)
- `checkAndTransition(campaign)` — evaluates dates vs. current time, performs conditional update if transition warranted
- Used by getCampaign, listCampaigns, getActiveCampaign handlers
- Publishes EventBridge events on successful transitions

### Shared Module Additions
- `shared/types/index.ts` — Add Campaign, Category, CampaignStatus, CampaignEventPayload interfaces

## Frontend Logical Components

### CampaignService (`frontend/src/services/campaignService.ts`)
- Wraps all `/campaigns/*` API calls
- Exposes: `createCampaign()`, `listCampaigns()`, `getActiveCampaign()`, `getCampaign()`, `updateCampaign()`, `transitionStatus()`, `deleteCampaign()`, `assignPanelMembers()`, `getPanelMembers()`, `listCategories()`, `createCategory()`, `updateCategory()`, `deactivateCategory()`

### Frontend Pages
- `CampaignListPage` — campaign list with status filter
- `CampaignFormPage` — create/edit campaign form (React Hook Form)
- `CampaignDetailPage` — campaign detail with status actions and panel management
- `CategoryManagementPage` — category CRUD table with modals

### New Shared UI Components
- `StatusBadge` — colored badge for CampaignStatus
- `DateRangeDisplay` — formatted date range with label

## AWS Infrastructure Components (Unit 2 additions to template.yaml)

| Component | Change | Purpose |
|---|---|---|
| Campaign Lambda functions | Add to existing template.yaml | 9 campaign handlers + 4 category handlers |
| API Gateway routes | Add to existing HttpApi | Campaign and category REST routes |
| Campaigns Table GSI | Already provisioned in Unit 1 | Add status-createdAt-index GSI definition |
| Categories Table GSI | Already provisioned in Unit 1 | Add isActive-name-index GSI definition |
| EventBridge Rules | Add rules for campaign events | Route campaign.* events to consumers (Units 4, 6, 7) |

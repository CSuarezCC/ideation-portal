# Code Generation Plan — Unit 2: Campaign & Category Management

## Unit Context
- **Unit**: Unit 2 — Campaign & Category Management
- **Requirements Covered**: FR-03 (Campaign Management), FR-10 partial (Category Management)
- **Dependencies**: Unit 1 (auth, shared middleware, DB client, EventBridge client, types, error utilities)
- **Output**: Campaign/category backend handlers, shared types update, frontend pages/services, template.yaml updates

---

## Steps

- [x] Step 1: Shared Types Update
  - Modify `backend/src/shared/types/index.ts` — add Campaign, Category, CampaignStatus, CampaignEventPayload interfaces and new error codes
  - Modify `backend/src/shared/utils/errors.ts` — add new error codes to STATUS_MAP

- [x] Step 2: Campaign Transition Engine
  - Create `backend/src/handlers/campaigns/transitionEngine.ts` — `checkAndTransition(campaign)` function that evaluates dates vs current time, performs conditional DynamoDB update, publishes EventBridge events

- [x] Step 3: Campaign Handlers
  - Create `backend/src/handlers/campaigns/createCampaign.ts`
  - Create `backend/src/handlers/campaigns/listCampaigns.ts`
  - Create `backend/src/handlers/campaigns/getActiveCampaign.ts`
  - Create `backend/src/handlers/campaigns/getCampaign.ts`
  - Create `backend/src/handlers/campaigns/updateCampaign.ts`
  - Create `backend/src/handlers/campaigns/transitionStatus.ts`
  - Create `backend/src/handlers/campaigns/deleteCampaign.ts`
  - Create `backend/src/handlers/campaigns/assignPanelMembers.ts`
  - Create `backend/src/handlers/campaigns/getPanelMembers.ts`

- [x] Step 4: Category Handlers
  - Create `backend/src/handlers/campaigns/listCategories.ts`
  - Create `backend/src/handlers/campaigns/createCategory.ts`
  - Create `backend/src/handlers/campaigns/updateCategory.ts`
  - Create `backend/src/handlers/campaigns/deactivateCategory.ts`

- [x] Step 5: Backend Unit Tests
  - Create `backend/src/handlers/campaigns/transitionEngine.test.ts` — tests for lazy transition logic
  - Create `backend/src/handlers/campaigns/createCampaign.test.ts` — tests for campaign creation validation

- [x] Step 6: SAM Template Update
  - Modify `template.yaml` — replace campaign/category Lambda stubs with full definitions (handler paths, API events, IAM policies, GSI definitions for Campaigns and Categories tables)

- [x] Step 7: Frontend — Campaign Service
  - Create `frontend/src/services/campaignService.ts` — API client for all campaign and category endpoints

- [x] Step 8: Frontend — Shared Components
  - Create `frontend/src/components/ui/StatusBadge.tsx`
  - Create `frontend/src/components/ui/DateRangeDisplay.tsx`

- [x] Step 9: Frontend — Campaign Pages
  - Create `frontend/src/pages/admin/campaigns/CampaignListPage.tsx`
  - Create `frontend/src/pages/admin/campaigns/CampaignFormPage.tsx`
  - Create `frontend/src/pages/admin/campaigns/CampaignDetailPage.tsx`

- [x] Step 10: Frontend — Category Management Page
  - Create `frontend/src/pages/admin/categories/CategoryManagementPage.tsx`

- [x] Step 11: Frontend — Router & Navigation Update
  - Modify `frontend/src/App.tsx` — add campaign and category routes
  - Modify `frontend/src/components/layout/AppShell.tsx` — add campaign/category nav links for Admin

- [x] Step 12: Code Summary Documentation
  - Create `aidlc-docs/construction/unit-2-campaign-management/code/code-summary.md`

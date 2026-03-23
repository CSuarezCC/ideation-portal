# Deployment Architecture — Unit 2: Campaign & Category Management

## Deployment Model

Same as Unit 1 — all resources in single `template.yaml`, deployed via `sam build && sam deploy`.

Unit 2 code generation will:
1. Update existing Lambda stub definitions in `template.yaml` with correct handler paths, policies, and API events
2. Refine CampaignsTable and CategoriesTable GSI definitions
3. Add campaign handler source files to `backend/src/campaigns/`
4. Add frontend campaign/category pages and services

## API Route Map (Unit 2 additions)

```
POST   /campaigns                          → CreateCampaignFunction     [Admin]
GET    /campaigns                          → ListCampaignsFunction      [All]
GET    /campaigns/active                   → GetActiveCampaignFunction  [All]
GET    /campaigns/{id}                     → GetCampaignFunction        [All]
PUT    /campaigns/{id}                     → UpdateCampaignFunction     [Admin]
PUT    /campaigns/{id}/status              → TransitionStatusFunction   [Admin]
DELETE /campaigns/{id}                     → DeleteCampaignFunction     [Admin]
POST   /campaigns/{id}/panel-members       → AssignPanelMembersFunction [Admin]
GET    /campaigns/{id}/panel-members       → GetPanelMembersFunction    [Admin, PanelMember]
GET    /campaigns/categories               → ListCategoriesFunction     [All]
POST   /campaigns/categories               → CreateCategoryFunction     [Admin]
PUT    /campaigns/categories/{categoryId}  → UpdateCategoryFunction     [Admin]
PUT    /campaigns/categories/{categoryId}/deactivate → DeactivateCategoryFunction [Admin]
```

## EventBridge Events (published by Unit 2)

| Detail Type | Source | Published When |
|---|---|---|
| CampaignActivated | ideation-portal | Campaign → ACTIVE (manual or auto) |
| CampaignEvaluationStarted | ideation-portal | Campaign → EVALUATION (manual or auto) |
| CampaignClosed | ideation-portal | Campaign → CLOSED (manual or auto) |

These events will be consumed by Units 4, 6, and 7 (EventBridge rules added in those units).

## Architecture Diagram (Unit 2 additions highlighted)

```
                    API Gateway (HTTP API)
                           |
              Lambda Authorizer (Unit 1)
                           |
         +-----------------+-----------------+
         |                 |                 |
    Auth/User         Campaign          Category
    Lambdas (U1)     Lambdas (U2)      Lambdas (U2)
         |                 |                 |
         v                 v                 v
    UsersTable      CampaignsTable    CategoriesTable
    (DynamoDB)       (DynamoDB)        (DynamoDB)
                           |
                           v
                    EventBridge Bus
                    (campaign.* events)
```

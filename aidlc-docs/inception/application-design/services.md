# Services — Ideation Portal

## Service Architecture Overview

The Ideation Portal uses a serverless service architecture where each service maps to one or more AWS Lambda functions, exposed via API Gateway routes and/or triggered by EventBridge events.

```
API Gateway (REST)
    |
    +-- /auth/*          --> AuthService (Lambda)
    +-- /users/*         --> UserService (Lambda)
    +-- /campaigns/*     --> CampaignService (Lambda)
    +-- /ideas/*         --> IdeaService (Lambda)
    +-- /evaluations/*   --> EvaluationService (Lambda)
    +-- /dashboard/*     --> DashboardService (Lambda)
    +-- /analytics/*     --> AnalyticsService (Lambda)
    +-- /notifications/* --> NotificationService (Lambda)
    +-- /recognition/*   --> RecognitionService (Lambda)

EventBridge (Async)
    |
    +-- idea.submitted              --> NotificationService
    +-- campaign.activated          --> NotificationService
    +-- campaign.evaluation-started --> EvaluationService, NotificationService
    +-- campaign.closed             --> RecognitionService, NotificationService
    +-- evaluation.submitted        --> EvaluationService (aggregation check)
    +-- evaluation.aggregation-complete --> DashboardService (cache invalidation), NotificationService
    +-- recognition.winners-announced   --> NotificationService
```

---

## Service 1: AuthService

**Type**: API Lambda + Cognito Integration

**Responsibilities**:
- Wraps Amazon Cognito User Pool operations
- Handles registration, login, token refresh, password reset
- Provides Lambda Authorizer function for API Gateway JWT validation

**API Routes**:
| Method | Path | Handler | Auth Required |
|---|---|---|---|
| POST | /auth/register | registerUser | No |
| POST | /auth/login | loginUser | No |
| POST | /auth/refresh | refreshToken | No |
| POST | /auth/confirm | confirmAccount | No |
| POST | /auth/forgot-password | initiatePasswordReset | No |
| POST | /auth/reset-password | confirmPasswordReset | No |

**Lambda Authorizer**: Validates JWT on all protected routes, injects `userId`, `email`, `role` into request context.

---

## Service 2: UserService

**Type**: API Lambda

**Responsibilities**:
- CRUD operations on user profiles
- Role management (Admin only)

**API Routes**:
| Method | Path | Handler | Auth Required | Roles |
|---|---|---|---|---|
| GET | /users/me | getUserProfile | Yes | All |
| PUT | /users/me | updateUserProfile | Yes | All |
| GET | /users | listUsers | Yes | Admin |
| PUT | /users/{userId}/role | assignRole | Yes | Admin |
| DELETE | /users/{userId} | deactivateUser | Yes | Admin |

---

## Service 3: CampaignService

**Type**: API Lambda + EventBridge Publisher

**Responsibilities**:
- Campaign CRUD and lifecycle management
- Panel member assignment
- Category management
- Publishes campaign lifecycle events to EventBridge

**API Routes**:
| Method | Path | Handler | Auth Required | Roles |
|---|---|---|---|---|
| POST | /campaigns | createCampaign | Yes | Admin |
| GET | /campaigns | listCampaigns | Yes | All |
| GET | /campaigns/active | getActiveCampaign | Yes | All |
| GET | /campaigns/{id} | getCampaign | Yes | All |
| PUT | /campaigns/{id} | updateCampaign | Yes | Admin |
| PUT | /campaigns/{id}/status | transitionCampaignStatus | Yes | Admin |
| POST | /campaigns/{id}/panel-members | assignPanelMembers | Yes | Admin |
| GET | /campaigns/{id}/panel-members | getPanelMembers | Yes | Admin, PanelMember |
| GET | /campaigns/{id}/categories | listCategories | Yes | All |
| POST | /campaigns/categories | createCategory | Yes | Admin |
| PUT | /campaigns/categories/{id} | updateCategory | Yes | Admin |

**Events Published**: `campaign.activated`, `campaign.evaluation-started`, `campaign.closed`

---

## Service 4: IdeaService

**Type**: API Lambda + EventBridge Publisher

**Responsibilities**:
- Idea draft and submission management
- File attachment handling via S3 pre-signed URLs
- Idea listing, filtering, and search

**API Routes**:
| Method | Path | Handler | Auth Required | Roles |
|---|---|---|---|---|
| POST | /ideas/draft | createDraft | Yes | Employee, Admin |
| PUT | /ideas/{id}/draft | updateDraft | Yes | Employee, Admin |
| PUT | /ideas/{id}/autosave | autoSaveDraft | Yes | Employee, Admin |
| POST | /ideas/{id}/submit | submitIdea | Yes | Employee, Admin |
| DELETE | /ideas/{id} | deleteDraft | Yes | Employee, Admin |
| GET | /ideas | listIdeas | Yes | All |
| GET | /ideas/mine | getMyIdeas | Yes | All |
| GET | /ideas/{id} | getIdea | Yes | All |
| POST | /ideas/{id}/upload-url | getUploadUrl | Yes | Employee, Admin |

**Events Published**: `idea.submitted`

---

## Service 5: EvaluationService

**Type**: API Lambda + EventBridge Consumer/Publisher

**Responsibilities**:
- Blind scoring workflow for Panel Members
- Score aggregation trigger and calculation
- Enforces blind scoring rules at API level

**API Routes**:
| Method | Path | Handler | Auth Required | Roles |
|---|---|---|---|---|
| GET | /evaluations/ideas | getIdeasForEvaluation | Yes | PanelMember, Admin |
| GET | /evaluations/pending | getPendingEvaluations | Yes | PanelMember |
| GET | /evaluations/{ideaId}/mine | getMyEvaluation | Yes | PanelMember |
| PUT | /evaluations/{ideaId}/progress | saveEvaluationProgress | Yes | PanelMember |
| POST | /evaluations/{ideaId}/submit | submitEvaluation | Yes | PanelMember |
| GET | /evaluations/{ideaId}/summary | getEvaluationSummary | Yes | PanelMember, Admin |
| GET | /evaluations/{ideaId}/score | getAggregatedScore | Yes | All |

**Events Consumed**: `campaign.evaluation-started`
**Events Published**: `evaluation.submitted`, `evaluation.aggregation-complete`

---

## Service 6: DashboardService

**Type**: API Lambda + EventBridge Consumer

**Responsibilities**:
- Leaderboard and dashboard data serving
- Near-real-time data refresh on aggregation events

**API Routes**:
| Method | Path | Handler | Auth Required | Roles |
|---|---|---|---|---|
| GET | /dashboard/leaderboard | getLeaderboard | Yes | All |
| GET | /dashboard/summary | getLeaderboardSummary | Yes | All |
| GET | /dashboard/ideas/{id} | getIdeaDetail | Yes | All |
| GET | /dashboard/search | searchIdeas | Yes | All |

**Events Consumed**: `evaluation.aggregation-complete` (for cache/data refresh)

---

## Service 7: AnalyticsService

**Type**: API Lambda

**Responsibilities**:
- Analytics queries for Admins and Panel Members

**API Routes**:
| Method | Path | Handler | Auth Required | Roles |
|---|---|---|---|---|
| GET | /analytics/top-ideas | getTopIdeas | Yes | Admin, PanelMember |
| GET | /analytics/comparative | getComparativeAnalysis | Yes | Admin, PanelMember |
| GET | /analytics/participation | getParticipationMetrics | Yes | Admin, PanelMember |
| GET | /analytics/distribution | getScoreDistribution | Yes | Admin, PanelMember |
| GET | /analytics/campaign-summary | getCampaignSummary | Yes | Admin, PanelMember |

---

## Service 8: NotificationService

**Type**: API Lambda + EventBridge Consumer

**Responsibilities**:
- In-portal notification CRUD
- Async event consumption to create notifications

**API Routes**:
| Method | Path | Handler | Auth Required | Roles |
|---|---|---|---|---|
| GET | /notifications | getNotifications | Yes | All |
| GET | /notifications/unread-count | getUnreadCount | Yes | All |
| PUT | /notifications/{id}/read | markAsRead | Yes | All |
| PUT | /notifications/read-all | markAllAsRead | Yes | All |

**Events Consumed**: `idea.submitted`, `campaign.activated`, `campaign.evaluation-started`, `campaign.closed`, `recognition.winners-announced`

---

## Service 9: RecognitionService

**Type**: EventBridge Consumer + EventBridge Publisher

**Responsibilities**:
- Triggered by `campaign.closed` event
- Determines top 3 winners, assigns badges, creates announcement
- No direct API routes (event-driven only, with read endpoints)

**API Routes**:
| Method | Path | Handler | Auth Required | Roles |
|---|---|---|---|---|
| GET | /recognition/{campaignId}/winners | getWinners | Yes | All |
| GET | /recognition/{campaignId}/announcement | getWinnerAnnouncement | Yes | All |

**Events Consumed**: `campaign.closed`
**Events Published**: `recognition.winners-announced`

---

## Shared Infrastructure Services

| Service | AWS Resource | Purpose |
|---|---|---|
| API Gateway | AWS API Gateway (HTTP API) | Single entry point for all REST calls |
| Lambda Authorizer | AWS Lambda | JWT validation + role injection |
| Event Bus | Amazon EventBridge | Async event routing between services |
| Object Storage | Amazon S3 | Idea attachment storage |
| CDN | Amazon CloudFront | Frontend SPA delivery |
| Auth Provider | Amazon Cognito User Pool | User identity and JWT issuance |
| Database | Amazon DynamoDB | All persistent data storage |

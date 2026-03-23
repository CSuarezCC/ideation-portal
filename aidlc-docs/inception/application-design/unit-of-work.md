# Units of Work — Ideation Portal

## Decomposition Strategy

The system is decomposed into **7 units of work**, each corresponding to a cohesive set of backend services and frontend features. Units are ordered by dependency — earlier units must be completed before later units can be built and tested end-to-end.

**Code Organization**: Monorepo with the following top-level structure:

```
/                               # Workspace root
├── template.yaml               # AWS SAM — all infrastructure defined here
├── frontend/                   # React SPA (TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/           # API client modules
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
├── backend/                    # All Lambda functions (TypeScript)
│   ├── src/
│   │   ├── handlers/           # Thin Lambda entry points
│   │   │   ├── auth/           # Unit 1
│   │   │   ├── users/          # Unit 1
│   │   │   ├── campaigns/      # Unit 2
│   │   │   ├── ideas/          # Unit 3
│   │   │   ├── evaluations/    # Unit 4
│   │   │   ├── dashboard/      # Unit 5
│   │   │   ├── analytics/      # Unit 5
│   │   │   ├── notifications/  # Unit 6
│   │   │   └── recognition/    # Unit 7
│   │   ├── services/           # Reusable business logic
│   │   ├── repositories/       # Data access layer (DynamoDB)
│   │   └── shared/             # Shared types, middleware, utilities
│   │       ├── middleware/     # JWT authorizer, RBAC helpers
│   │       ├── types/          # Shared TypeScript interfaces
│   │       ├── db/             # DynamoDB client wrapper
│   │       └── events/         # EventBridge client wrapper
│   ├── package.json
│   └── tsconfig.json
└── aidlc-docs/                 # Documentation only
```

---

## Unit 1: Foundation — Infrastructure, Auth & User Management

**Scope**: The foundational layer that all other units depend on. Includes all shared AWS infrastructure, authentication, and user/role management.

**Components**:
- AuthComponent (Cognito User Pool, Lambda Authorizer)
- UserComponent (UserService Lambda)
- Shared backend middleware (JWT validation, RBAC enforcement)
- Core SAM template.yaml skeleton (API Gateway, Cognito, DynamoDB base tables, EventBridge custom bus, S3, CloudFront)
- Frontend auth pages (Login, Register, Password Reset)
- Frontend user profile page

**Deliverables**:
- `template.yaml` — full SAM infrastructure skeleton (all tables, all Lambda stubs, API Gateway, Cognito, EventBridge bus, S3, CloudFront)
- `backend/src/handlers/auth/` — register, login, refresh, confirm, password reset handlers
- `backend/src/handlers/users/` — profile CRUD, role assignment, user listing handlers
- `backend/src/shared/middleware/` — Lambda Authorizer, RBAC middleware
- `backend/src/shared/db/` — DynamoDB client wrapper
- `backend/src/shared/events/` — EventBridge publisher wrapper
- `frontend/src/pages/auth/` — Login, Register, PasswordReset pages
- `frontend/src/pages/profile/` — User profile page
- `frontend/src/services/authService.ts` — API client for auth endpoints

**Key Outcomes**:
- All users can register, log in, and receive JWT tokens
- Admin can assign roles to users
- Lambda Authorizer validates all protected routes
- All DynamoDB tables provisioned (even if empty)
- EventBridge custom bus created

---

## Unit 2: Campaign & Category Management

**Scope**: Admin-facing campaign lifecycle management and category configuration.

**Components**:
- CampaignComponent (CampaignService Lambda)
- Campaign lifecycle state machine
- Category management

**Deliverables**:
- `backend/src/handlers/campaigns/` — campaign CRUD, status transitions, panel member assignment, category management handlers
- `frontend/src/pages/admin/campaigns/` — Campaign list, create/edit, status management UI
- `frontend/src/pages/admin/categories/` — Category management UI
- `frontend/src/services/campaignService.ts` — API client for campaign endpoints
- EventBridge event publishing for campaign lifecycle events

**Key Outcomes**:
- Admin can create campaigns, manage their lifecycle (Draft → Active → Evaluation → Closed)
- Admin can assign panel members to campaigns
- Admin can manage idea categories
- Campaign lifecycle events published to EventBridge

**Depends On**: Unit 1 (auth, user roles, shared infrastructure)

---

## Unit 3: Idea Submission

**Scope**: Employee-facing idea submission experience including drafts, auto-save, categorization, and file attachments.

**Components**:
- IdeaComponent (IdeaService Lambda)
- S3 attachment handling

**Deliverables**:
- `backend/src/handlers/ideas/` — draft CRUD, auto-save, submit, delete, list/search, S3 pre-signed URL handlers
- `frontend/src/pages/ideas/` — Idea submission form (with auto-save), My Ideas list, Idea detail view
- `frontend/src/services/ideaService.ts` — API client for idea endpoints
- EventBridge event publishing for `idea.submitted`

**Key Outcomes**:
- Employees can create, save, and submit ideas
- Draft auto-save works on 30-second timer
- File attachments upload via S3 pre-signed URLs
- Ideas are filterable by campaign, category, status, keyword

**Depends On**: Unit 1 (auth), Unit 2 (active campaign context, categories)

---

## Unit 4: Evaluation Engine

**Scope**: Panel Member blind scoring workflow, score aggregation, and evaluation data management.

**Components**:
- EvaluationComponent (EvaluationService Lambda)
- Blind scoring enforcement logic
- Async score aggregation via EventBridge

**Deliverables**:
- `backend/src/handlers/evaluations/` — evaluation CRUD, blind scoring enforcement, aggregation trigger, aggregated score storage handlers
- `frontend/src/pages/evaluation/` — Evaluation queue (ideas to score), Scoring form (3 dimensions + justifications), Evaluation progress view
- `frontend/src/services/evaluationService.ts` — API client for evaluation endpoints
- EventBridge event publishing for `evaluation.submitted`, `evaluation.aggregation-complete`

**Key Outcomes**:
- Panel Members can independently score ideas across 3 dimensions with justifications
- Blind scoring enforced server-side (no peeking at others' scores before submitting own)
- Scores locked after submission
- Aggregated scores calculated automatically when all panel members have scored an idea

**Depends On**: Unit 1 (auth, RBAC), Unit 2 (campaign/panel assignments), Unit 3 (ideas)

---

## Unit 5: Dashboards, Leaderboard & Analytics

**Scope**: Real-time leaderboard, multi-dimensional dashboard views, and analytics for Admins and Panel Members.

**Components**:
- DashboardComponent (DashboardService Lambda)
- AnalyticsComponent (AnalyticsService Lambda)

**Deliverables**:
- `backend/src/handlers/dashboard/` — leaderboard, idea detail, search handlers
- `backend/src/handlers/analytics/` — top ideas, comparative analysis, participation metrics, score distribution, campaign summary handlers
- `frontend/src/pages/dashboard/` — Leaderboard page (multi-dimensional tabs), Idea detail modal/page
- `frontend/src/pages/analytics/` — Analytics dashboard (top ideas, charts, participation stats)
- `frontend/src/services/dashboardService.ts` — API client for dashboard endpoints
- `frontend/src/services/analyticsService.ts` — API client for analytics endpoints

**Key Outcomes**:
- All users can view the leaderboard ranked by composite, feasibility, impact, or innovation score
- Admins and Panel Members can access full analytics views
- Dashboard data refreshes in near-real-time as evaluations complete

**Depends On**: Unit 1 (auth), Unit 3 (ideas), Unit 4 (aggregated scores)

---

## Unit 6: Notifications

**Scope**: In-portal notification system, fully event-driven via EventBridge.

**Components**:
- NotificationComponent (NotificationService Lambda — API + event consumer)

**Deliverables**:
- `backend/src/handlers/notifications/` — notification CRUD handlers (API) + EventBridge consumer handler
- `frontend/src/components/NotificationBell.tsx` — notification bell with unread count badge
- `frontend/src/pages/notifications/` — Notification center page
- `frontend/src/services/notificationService.ts` — API client for notification endpoints

**Key Outcomes**:
- Users receive in-portal notifications for all key events (idea submitted, campaign status changes, evaluation complete, winners announced)
- Notification bell shows unread count
- Users can mark notifications as read

**Depends On**: Unit 1 (auth), EventBridge events from Units 2, 3, 4, 7

---

## Unit 7: Recognition System

**Scope**: Automated top-3 winner identification, badge assignment, winner announcement, and admin notification.

**Components**:
- RecognitionComponent (RecognitionService Lambda — event consumer + API)

**Deliverables**:
- `backend/src/handlers/recognition/` — winner determination, badge assignment, announcement creation handlers + EventBridge consumer
- `frontend/src/pages/recognition/` — Winners announcement page, winner badges on idea cards and user profiles
- `frontend/src/services/recognitionService.ts` — API client for recognition endpoints
- EventBridge event publishing for `recognition.winners-announced`

**Key Outcomes**:
- Top 3 ideas automatically identified when campaign closes
- Gold/Silver/Bronze badges assigned to ideas and submitter profiles
- Winner announcement visible to all portal users
- Admin notified to follow up with HR/management

**Depends On**: Unit 1 (auth), Unit 4 (aggregated scores), Unit 6 (notifications for winner alerts)

---

## Unit Summary Table

| Unit | Name | Key Components | Depends On |
|---|---|---|---|
| 1 | Foundation — Infra, Auth & Users | AuthComponent, UserComponent, SAM template | — |
| 2 | Campaign & Category Management | CampaignComponent | Unit 1 |
| 3 | Idea Submission | IdeaComponent | Units 1, 2 |
| 4 | Evaluation Engine | EvaluationComponent | Units 1, 2, 3 |
| 5 | Dashboards, Leaderboard & Analytics | DashboardComponent, AnalyticsComponent | Units 1, 3, 4 |
| 6 | Notifications | NotificationComponent | Units 1, 2, 3, 4, 7 (events) |
| 7 | Recognition System | RecognitionComponent | Units 1, 4, 6 |

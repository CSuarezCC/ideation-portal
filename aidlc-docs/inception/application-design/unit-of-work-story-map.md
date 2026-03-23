# Unit of Work Story Map — Ideation Portal

> Note: User Stories stage was skipped (requirements were sufficiently detailed). This story map is derived directly from the functional requirements (FR-01 through FR-10) and maps each requirement to its implementing unit.

---

## Unit 1: Foundation — Infrastructure, Auth & User Management

| Requirement | Description |
|---|---|
| FR-01 | User Authentication & Account Management |
| NFR-01 (partial) | SAM template.yaml skeleton, Cognito, API Gateway, DynamoDB tables, EventBridge bus, S3, CloudFront |
| NFR-02 | Scalability — on-demand DynamoDB, Lambda auto-scaling |
| NFR-04 | Availability — serverless managed services |
| NFR-06 | Maintainability — shared middleware, DynamoDB client, EventBridge client |

**Key Capabilities Delivered**:
- Register / Login / Password Reset
- JWT token issuance and validation
- Role assignment (Employee, Panel Member, Admin)
- All AWS infrastructure provisioned

---

## Unit 2: Campaign & Category Management

| Requirement | Description |
|---|---|
| FR-03 | Campaign Management (Admin) |
| FR-10 (partial) | Category management (admin-configurable categories) |

**Key Capabilities Delivered**:
- Create and manage campaigns with lifecycle transitions
- Assign panel members to campaigns
- Manage idea categories
- Campaign lifecycle events published to EventBridge

---

## Unit 3: Idea Submission

| Requirement | Description |
|---|---|
| FR-02 | Idea Submission (structured form, draft saving, file attachments) |
| FR-10 (partial) | Idea categorization and filtering |
| NFR-07 (partial) | Draft auto-save every 30 seconds |
| NFR-08 | Data retention (ideas retained indefinitely; drafts 90-day expiry) |

**Key Capabilities Delivered**:
- Structured idea submission form
- Draft creation, auto-save, edit, delete
- Idea submission to active campaign
- File attachment upload via S3 pre-signed URLs
- Idea listing with filtering (campaign, category, status, keyword)

---

## Unit 4: Evaluation Engine

| Requirement | Description |
|---|---|
| FR-04 | Idea Evaluation (blind scoring, 3 dimensions, justifications) |
| FR-05 | Score Aggregation (per-dimension averages, composite score) |
| NFR-03 (partial) | Dashboard refresh within 5s of new evaluation (aggregation trigger) |
| NFR-05 (partial) | Blind scoring enforced server-side |

**Key Capabilities Delivered**:
- Panel Members score ideas independently (Feasibility, Impact, Innovation 1–10)
- Free-text justification per dimension
- Blind scoring enforced — no peeking before submitting own scores
- Scores locked after submission
- Automatic aggregation when all panel members have scored

---

## Unit 5: Dashboards, Leaderboard & Analytics

| Requirement | Description |
|---|---|
| FR-06 | Dashboards & Leaderboards (real-time, multi-dimensional) |
| FR-07 | Analytics (top ideas, comparative analysis, participation metrics) |
| NFR-03 | Performance — API responses under 2s, dashboard refresh under 5s |
| NFR-07 (partial) | Leaderboard accessible without Panel Member/Admin role |

**Key Capabilities Delivered**:
- Real-time leaderboard ranked by composite, feasibility, impact, or innovation
- Full score breakdowns for Admin/Panel Member
- Analytics: top ideas, comparative analysis, score distributions, participation metrics
- Campaign-level summary statistics

---

## Unit 6: Notifications

| Requirement | Description |
|---|---|
| FR-09 | In-Portal Notifications (all key events) |

**Key Capabilities Delivered**:
- Notification bell with unread count
- Notifications for: idea submitted, campaign status changes, evaluation complete, winners announced, admin recognition alert
- Mark as read / mark all as read

---

## Unit 7: Recognition System

| Requirement | Description |
|---|---|
| FR-08 | Recognition System (top 3 ideas, badges, announcement, admin notification) |

**Key Capabilities Delivered**:
- Automatic top-3 identification on campaign close
- Gold/Silver/Bronze badge assignment
- Winner announcement visible to all users
- Admin notified to follow up with HR/management

---

## Full Requirement Coverage Matrix

| Requirement | Unit | Status |
|---|---|---|
| FR-01: Auth & Account Management | Unit 1 | Covered |
| FR-02: Idea Submission | Unit 3 | Covered |
| FR-03: Campaign Management | Unit 2 | Covered |
| FR-04: Idea Evaluation | Unit 4 | Covered |
| FR-05: Score Aggregation | Unit 4 | Covered |
| FR-06: Dashboards & Leaderboards | Unit 5 | Covered |
| FR-07: Analytics | Unit 5 | Covered |
| FR-08: Recognition System | Unit 7 | Covered |
| FR-09: In-Portal Notifications | Unit 6 | Covered |
| FR-10: Categorization & Filtering | Units 2, 3 | Covered |
| NFR-01: Technology Stack | Unit 1 | Covered |
| NFR-02: Scalability | Unit 1 | Covered |
| NFR-03: Performance | Units 4, 5 | Covered |
| NFR-04: Availability | Unit 1 | Covered |
| NFR-05: Security | Units 1, 4 | Covered |
| NFR-06: Maintainability | Unit 1 | Covered |
| NFR-07: Usability | Units 3, 5 | Covered |
| NFR-08: Data Retention | Unit 3 | Covered |

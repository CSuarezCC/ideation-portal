# Requirements Document — Ideation Portal

## Intent Analysis Summary

- **User Request**: Build a digital Ideation Portal enabling employees to submit, evaluate, score, and recognize innovative ideas within an organization.
- **Request Type**: New Project (Greenfield)
- **Scope Estimate**: System-wide — multiple components (frontend, backend API, async event processing, database, notifications, dashboards)
- **Complexity Estimate**: Complex — multi-role access control, blind evaluation workflow, real-time dashboards, campaign lifecycle management, recognition system

---

## Functional Requirements

### FR-01: User Authentication & Account Management
- The system shall support username/password authentication with local accounts managed by the portal.
- The system shall enforce role-based access control (RBAC) with three roles: **Employee**, **Panel Member**, and **Admin**.
- Admins shall be able to create, deactivate, and assign roles to user accounts.
- Sessions shall be managed securely with token-based authentication (JWT).

### FR-02: Idea Submission
- Employees shall be able to submit ideas through a structured submission form with the following fields:
  - Title (required)
  - Description / Problem Statement (required)
  - Proposed Solution (required)
  - Expected Benefits (required)
  - Category / Tag (required, selectable from predefined list)
  - Supporting attachments (optional, file upload)
- Employees shall be able to save ideas as **drafts** and return to complete them later.
- Employees shall be able to edit or delete their own draft ideas before submission.
- Submitted ideas shall be associated with the active campaign at time of submission.
- Employees shall be able to view the status of their submitted ideas (Draft, Submitted, Under Review, Evaluated, Winner).

### FR-03: Campaign Management (Admin)
- Admins shall be able to create named **innovation campaigns** with:
  - Campaign name and description
  - Start date and end date for submissions
  - Evaluation period start and end dates
  - Status (Draft, Active, Evaluation, Closed)
- Admins shall be able to assign Panel Members to specific campaigns.
- Admins shall be able to manage idea categories (add, edit, deactivate).
- Only one campaign may be in Active (submission) status at a time per configuration.

### FR-04: Idea Evaluation (Panel Members)
- Panel Members shall be able to view all submitted ideas assigned to their campaign.
- Panel Members shall independently score each idea across three fixed dimensions:
  - **Feasibility** (1–10 scale)
  - **Impact** (1–10 scale)
  - **Innovation** (1–10 scale)
- Each dimension shall include a mandatory **free-text justification** field.
- Scoring shall be **blind**: Panel Members cannot see other panel members' scores until they have submitted their own scores for that idea.
- Panel Members shall be able to save scoring progress and return to complete evaluations.
- Once a Panel Member submits scores for an idea, scores shall be locked and not editable.

### FR-05: Score Aggregation
- The system shall automatically aggregate scores from all Panel Members for each idea.
- Aggregated score per idea = average of all panel members' scores across all three dimensions.
- A composite score shall be calculated as the average of the three dimension averages.
- Aggregated scores shall be visible on dashboards once the evaluation period closes (or per admin configuration).

### FR-06: Dashboards & Leaderboards
- A **real-time leaderboard** shall display all evaluated ideas ranked by composite score.
- The dashboard shall support multi-dimensional comparative views:
  - Ranking by Feasibility score
  - Ranking by Impact score
  - Ranking by Innovation score
  - Ranking by composite score
- Employees shall see a public leaderboard of ideas (anonymized or attributed per admin setting).
- Panel Members and Admins shall see full scoring breakdowns per idea.
- Dashboards shall update in near-real-time as evaluations are submitted.

### FR-07: Analytics
- Admins and Panel Members shall have access to an analytics view showing:
  - Top-performing ideas with score breakdowns
  - Comparative analysis across evaluation criteria
  - Participation metrics (number of ideas submitted, evaluated, pending)
  - Score distribution charts per dimension
  - Campaign-level summary statistics

### FR-08: Recognition System
- The system shall automatically identify the **top 3 highest-scoring ideas** at campaign close.
- Top 3 ideas shall receive:
  - A **digital badge/certificate** displayed on their idea profile and the winner's user profile
  - Prominent highlighting on the leaderboard (e.g., Gold, Silver, Bronze designation)
  - A formal **winner announcement** visible to all portal users
- The system shall send an **in-portal notification** to the idea submitters of the top 3 ideas.
- The system shall trigger a **notification to Admin** to follow up with HR/management for any offline rewards or formal recognition.

### FR-09: In-Portal Notifications
- The system shall deliver in-portal notifications for the following events:
  - Idea successfully submitted
  - Idea status change (e.g., moved to evaluation, evaluated)
  - Campaign status change (new campaign opened, evaluation period started, campaign closed)
  - Winner announcement (top 3 ideas recognized)
  - Admin alert when recognition workflow is triggered
- Notifications shall be visible in a notification center/bell icon in the UI.
- Users shall be able to mark notifications as read.

### FR-10: Idea Categorization & Filtering
- Ideas shall be tagged with one or more categories from an admin-managed list.
- All idea listing views shall support filtering by:
  - Category
  - Campaign
  - Status
  - Submission date range
- Search functionality shall allow keyword search across idea titles and descriptions.

---

## Non-Functional Requirements

### NFR-01: Technology Stack
- **Frontend**: React with TypeScript (SPA)
- **Backend**: Node.js with TypeScript, deployed as **AWS Lambda functions** (serverless)
- **API Layer**: AWS API Gateway (REST or HTTP API)
- **Async Event Processing**: AWS EventBridge or SQS/SNS for asynchronous workflows (e.g., score aggregation triggers, notification dispatch, recognition workflow)
- **Infrastructure as Code**: All AWS resources defined in **`template.yaml`** (AWS SAM)
- **Database**: Amazon DynamoDB (NoSQL)
- **File Storage**: Amazon S3 (for idea attachments)
- **Authentication**: Amazon Cognito (User Pools) for local username/password auth with JWT tokens
- **Frontend Hosting**: AWS S3 + CloudFront

### NFR-02: Scalability
- The system shall support 500–5,000 concurrent users.
- Serverless architecture (Lambda + DynamoDB) shall auto-scale to handle submission and evaluation bursts.
- DynamoDB tables shall use on-demand capacity mode.

### NFR-03: Performance
- API responses shall complete within 2 seconds under normal load (p95).
- Dashboard and leaderboard data shall refresh within 5 seconds of a new evaluation being submitted.
- Frontend initial load time shall be under 3 seconds on a standard broadband connection.

### NFR-04: Availability
- The system shall target 99.9% uptime leveraging AWS managed services.
- No single point of failure — serverless and managed services provide inherent redundancy.

### NFR-05: Security (Baseline — not enforced as blocking constraints per user selection)
- All API endpoints shall require valid JWT authentication (except login/register).
- RBAC shall be enforced at the API layer — Panel Member and Admin endpoints shall reject unauthorized roles.
- Blind scoring shall be enforced server-side — the API shall not return other panel members' scores until the requesting panel member has submitted their own.
- Idea attachments stored in S3 shall use pre-signed URLs with short expiry for access.
- All data in transit shall use HTTPS/TLS.
- DynamoDB data at rest shall use AWS-managed encryption.

### NFR-06: Maintainability
- All infrastructure defined in `template.yaml` (AWS SAM) for repeatable deployments.
- Backend Lambda functions shall be organized by domain (ideas, evaluations, campaigns, users, notifications, analytics).
- Frontend shall follow component-based architecture with clear separation of concerns.

### NFR-07: Usability
- The submission interface shall be intuitive and completable in under 5 minutes for a standard idea.
- Draft auto-save shall trigger every 30 seconds while the user is actively editing.
- The leaderboard and dashboards shall be accessible without requiring Panel Member or Admin roles.

### NFR-08: Data Retention
- Submitted ideas and evaluation data shall be retained indefinitely (no automatic deletion).
- Draft ideas shall be retained for 90 days of inactivity before expiry notification.

---

## User Roles Summary

| Role | Key Capabilities |
|---|---|
| Employee | Register, login, submit ideas, save drafts, view own ideas, view leaderboard, receive notifications |
| Panel Member | All Employee capabilities + view assigned campaign ideas, score ideas (blind), view full score breakdowns, access analytics |
| Admin | All Panel Member capabilities + manage campaigns, manage users/roles, manage categories, view all analytics, trigger recognition workflow |

---

## Campaign Lifecycle

```
Draft --> Active (Submissions Open) --> Evaluation Period --> Closed --> Winners Announced
```

---

## Key Constraints
- Deployment target: AWS Cloud (serverless-first)
- Infrastructure: AWS SAM (`template.yaml`)
- No email notifications (in-portal only)
- No external HR system integration required beyond Admin notification
- No regulatory compliance requirements (standard internal data handling)
- Security extension rules: not enforced as blocking constraints (PoC/prototype-friendly)

# Components — Ideation Portal

## Overview

The Ideation Portal is composed of eight backend components (Lambda-based services) and one frontend component, all deployed on AWS serverless infrastructure.

---

## Component 1: AuthComponent

**Purpose**: Manages user authentication and session handling via Amazon Cognito.

**Responsibilities**:
- Register new users (Employee role by default)
- Authenticate users and issue JWT tokens via Cognito User Pool
- Validate JWT tokens on incoming API requests (middleware/authorizer)
- Support password reset and account confirmation flows
- Expose user identity claims (userId, email, role) to downstream components

**Interfaces**:
- Input: Registration request (email, password, name), Login request (email, password)
- Output: JWT access token, refresh token, user identity object
- AWS Integration: Amazon Cognito User Pool, Lambda Authorizer for API Gateway

---

## Component 2: UserComponent

**Purpose**: Manages user profiles and role assignments within the portal.

**Responsibilities**:
- Store and retrieve user profile data (name, department, avatar)
- Assign and update user roles (Employee, Panel Member, Admin)
- List users with role filtering (Admin only)
- Deactivate user accounts (Admin only)
- Provide user lookup by userId for other components

**Interfaces**:
- Input: User profile data, role assignment requests
- Output: User profile objects, paginated user lists
- Storage: DynamoDB `Users` table
- Caller: Admin UI, other components needing user context

---

## Component 3: CampaignComponent

**Purpose**: Manages the full lifecycle of innovation campaigns.

**Responsibilities**:
- Create, update, and delete campaigns (Admin only)
- Manage campaign status transitions: Draft → Active → Evaluation → Closed → Announced
- Enforce one active campaign at a time
- Assign Panel Members to campaigns
- Manage idea categories (create, edit, deactivate) per campaign
- Expose active campaign context to idea submission

**Interfaces**:
- Input: Campaign creation/update requests, panel member assignment, category management
- Output: Campaign objects, category lists, panel assignment records
- Storage: DynamoDB `Campaigns` table, `Categories` table
- Events Published: `campaign.activated`, `campaign.evaluation-started`, `campaign.closed`

---

## Component 4: IdeaComponent

**Purpose**: Manages the full lifecycle of idea submissions including drafts.

**Responsibilities**:
- Create and save idea drafts (auto-save support)
- Submit ideas to the active campaign
- Edit and delete own draft ideas
- Retrieve ideas by campaign, category, status, or submitter
- Handle file attachment upload via S3 pre-signed URLs
- Track idea status transitions: Draft → Submitted → Under Review → Evaluated → Winner

**Interfaces**:
- Input: Idea form data (title, description, solution, benefits, category, attachments)
- Output: Idea objects, draft objects, S3 pre-signed upload URLs
- Storage: DynamoDB `Ideas` table, Amazon S3 (attachments)
- Events Published: `idea.submitted`

---

## Component 5: EvaluationComponent

**Purpose**: Manages the blind scoring workflow for Panel Members.

**Responsibilities**:
- Allow Panel Members to score ideas across three dimensions (Feasibility, Impact, Innovation, 1–10)
- Capture free-text justification per dimension
- Enforce blind scoring: hide other panel members' scores until the requesting member has submitted their own
- Save evaluation progress (partial scores)
- Lock scores once submitted by a panel member
- Trigger score aggregation when all assigned panel members have scored an idea
- Calculate and store aggregated scores (per-dimension average + composite)

**Interfaces**:
- Input: Score submission (ideaId, panelMemberId, dimension scores, justifications)
- Output: Evaluation records, aggregated score objects
- Storage: DynamoDB `Evaluations` table, `AggregatedScores` table
- Events Published: `evaluation.submitted`, `evaluation.aggregation-complete`
- Events Consumed: `campaign.evaluation-started`

---

## Component 6: DashboardComponent

**Purpose**: Provides real-time leaderboard and multi-dimensional dashboard data.

**Responsibilities**:
- Serve leaderboard data ranked by composite score
- Serve dimension-specific rankings (Feasibility, Impact, Innovation)
- Provide idea detail view with full score breakdown (role-dependent visibility)
- Support filtering by campaign, category, and date range
- Support keyword search across idea titles and descriptions
- Refresh data in near-real-time as evaluations are submitted

**Interfaces**:
- Input: Query parameters (campaign, category, dimension, filters)
- Output: Ranked idea lists, score breakdowns, filter metadata
- Storage: DynamoDB `AggregatedScores` table, `Ideas` table (read)
- Events Consumed: `evaluation.aggregation-complete`

---

## Component 7: AnalyticsComponent

**Purpose**: Provides aggregated analytics and comparative analysis for Admins and Panel Members.

**Responsibilities**:
- Surface top-performing ideas with full score breakdowns
- Generate comparative analysis across evaluation criteria
- Provide participation metrics (ideas submitted, evaluated, pending per campaign)
- Produce score distribution data per dimension
- Generate campaign-level summary statistics

**Interfaces**:
- Input: Analytics query requests (campaign scope, date range, dimension filters)
- Output: Analytics data objects (top ideas, distributions, participation stats)
- Storage: DynamoDB `AggregatedScores` table, `Ideas` table, `Evaluations` table (read)

---

## Component 8: NotificationComponent

**Purpose**: Manages in-portal notifications for all system events.

**Responsibilities**:
- Create and store notifications for users on key events
- Serve unread notification counts and notification lists per user
- Mark notifications as read
- Dispatch notifications asynchronously via event consumption
- Notify Admin when recognition workflow is triggered

**Interfaces**:
- Input: Notification creation requests (via events), read/mark-read requests (via API)
- Output: Notification lists, unread counts
- Storage: DynamoDB `Notifications` table
- Events Consumed: `idea.submitted`, `campaign.activated`, `campaign.evaluation-started`, `campaign.closed`, `recognition.winners-announced`

---

## Component 9: RecognitionComponent

**Purpose**: Identifies top 3 ideas and triggers the recognition workflow.

**Responsibilities**:
- Identify the top 3 highest-scoring ideas when a campaign closes
- Assign winner badges (Gold, Silver, Bronze) to ideas and submitter profiles
- Trigger winner announcement visible to all users
- Publish recognition event to notify submitters and Admin
- Update idea status to `Winner` for top 3

**Interfaces**:
- Input: Campaign close event
- Output: Winner records, badge assignments
- Storage: DynamoDB `Winners` table, updates to `Ideas` table
- Events Consumed: `campaign.closed`
- Events Published: `recognition.winners-announced`

---

## Component 10: FrontendComponent (React SPA)

**Purpose**: Single-page application providing the user interface for all portal interactions.

**Responsibilities**:
- Render idea submission form with draft auto-save
- Render evaluation interface for Panel Members (blind scoring UI)
- Render leaderboard and dashboard views
- Render analytics views (Admin/Panel Member)
- Render notification center
- Render campaign management UI (Admin)
- Render user management UI (Admin)
- Handle authentication flows (login, register, password reset)
- Enforce role-based UI rendering (show/hide features by role)

**Interfaces**:
- Communicates with backend via API Gateway (REST)
- Hosted on S3 + CloudFront
- Auth: Amazon Cognito Hosted UI or custom auth flow with Cognito SDK

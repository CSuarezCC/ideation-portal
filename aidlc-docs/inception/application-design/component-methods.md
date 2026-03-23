# Component Methods — Ideation Portal

> Note: Method signatures define interfaces and high-level purpose. Detailed business logic and validation rules are defined in Functional Design (Construction Phase).

---

## AuthComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `registerUser(email, password, name, department)` | Registration data | `{ userId, message }` | Create new Cognito user with Employee role |
| `loginUser(email, password)` | Credentials | `{ accessToken, refreshToken, idToken }` | Authenticate user, return JWT tokens |
| `refreshToken(refreshToken)` | Refresh token | `{ accessToken }` | Issue new access token |
| `confirmAccount(email, confirmationCode)` | Email + code | `{ success }` | Confirm Cognito account after registration |
| `initiatePasswordReset(email)` | Email | `{ message }` | Trigger Cognito password reset flow |
| `confirmPasswordReset(email, code, newPassword)` | Reset data | `{ success }` | Complete password reset |
| `validateToken(token)` | JWT token | `{ userId, email, role, isValid }` | Lambda Authorizer — validate and decode JWT |

---

## UserComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `getUserProfile(userId)` | userId | `UserProfile` | Retrieve a user's profile |
| `updateUserProfile(userId, profileData)` | userId + data | `UserProfile` | Update name, department, avatar |
| `assignRole(targetUserId, role, requestingAdminId)` | userId + role | `{ success }` | Admin assigns role to a user |
| `listUsers(filters, pagination)` | Role filter, page | `{ users[], total }` | Admin lists all users with optional role filter |
| `deactivateUser(targetUserId, requestingAdminId)` | userId | `{ success }` | Admin deactivates a user account |
| `getUsersByRole(role)` | Role enum | `UserProfile[]` | Internal — get all users of a given role |

---

## CampaignComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `createCampaign(campaignData, adminId)` | Campaign data | `Campaign` | Create a new campaign in Draft status |
| `updateCampaign(campaignId, updates, adminId)` | campaignId + data | `Campaign` | Update campaign details |
| `transitionCampaignStatus(campaignId, newStatus, adminId)` | campaignId + status | `Campaign` | Move campaign through lifecycle states |
| `getActiveCampaign()` | — | `Campaign \| null` | Return the currently active campaign |
| `getCampaign(campaignId)` | campaignId | `Campaign` | Retrieve campaign by ID |
| `listCampaigns(filters)` | Status filter | `Campaign[]` | List campaigns with optional status filter |
| `assignPanelMembers(campaignId, userIds, adminId)` | campaignId + userIds | `{ success }` | Assign panel members to a campaign |
| `getPanelMembersForCampaign(campaignId)` | campaignId | `UserProfile[]` | Get all panel members assigned to campaign |
| `createCategory(name, description, adminId)` | Category data | `Category` | Create a new idea category |
| `updateCategory(categoryId, updates, adminId)` | categoryId + data | `Category` | Update category details |
| `deactivateCategory(categoryId, adminId)` | categoryId | `{ success }` | Deactivate a category |
| `listCategories(activeOnly)` | boolean | `Category[]` | List all or active-only categories |

---

## IdeaComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `createDraft(ideaData, userId)` | Partial idea data | `Idea (draft)` | Create a new draft idea |
| `updateDraft(ideaId, ideaData, userId)` | ideaId + data | `Idea (draft)` | Update an existing draft |
| `autoSaveDraft(ideaId, ideaData, userId)` | ideaId + data | `{ savedAt }` | Auto-save draft without full validation |
| `submitIdea(ideaId, userId)` | ideaId | `Idea (submitted)` | Validate and submit a draft to active campaign |
| `deleteDraft(ideaId, userId)` | ideaId | `{ success }` | Delete own draft idea |
| `getIdea(ideaId, requestingUserId)` | ideaId | `Idea` | Retrieve idea by ID (with role-based field visibility) |
| `listIdeas(filters, pagination)` | Campaign, category, status, date, keyword | `{ ideas[], total }` | List ideas with filtering and search |
| `getMyIdeas(userId, filters)` | userId + filters | `Idea[]` | Get all ideas submitted by a user |
| `getUploadUrl(ideaId, fileName, userId)` | ideaId + file info | `{ uploadUrl, fileKey }` | Generate S3 pre-signed URL for attachment upload |
| `updateIdeaStatus(ideaId, newStatus)` | ideaId + status | `Idea` | Internal — update idea status (used by other components) |

---

## EvaluationComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `getIdeasForEvaluation(panelMemberId, campaignId)` | panelMemberId + campaignId | `IdeaEvalStatus[]` | Get ideas with evaluation status for a panel member |
| `saveEvaluationProgress(evaluationData, panelMemberId)` | Partial scores + justifications | `Evaluation (draft)` | Save in-progress evaluation without submitting |
| `submitEvaluation(evaluationData, panelMemberId)` | Full scores + justifications | `Evaluation (submitted)` | Submit final locked evaluation for an idea |
| `getMyEvaluation(ideaId, panelMemberId)` | ideaId + panelMemberId | `Evaluation \| null` | Get own evaluation for an idea |
| `getAggregatedScore(ideaId)` | ideaId | `AggregatedScore \| null` | Get aggregated score (only after all panel members scored) |
| `getEvaluationSummary(ideaId, requestingUserId)` | ideaId + userId | `EvaluationSummary` | Get score breakdown — enforces blind scoring rules |
| `triggerAggregation(ideaId, campaignId)` | ideaId + campaignId | `AggregatedScore` | Internal — calculate and store aggregated scores |
| `getPendingEvaluations(panelMemberId, campaignId)` | panelMemberId + campaignId | `Idea[]` | Get ideas not yet scored by this panel member |

---

## DashboardComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `getLeaderboard(campaignId, dimension, filters, pagination)` | Query params | `{ ideas[], total }` | Get ranked idea list by specified dimension |
| `getIdeaDetail(ideaId, requestingUserId)` | ideaId + userId | `IdeaDetail` | Get full idea detail with role-appropriate score visibility |
| `getLeaderboardSummary(campaignId)` | campaignId | `LeaderboardSummary` | Get top-level leaderboard stats (total ideas, top scores) |
| `searchIdeas(query, campaignId, filters)` | Search query + filters | `{ ideas[], total }` | Keyword search across idea titles and descriptions |

---

## AnalyticsComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `getTopIdeas(campaignId, limit)` | campaignId + limit | `IdeaWithScores[]` | Get top N ideas with full score breakdowns |
| `getComparativeAnalysis(campaignId, dimension)` | campaignId + dimension | `ComparativeData` | Comparative analysis across evaluation criteria |
| `getParticipationMetrics(campaignId)` | campaignId | `ParticipationMetrics` | Ideas submitted, evaluated, pending counts |
| `getScoreDistribution(campaignId, dimension)` | campaignId + dimension | `ScoreDistribution` | Score distribution histogram per dimension |
| `getCampaignSummary(campaignId)` | campaignId | `CampaignSummary` | Full campaign-level statistics summary |

---

## NotificationComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `createNotification(userId, type, payload)` | userId + type + data | `Notification` | Internal — create a notification for a user |
| `getNotifications(userId, pagination)` | userId + page | `{ notifications[], unreadCount }` | Get notification list for a user |
| `markAsRead(notificationId, userId)` | notificationId + userId | `{ success }` | Mark a single notification as read |
| `markAllAsRead(userId)` | userId | `{ success }` | Mark all notifications as read for a user |
| `getUnreadCount(userId)` | userId | `{ count }` | Get unread notification count |
| `processEvent(event)` | EventBridge event | `void` | Internal — consume events and dispatch notifications |

---

## RecognitionComponent

| Method | Input | Output | Purpose |
|---|---|---|---|
| `determineWinners(campaignId)` | campaignId | `Winner[]` | Identify top 3 ideas by composite score |
| `assignBadges(winners)` | Winner[] | `void` | Assign Gold/Silver/Bronze badges to ideas and profiles |
| `announceWinners(campaignId)` | campaignId | `Announcement` | Create winner announcement record visible to all users |
| `getWinners(campaignId)` | campaignId | `Winner[]` | Retrieve winner records for a campaign |
| `getWinnerAnnouncement(campaignId)` | campaignId | `Announcement \| null` | Get the public winner announcement |
| `processEvent(event)` | EventBridge event | `void` | Internal — consume `campaign.closed` event and trigger workflow |

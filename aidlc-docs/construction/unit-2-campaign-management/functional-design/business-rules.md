# Business Rules — Unit 2: Campaign & Category Management

## Campaign Rules

### BR-C01: Single Active Campaign
- Only one campaign may be in ACTIVE status at any time.
- Before transitioning a campaign to ACTIVE, verify no other campaign is currently ACTIVE.
- If another campaign is ACTIVE, reject the transition with an error.

### BR-C02: Date Ordering
- submissionStartDate < submissionEndDate
- submissionEndDate ≤ evaluationStartDate
- evaluationStartDate < evaluationEndDate
- All dates must be in the future at creation time.

### BR-C03: Draft-Only Editing
- Campaign fields (name, description, dates) can only be modified while status is DRAFT.
- Once a campaign transitions to ACTIVE or beyond, all fields are locked.
- Panel member assignments are the exception — modifiable at any stage.

### BR-C04: Draft-Only Deletion
- Only campaigns in DRAFT status can be deleted.
- Deletion is soft (sets deletedAt timestamp).
- Soft-deleted campaigns are excluded from all list/query results.

### BR-C05: Forward-Only Transitions
- Campaign status can only move forward: DRAFT → ACTIVE → EVALUATION → CLOSED → ANNOUNCED.
- No backward transitions allowed.
- Admin can manually trigger any forward transition, bypassing date checks.

### BR-C06: Automatic Transitions
- The system checks campaign dates on read operations (lazy evaluation).
- If current time ≥ submissionStartDate and status is DRAFT → transition to ACTIVE.
- If current time ≥ evaluationStartDate and status is ACTIVE → transition to EVALUATION.
- If current time ≥ evaluationEndDate and status is EVALUATION → transition to CLOSED.
- Each automatic transition publishes the corresponding EventBridge event.

### BR-C07: Panel Member Validation
- Only users with role PanelMember or Admin can be assigned as panel members.
- Assignment replaces the full list (not additive) — caller sends complete list.
- At least one panel member must be assigned before transitioning to EVALUATION.

---

## Category Rules

### BR-CAT01: Unique Active Names
- Category names must be unique among active categories (case-insensitive comparison).
- Deactivated categories do not participate in uniqueness checks.

### BR-CAT02: No Cascade on Deactivation
- Deactivating a category does not affect existing ideas tagged with that category.
- Deactivated categories are hidden from the category selection dropdown in idea submission.

### BR-CAT03: Global Scope
- Categories are global — shared across all campaigns.
- Any active category is available for idea tagging in any active campaign.

---

## Authorization Rules

| Operation | Required Role |
|---|---|
| createCampaign | Admin |
| updateCampaign | Admin |
| deleteCampaign (soft) | Admin |
| transitionCampaignStatus | Admin |
| assignPanelMembers | Admin |
| getCampaign | All authenticated |
| getActiveCampaign | All authenticated |
| listCampaigns | All authenticated |
| getPanelMembers | Admin, PanelMember |
| createCategory | Admin |
| updateCategory | Admin |
| deactivateCategory | Admin |
| listCategories | All authenticated |

---

## Validation Rules

### Campaign Validation
| Field | Rule |
|---|---|
| name | Required, 3–200 characters |
| description | Required, 10–2000 characters |
| submissionStartDate | Required, valid ISO 8601, must be in future at creation |
| submissionEndDate | Required, valid ISO 8601, must be after submissionStartDate |
| evaluationStartDate | Required, valid ISO 8601, must be ≥ submissionEndDate |
| evaluationEndDate | Required, valid ISO 8601, must be after evaluationStartDate |

### Category Validation
| Field | Rule |
|---|---|
| name | Required, 2–100 characters, unique among active categories |
| description | Optional, max 500 characters |

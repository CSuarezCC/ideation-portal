# Business Logic Model — Unit 2: Campaign & Category Management

## Campaign Lifecycle State Machine

### Valid Transitions

```
DRAFT --> ACTIVE --> EVALUATION --> CLOSED --> ANNOUNCED
  |
  +--> [DELETED] (soft delete, Draft only)
```

### Transition Rules

| From | To | Trigger | Preconditions |
|---|---|---|---|
| DRAFT | ACTIVE | Auto (submissionStartDate reached) | All required fields populated, no other ACTIVE campaign exists |
| ACTIVE | EVALUATION | Auto (submissionEndDate reached AND evaluationStartDate reached) | At least one panel member assigned |
| EVALUATION | CLOSED | Auto (evaluationEndDate reached) | — |
| CLOSED | ANNOUNCED | Triggered by RecognitionService (Unit 7) after winners determined | Winners determined |
| DRAFT | DELETED | Manual Admin action | Campaign is in DRAFT status |

### Manual Override
- Admin can manually trigger any forward transition (DRAFT→ACTIVE, ACTIVE→EVALUATION, EVALUATION→CLOSED) at any time, bypassing date checks.
- Admin cannot reverse transitions (no going backward in lifecycle).
- Automatic transitions are checked by a scheduled process or on-demand when campaigns are queried.

### Automatic Transition Implementation
- On every `getCampaign`, `listCampaigns`, or `getActiveCampaign` API call, check if any campaign's dates warrant a status transition.
- If a transition is warranted, execute it inline and publish the corresponding EventBridge event.
- This "lazy evaluation" approach avoids the need for a separate scheduled Lambda while ensuring transitions happen promptly.

---

## Campaign CRUD Logic

### Create Campaign
1. Validate all required fields (name, description, dates)
2. Validate date ordering: submissionStartDate < submissionEndDate ≤ evaluationStartDate < evaluationEndDate
3. Set status = DRAFT
4. Set panelMemberIds = []
5. Generate campaignId (ULID)
6. Store in DynamoDB

### Update Campaign
1. Verify campaign exists and is not soft-deleted
2. Verify campaign status is DRAFT (all fields locked after DRAFT)
3. Validate updated fields (same rules as create)
4. Update record in DynamoDB

### Delete Campaign (Soft)
1. Verify campaign exists
2. Verify campaign status is DRAFT
3. Set deletedAt = current timestamp
4. Update record in DynamoDB
5. Excluded from all queries by default

### Get Active Campaign
1. Query GSI by status = ACTIVE
2. Run lazy transition check on result
3. Return campaign or null

### List Campaigns
1. Query with optional status filter
2. Exclude soft-deleted campaigns (deletedAt is null)
3. Run lazy transition check on each result
4. Return paginated list sorted by createdAt descending

---

## Panel Member Assignment Logic

### Assign Panel Members
1. Verify campaign exists and is not soft-deleted
2. Verify all provided userIds exist and have PanelMember or Admin role
3. Replace panelMemberIds array on campaign record
4. No lifecycle stage restriction (assignable at any stage)

### Get Panel Members
1. Verify campaign exists
2. Return panelMemberIds array
3. Caller can resolve full user profiles via UserService if needed

---

## Category Management Logic

### Create Category
1. Validate name is unique among active categories (case-insensitive)
2. Set isActive = true
3. Generate categoryId (ULID)
4. Store in DynamoDB

### Update Category
1. Verify category exists
2. If name changed, validate uniqueness among active categories
3. Update record

### Deactivate Category
1. Verify category exists and is currently active
2. Set isActive = false
3. Existing ideas tagged with this category retain the tag (no cascade)

### List Categories
1. Query with optional activeOnly filter
2. Return sorted alphabetically by name

---

## EventBridge Events Published

| Event | Detail Type | Published When |
|---|---|---|
| campaign.activated | CampaignActivated | Campaign transitions to ACTIVE |
| campaign.evaluation-started | CampaignEvaluationStarted | Campaign transitions to EVALUATION |
| campaign.closed | CampaignClosed | Campaign transitions to CLOSED |

### Event Payload Schema

```typescript
// All campaign events share this base payload
interface CampaignEventPayload {
  campaignId: string;
  campaignName: string;
  status: CampaignStatus;
  panelMemberIds: string[];
  timestamp: string; // ISO 8601
}
```

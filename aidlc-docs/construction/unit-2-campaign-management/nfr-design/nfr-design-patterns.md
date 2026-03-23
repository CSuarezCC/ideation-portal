# NFR Design Patterns — Unit 2: Campaign & Category Management

## Inherited Patterns (from Unit 1)

All Unit 1 patterns apply to Unit 2 handlers:
- **Pattern 2**: Retry with Exponential Backoff — applied to DynamoDB writes and EventBridge publishes
- **Pattern 3**: Structured Error Responses — same error envelope for all campaign/category handlers
- **Pattern 4**: Middleware Chain (RBAC) — `requireRole('ADMIN')` on all mutation endpoints
- **Pattern 5**: Environment-Based Configuration — table names and event bus name via env vars

---

## Pattern 7: Lazy Status Transition with Conditional Update

**Problem**: Campaign status must auto-transition based on dates, but a scheduled Lambda adds operational complexity for a low-frequency operation.

**Solution**: Check dates on every campaign read. If a transition is warranted, execute it inline using a DynamoDB conditional update.

```
Read campaign from DynamoDB
  → Check current status vs. current time vs. date fields
  → If transition warranted:
      → DynamoDB UpdateItem with ConditionExpression: status = :currentStatus
      → If condition succeeds: publish EventBridge event, return updated campaign
      → If condition fails (ConditionalCheckFailedException): another request already transitioned it; re-read and return
  → If no transition: return campaign as-is
```

**Race condition handling**: The `ConditionExpression` ensures only one concurrent request performs the transition. Losers simply re-read the already-transitioned record.

**Applied to**: `getCampaign`, `listCampaigns`, `getActiveCampaign` handlers.

---

## Pattern 8: Single Active Campaign Guard

**Problem**: Only one campaign may be ACTIVE at a time. Concurrent transitions could violate this constraint.

**Solution**: Before transitioning to ACTIVE, query the GSI for status=ACTIVE. If a result exists (and it's not the current campaign), reject the transition.

```
transitionToActive(campaignId):
  → Query GSI status-createdAt-index WHERE status = "ACTIVE"
  → Filter out soft-deleted (deletedAt != null)
  → If any result exists AND result.campaignId != campaignId:
      → Return 409 Conflict: "Another campaign is already active"
  → Else: proceed with conditional update
```

**Note**: This is a best-effort check (not transactional). The window for a race condition is extremely small given Admin-only access and low frequency of transitions.

---

## Pattern 9: Soft Delete Filter

**Problem**: Soft-deleted campaigns must be excluded from all queries without requiring a separate "deleted" table.

**Solution**: All query/scan operations include a filter for `deletedAt = null`. The GSI on status only indexes non-deleted campaigns by convention (campaigns are removed from the status GSI when soft-deleted by setting status to a sentinel value or filtering at query time).

```
listCampaigns(statusFilter):
  → Query GSI (or Scan if no filter)
  → FilterExpression: attribute_not_exists(deletedAt)
  → Return filtered results
```

**Applied to**: All campaign list/get operations.

---

## Error Code Registry (Unit 2 additions)

| Code | HTTP Status | Description |
|---|---|---|
| CAMPAIGN_NOT_FOUND | 404 | Campaign does not exist or is soft-deleted |
| CAMPAIGN_NOT_DRAFT | 400 | Attempted edit/delete on non-DRAFT campaign |
| CAMPAIGN_INVALID_TRANSITION | 400 | Invalid status transition attempted |
| CAMPAIGN_ALREADY_ACTIVE | 409 | Another campaign is already ACTIVE |
| CAMPAIGN_NO_PANEL_MEMBERS | 400 | Transition to EVALUATION requires panel members |
| CATEGORY_NOT_FOUND | 404 | Category does not exist |
| CATEGORY_NAME_EXISTS | 409 | Active category with same name already exists |
| INVALID_PANEL_MEMBER | 400 | User does not have PanelMember or Admin role |

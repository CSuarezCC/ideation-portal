# Business Logic Model — Unit 3: Idea Submission

## Idea Lifecycle State Machine

```
DRAFT --> SUBMITTED --> UNDER_REVIEW --> EVALUATED --> WINNER
  |
  +--> [DELETED] (draft only, hard delete)
```

### Transition Rules

| From | To | Trigger | Preconditions |
|---|---|---|---|
| DRAFT | SUBMITTED | User submits idea | All required fields populated, active campaign exists, at least one category selected |
| SUBMITTED | UNDER_REVIEW | Automatic when campaign transitions to EVALUATION | Campaign status = EVALUATION (via EventBridge or lazy check) |
| UNDER_REVIEW | EVALUATED | Automatic when aggregated score is computed | All panel members have scored (triggered by Unit 4) |
| EVALUATED | WINNER | Set by Recognition (Unit 7) | Top 3 composite score |
| DRAFT | DELETED | User deletes own draft | Idea is in DRAFT status, user is the submitter |

Note: SUBMITTED→UNDER_REVIEW and UNDER_REVIEW→EVALUATED transitions are driven by other units. Unit 3 exposes `updateIdeaStatus(ideaId, newStatus)` as an internal method for this purpose.

---

## Draft CRUD Logic

### Create Draft
1. Validate user is authenticated
2. Generate ideaId (ULID)
3. Set status = DRAFT, submitterId = current user
4. campaignId is optional at draft creation (set on submit)
5. Store in DynamoDB with minimal fields (title can be empty for auto-save)

### Update Draft
1. Verify idea exists, status = DRAFT, submitterId = current user
2. Update provided fields
3. Update updatedAt timestamp

### Auto-Save Draft
1. Same as Update Draft but with relaxed validation (partial data accepted)
2. Last-write-wins — no version checking
3. Only updates updatedAt and provided fields

### Delete Draft
1. Verify idea exists, status = DRAFT, submitterId = current user
2. Hard delete from DynamoDB
3. Delete associated S3 attachments

---

## Submission Logic

### Submit Idea
1. Verify idea exists, status = DRAFT, submitterId = current user
2. Validate all required fields: title, description, solution, benefits, categoryIds (at least one)
3. Verify an active campaign exists (call GET /campaigns/active or query directly)
4. Set campaignId = active campaign's campaignId
5. Set status = SUBMITTED, submittedAt = now
6. Publish EventBridge event: `idea.submitted`

---

## Attachment Logic

### Get Upload URL (Pre-signed)
1. Verify idea exists, status = DRAFT, submitterId = current user
2. Verify attachment count < 5
3. Generate S3 pre-signed PUT URL with 15-minute expiry
4. S3 key: `ideas/{ideaId}/{ulid}-{fileName}`
5. Return { uploadUrl, fileKey }

### Record Attachment
- After successful upload, client calls updateDraft with updated attachments array
- Attachment metadata (fileName, fileSize, contentType, fileKey, uploadedAt) stored on the idea record

---

## Listing & Filtering Logic

### List Ideas (All — for Admin/Panel Members)
1. Query by campaignId (required filter)
2. Optional filters: status, categoryIds (client-side filter on multi-select), keyword search (contains on title/description)
3. Paginated results

### Get My Ideas (for submitter)
1. Query GSI submitterId-index where submitterId = current user
2. Optional status filter
3. Return all user's ideas across campaigns

### Get Idea Detail
1. Fetch idea by ideaId
2. Visibility rules:
   - Submitter: always sees own idea
   - Admin/Panel Member: always sees idea
   - Other employees: only see idea if status is EVALUATED or WINNER (post-evaluation visibility)

---

## EventBridge Events Published

| Event | Detail Type | Published When |
|---|---|---|
| idea.submitted | IdeaSubmitted | Idea transitions from DRAFT to SUBMITTED |

### Event Payload

```typescript
interface IdeaSubmittedPayload {
  ideaId: string
  title: string
  submitterId: string
  campaignId: string
  timestamp: string
}
```

# Business Rules — Unit 3: Idea Submission

## Idea Rules

### BR-I01: Draft Ownership
- Only the submitter can edit, auto-save, delete, or submit their own draft.
- Admin cannot edit another user's draft.

### BR-I02: Submission Requires Active Campaign
- An idea can only be submitted when an active campaign exists (status = ACTIVE).
- The campaignId is set automatically to the active campaign at submission time.

### BR-I03: Submission Validation
- All required fields must be populated before submission: title, description, solution, benefits, categoryIds (at least one).
- Draft saves do not require all fields (partial data accepted for auto-save).

### BR-I04: Multi-Category Tagging
- Ideas support multiple categories (multi-select).
- At least one category must be selected at submission time.
- All selected categoryIds must reference active categories.

### BR-I05: Attachment Limits
- Maximum 5 attachments per idea.
- Maximum 10MB per file.
- Any document type allowed.
- Pre-signed URLs expire after 15 minutes.

### BR-I06: Draft Deletion
- Only DRAFT ideas can be deleted.
- Deletion is hard (permanent) — removes DynamoDB record and S3 attachments.
- Submitted ideas cannot be deleted.

### BR-I07: Auto-Save Behavior
- Auto-save triggers every 30 seconds on the frontend while user is editing.
- Last-write-wins — no optimistic locking.
- Auto-save accepts partial data (no field validation).
- Auto-save only updates updatedAt and provided fields.

### BR-I08: Idea Visibility
- Draft ideas: visible only to the submitter.
- Submitted / Under Review ideas: visible to submitter, Admin, and Panel Members.
- Evaluated / Winner ideas: visible to all authenticated users.

### BR-I09: Immutable After Submission
- Once submitted, idea content (title, description, solution, benefits, categories, attachments) cannot be edited.
- Only status can change (driven by other units).

### BR-I10: Draft Expiry (NFR-08)
- Drafts inactive for 90 days should receive an expiry notification.
- Implementation: TTL attribute or periodic scan (deferred to Unit 6 notifications or operational process).

---

## Authorization Rules

| Operation | Required Role | Additional Constraint |
|---|---|---|
| createDraft | Employee, Admin | — |
| updateDraft | Employee, Admin | Must be submitter |
| autoSaveDraft | Employee, Admin | Must be submitter |
| submitIdea | Employee, Admin | Must be submitter, active campaign required |
| deleteDraft | Employee, Admin | Must be submitter, DRAFT only |
| getIdea | All authenticated | Visibility rules (BR-I08) |
| listIdeas | All authenticated | Filtered by visibility rules |
| getMyIdeas | All authenticated | Only own ideas |
| getUploadUrl | Employee, Admin | Must be submitter, DRAFT only |

---

## Validation Rules

### Idea Submission Validation (enforced at submit time)
| Field | Rule |
|---|---|
| title | Required, 5–200 characters |
| description | Required, 20–5000 characters |
| solution | Required, 20–5000 characters |
| benefits | Required, 10–2000 characters |
| categoryIds | Required, at least 1, all must be active category IDs |

### Draft Save Validation (relaxed)
| Field | Rule |
|---|---|
| title | Optional, max 200 characters if provided |
| description | Optional, max 5000 characters if provided |
| solution | Optional, max 5000 characters if provided |
| benefits | Optional, max 2000 characters if provided |
| categoryIds | Optional |

### Attachment Validation
| Field | Rule |
|---|---|
| fileName | Required, max 255 characters |
| fileSize | Required, max 10MB (10,485,760 bytes) |
| contentType | Required, non-empty |

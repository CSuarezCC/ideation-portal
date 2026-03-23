# NFR Design Patterns — Unit 3: Idea Submission

## Inherited Patterns (from Units 1-2)

- **Pattern 2**: Retry with Exponential Backoff — applied to DynamoDB writes and EventBridge publishes
- **Pattern 3**: Structured Error Responses — same error envelope
- **Pattern 4**: Middleware Chain (RBAC) — requireRole on mutation endpoints
- **Pattern 5**: Environment-Based Configuration — table names, bucket name via env vars

---

## Pattern 10: S3 Pre-Signed URL Upload

**Problem**: File uploads through Lambda have a 6MB payload limit and add latency. Large files need direct client-to-S3 upload.

**Solution**: Generate pre-signed PUT URLs server-side; client uploads directly to S3.

```
Client → Lambda: POST /ideas/{id}/upload-url { fileName, contentType, fileSize }
Lambda → Client: { uploadUrl, fileKey }
Client → S3: PUT uploadUrl (file binary, Content-Type header)
Client → Lambda: PUT /ideas/{id}/draft { attachments: [...existing, newAttachment] }
```

**Pre-signed URL constraints**:
- Expiry: 15 minutes
- Method: PUT only
- Key: `ideas/{ideaId}/{ulid}-{fileName}`
- Content-Length condition: max 10MB

---

## Pattern 11: Frontend Auto-Save with Debounce

**Problem**: Auto-save every 30 seconds must not block the UI or cause excessive API calls.

**Solution**: `setInterval` on the frontend; only fires API call if `isDirty` flag is true.

```
Mount:
  → Start 30s interval
  → On each tick: if isDirty, call PUT /ideas/{id}/autosave with current form data
  → On success: set isDirty = false, update lastSaved timestamp
  → On failure: silently ignore (retry on next tick)

Unmount:
  → Clear interval
  → If isDirty, fire one final save (best-effort)
```

---

## Pattern 12: Role-Based Visibility Filter

**Problem**: Ideas have different visibility rules based on status and requesting user's role.

**Solution**: Server-side filtering in getIdea and listIdeas handlers.

```
getIdea(ideaId, requestingUser):
  → Fetch idea
  → If requestingUser.userId === idea.submitterId → allow
  → If requestingUser.role === ADMIN or PANEL_MEMBER → allow
  → If idea.status in [EVALUATED, WINNER] → allow (public post-evaluation)
  → Else → 403 Forbidden
```

---

## Error Code Registry (Unit 3 additions)

| Code | HTTP Status | Description |
|---|---|---|
| IDEA_NOT_FOUND | 404 | Idea does not exist |
| IDEA_NOT_DRAFT | 400 | Attempted edit on non-DRAFT idea |
| IDEA_NOT_OWNER | 403 | User is not the idea submitter |
| IDEA_VALIDATION_ERROR | 400 | Missing required fields at submission |
| NO_ACTIVE_CAMPAIGN | 400 | No active campaign to submit to |
| ATTACHMENT_LIMIT_EXCEEDED | 400 | More than 5 attachments |
| FILE_TOO_LARGE | 400 | File exceeds 10MB |

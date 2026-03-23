# Logical Components — Unit 3: Idea Submission

## Backend Logical Components

### IdeaHandlers (Lambda functions)

| Route | Handler | Auth | Role |
|---|---|---|---|
| POST /ideas/draft | createDraftHandler | Yes | Employee, Admin |
| PUT /ideas/{id}/draft | updateDraftHandler | Yes | Employee, Admin (owner) |
| PUT /ideas/{id}/autosave | autoSaveDraftHandler | Yes | Employee, Admin (owner) |
| POST /ideas/{id}/submit | submitIdeaHandler | Yes | Employee, Admin (owner) |
| DELETE /ideas/{id} | deleteDraftHandler | Yes | Employee, Admin (owner) |
| GET /ideas | listIdeasHandler | Yes | All (visibility filtered) |
| GET /ideas/mine | getMyIdeasHandler | Yes | All |
| GET /ideas/{id} | getIdeaHandler | Yes | All (visibility filtered) |
| POST /ideas/{id}/upload-url | getUploadUrlHandler | Yes | Employee, Admin (owner) |

### Internal Method
- `updateIdeaStatus(ideaId, newStatus)` — called by Units 4 and 7 to transition idea status

### Shared Module Additions
- `shared/types/index.ts` — Add Idea, IdeaStatus, Attachment interfaces + new error codes

## Frontend Logical Components

### IdeaService (`frontend/src/services/ideaService.ts`)
- Wraps all `/ideas/*` API calls
- Exposes: `createDraft()`, `updateDraft()`, `autoSave()`, `submit()`, `deleteDraft()`, `listIdeas()`, `getMyIdeas()`, `getIdea()`, `getUploadUrl()`, `uploadFile()`

### Frontend Pages
- `IdeaSubmitPage` — create/edit draft with 30s auto-save + file upload
- `MyIdeasPage` — user's ideas with status filter
- `IdeaDetailPage` — read-only idea view with attachments

### New Shared UI Components
- `FileUpload` — file picker + S3 pre-signed upload
- `AutoSaveIndicator` — save status display

## AWS Infrastructure Components (Unit 3 additions to template.yaml)

| Component | Change | Purpose |
|---|---|---|
| Idea Lambda functions | Add to template.yaml | 9 idea handlers |
| API Gateway routes | Add to HttpApi | Idea REST routes |
| Ideas Table GSIs | Already provisioned in Unit 1 | submitterId-index, campaignId-status-index already defined |
| S3 AttachmentsBucket | Already provisioned in Unit 1 | Used for idea file uploads |

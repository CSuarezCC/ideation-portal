# Code Summary — Unit 3: Idea Submission

## Backend Files

| File | Status | Description |
|---|---|---|
| `backend/src/shared/types/index.ts` | Modified | Added Idea, IdeaStatus, Attachment interfaces + 7 new error codes |
| `backend/src/shared/utils/errors.ts` | Modified | Added 7 new error codes to STATUS_MAP |
| `backend/src/handlers/ideas/createDraft.ts` | Created | POST /ideas/draft — create new draft |
| `backend/src/handlers/ideas/updateDraft.ts` | Created | PUT /ideas/{id}/draft — update draft with full validation |
| `backend/src/handlers/ideas/autoSaveDraft.ts` | Created | PUT /ideas/{id}/autosave — partial update, relaxed validation |
| `backend/src/handlers/ideas/deleteDraft.ts` | Created | DELETE /ideas/{id} — hard delete draft + S3 attachments |
| `backend/src/handlers/ideas/submitIdea.ts` | Created | POST /ideas/{id}/submit — validate, set campaign, publish event |
| `backend/src/handlers/ideas/getUploadUrl.ts` | Created | POST /ideas/{id}/upload-url — S3 pre-signed PUT URL |
| `backend/src/handlers/ideas/getIdea.ts` | Created | GET /ideas/{id} — with role-based visibility |
| `backend/src/handlers/ideas/getMyIdeas.ts` | Created | GET /ideas/mine — user's own ideas |
| `backend/src/handlers/ideas/listIdeas.ts` | Created | GET /ideas — by campaign with visibility filter |
| `backend/src/handlers/ideas/submitIdea.test.ts` | Created | Submission validation tests |

## Frontend Files

| File | Status | Description |
|---|---|---|
| `frontend/src/services/ideaService.ts` | Created | API client for all idea endpoints + S3 upload |
| `frontend/src/components/ui/FileUpload.tsx` | Created | File picker + S3 pre-signed upload component |
| `frontend/src/components/ui/AutoSaveIndicator.tsx` | Created | Auto-save status indicator |
| `frontend/src/pages/ideas/IdeaSubmitPage.tsx` | Created | Idea form with 30s auto-save, category multi-select, file upload |
| `frontend/src/pages/ideas/MyIdeasPage.tsx` | Created | User's ideas list with status filter |
| `frontend/src/pages/ideas/IdeaDetailPage.tsx` | Created | Read-only idea detail view |
| `frontend/src/App.tsx` | Modified | Added 4 idea routes |

## Infrastructure Files

| File | Status | Description |
|---|---|---|
| `template.yaml` | Modified | Added 9 idea Lambda functions with API events and IAM policies |

# Code Generation Plan — Unit 3: Idea Submission

## Unit Context
- **Unit**: Unit 3 — Idea Submission
- **Requirements Covered**: FR-02, FR-10 partial, NFR-07 partial, NFR-08
- **Dependencies**: Unit 1 (auth, shared middleware, DB/S3/EventBridge clients), Unit 2 (active campaign, categories)
- **Output**: Idea backend handlers, shared types update, frontend pages/services, template.yaml updates

---

## Steps

- [x] Step 1: Shared Types Update
  - Modify `backend/src/shared/types/index.ts` — add Idea, IdeaStatus, Attachment interfaces and new error codes
  - Modify `backend/src/shared/utils/errors.ts` — add new error codes to STATUS_MAP

- [x] Step 2: Idea Handlers — Draft CRUD
  - Create `backend/src/ideas/createDraft.ts`
  - Create `backend/src/ideas/updateDraft.ts`
  - Create `backend/src/ideas/autoSaveDraft.ts`
  - Create `backend/src/ideas/deleteDraft.ts`

- [x] Step 3: Idea Handlers — Submit & Upload
  - Create `backend/src/ideas/submitIdea.ts`
  - Create `backend/src/ideas/getUploadUrl.ts`

- [x] Step 4: Idea Handlers — Read & List
  - Create `backend/src/ideas/getIdea.ts`
  - Create `backend/src/ideas/getMyIdeas.ts`
  - Create `backend/src/ideas/listIdeas.ts`

- [x] Step 5: Backend Unit Tests
  - Create `backend/src/ideas/submitIdea.test.ts` — submission validation tests

- [x] Step 6: SAM Template Update
  - Modify `template.yaml` — add 9 idea Lambda functions with API events and IAM policies

- [x] Step 7: Frontend — Idea Service
  - Create `frontend/src/services/ideaService.ts`

- [x] Step 8: Frontend — Shared Components
  - Create `frontend/src/components/ui/FileUpload.tsx`
  - Create `frontend/src/components/ui/AutoSaveIndicator.tsx`

- [x] Step 9: Frontend — Idea Pages
  - Create `frontend/src/pages/ideas/IdeaSubmitPage.tsx`
  - Create `frontend/src/pages/ideas/MyIdeasPage.tsx`
  - Create `frontend/src/pages/ideas/IdeaDetailPage.tsx`

- [x] Step 10: Frontend — Router Update
  - Modify `frontend/src/App.tsx` — add idea routes

- [x] Step 11: Code Summary Documentation
  - Create `aidlc-docs/construction/unit-3-idea-submission/code/code-summary.md`

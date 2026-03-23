# Frontend Components — Unit 3: Idea Submission

## Page Structure

```
/ideas/submit              → IdeaSubmitPage (create new draft + submit)
/ideas/mine                → MyIdeasPage (user's own ideas)
/ideas/:id                 → IdeaDetailPage (view idea detail)
/ideas/:id/edit            → IdeaSubmitPage (edit existing draft)
```

---

## IdeaSubmitPage

**Purpose**: Create/edit idea draft with auto-save, then submit.

**Props/Route Params**:
- ideaId (optional — present in edit mode)

**State**:
- form fields: title, description, solution, benefits, categoryIds, attachments
- autoSaveTimer: interval reference
- lastSaved: timestamp of last auto-save
- isDirty: boolean (unsaved changes)
- submitting: boolean

**Behavior**:
- On mount (edit mode): fetch draft, populate form
- On mount (create mode): create draft via API, get ideaId
- Auto-save every 30 seconds if isDirty = true (call PUT /ideas/{id}/autosave)
- Category multi-select from active categories (fetched from campaignService.listCategories)
- File upload: click "Add Attachment" → get pre-signed URL → upload to S3 → update attachments array
- Submit button: validate all fields → call POST /ideas/{id}/submit → navigate to /ideas/mine
- Show "Last saved at..." indicator

**API**:
- Create: `POST /ideas/draft`
- Auto-save: `PUT /ideas/{id}/autosave`
- Update: `PUT /ideas/{id}/draft`
- Upload URL: `POST /ideas/{id}/upload-url`
- Submit: `POST /ideas/{id}/submit`
- Categories: `GET /campaigns/categories`

---

## MyIdeasPage

**Purpose**: List all ideas submitted by the current user.

**State**:
- ideas: Idea[]
- statusFilter: IdeaStatus | 'ALL'
- loading: boolean

**Behavior**:
- Fetch user's ideas on mount (GET /ideas/mine)
- Filter by status (ALL, DRAFT, SUBMITTED, UNDER_REVIEW, EVALUATED, WINNER)
- Draft ideas show "Edit" and "Delete" actions
- Submitted+ ideas show "View" action
- Click idea → navigate to /ideas/:id (or /ideas/:id/edit for drafts)

**API**: `GET /ideas/mine`

---

## IdeaDetailPage

**Purpose**: View idea details with role-appropriate visibility.

**State**:
- idea: Idea
- loading: boolean

**Behavior**:
- Fetch idea by ID (GET /ideas/{id})
- Display all fields: title, description, solution, benefits, categories, attachments, status, submission date
- Attachments: download links (pre-signed GET URLs or direct links)
- Visibility enforced server-side (API returns 403 if not authorized)

**API**: `GET /ideas/{id}`

---

## Shared Components Used (from Units 1-2)

- Button, Input, LoadingSpinner — from `frontend/src/components/ui/`
- StatusBadge — from Unit 2 (reused for IdeaStatus)
- AppShell, ProtectedRoute — from `frontend/src/components/layout/`

## New Shared Components

### FileUpload
- **Props**: ideaId: string, attachments: Attachment[], onUpload: (attachment) => void, maxFiles: number
- **Behavior**: File picker, calls getUploadUrl, uploads to S3, calls onUpload with metadata

### AutoSaveIndicator
- **Props**: lastSaved: string | null, isDirty: boolean
- **Behavior**: Shows "Saving...", "Saved at HH:MM", or "Unsaved changes"

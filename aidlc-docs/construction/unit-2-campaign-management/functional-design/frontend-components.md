# Frontend Components — Unit 2: Campaign & Category Management

## Page Structure

```
/admin/campaigns                → CampaignListPage
/admin/campaigns/new            → CampaignFormPage (create mode)
/admin/campaigns/:id            → CampaignDetailPage
/admin/campaigns/:id/edit       → CampaignFormPage (edit mode, Draft only)
/admin/categories               → CategoryManagementPage
```

---

## CampaignListPage

**Purpose**: Display all campaigns with status filtering.

**State**:
- campaigns: Campaign[]
- statusFilter: CampaignStatus | 'ALL'
- loading: boolean

**Behavior**:
- Fetch campaigns on mount with optional status filter
- Display campaign cards with name, status badge, dates, panel member count
- "Create Campaign" button → navigates to /admin/campaigns/new
- Click campaign → navigates to /admin/campaigns/:id
- Status filter dropdown (ALL, DRAFT, ACTIVE, EVALUATION, CLOSED, ANNOUNCED)

**API**: `GET /campaigns?status={filter}`

---

## CampaignFormPage

**Purpose**: Create or edit a campaign (edit only in DRAFT status).

**Props/Route Params**:
- campaignId (optional — present in edit mode)

**State**:
- form fields: name, description, submissionStartDate, submissionEndDate, evaluationStartDate, evaluationEndDate
- errors: field-level validation errors
- submitting: boolean

**Behavior**:
- In edit mode: fetch campaign, populate form, reject if not DRAFT
- Validate date ordering on submit (BR-C02)
- On success: navigate to campaign detail page

**API**:
- Create: `POST /campaigns`
- Edit: `PUT /campaigns/:id`

---

## CampaignDetailPage

**Purpose**: View campaign details, manage status transitions and panel members.

**State**:
- campaign: Campaign
- panelMembers: UserProfile[]
- availableUsers: UserProfile[] (for panel assignment)
- loading: boolean

**Sections**:
1. **Campaign Info** — Name, description, dates, status badge
2. **Status Actions** — Contextual buttons based on current status:
   - DRAFT: "Activate Now", "Edit", "Delete"
   - ACTIVE: "Start Evaluation"
   - EVALUATION: "Close Campaign"
   - CLOSED/ANNOUNCED: No actions (read-only)
3. **Panel Members** — List of assigned panel members with "Manage Panel" button
4. **Panel Assignment Modal** — Multi-select from users with PanelMember/Admin role

**API**:
- `GET /campaigns/:id`
- `PUT /campaigns/:id/status`
- `GET /campaigns/:id/panel-members`
- `POST /campaigns/:id/panel-members`
- `GET /users?role=PanelMember` (from Unit 1 UserService)

---

## CategoryManagementPage

**Purpose**: Admin page to manage global idea categories.

**State**:
- categories: Category[]
- showCreateModal: boolean
- editingCategory: Category | null
- loading: boolean

**Behavior**:
- List all categories (active and inactive) in a table
- Active/Inactive status badge per row
- "Add Category" button → opens create modal
- Edit button per row → opens edit modal
- Deactivate/Activate toggle per row
- Inline form validation (name uniqueness checked on submit)

**API**:
- `GET /campaigns/categories`
- `POST /campaigns/categories`
- `PUT /campaigns/categories/:id`

---

## Shared Components Used (from Unit 1)

- Button, Input, LoadingSpinner, RoleBadge — reused from `frontend/src/components/ui/`
- AppShell, ProtectedRoute — reused from `frontend/src/components/layout/`

## New Shared Components

### StatusBadge
- **Props**: status: CampaignStatus
- **Behavior**: Renders colored badge based on campaign status (DRAFT=gray, ACTIVE=green, EVALUATION=blue, CLOSED=orange, ANNOUNCED=purple)

### DateRangeDisplay
- **Props**: startDate: string, endDate: string, label: string
- **Behavior**: Renders formatted date range with label

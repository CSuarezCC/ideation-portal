# Functional Design Plan — Unit 2: Campaign & Category Management

## Unit Context
- **Unit**: Unit 2 — Campaign & Category Management
- **Requirements Covered**: FR-03 (Campaign Management), FR-10 partial (Category Management)
- **Dependencies**: Unit 1 (auth, user roles, shared infrastructure)
- **Components**: CampaignComponent (CampaignService Lambda)

---

## Plan Steps

- [x] Step 1: Define Campaign domain entity with all fields, statuses, and lifecycle states
- [x] Step 2: Define Category domain entity with fields and active/inactive state
- [x] Step 3: Define Campaign lifecycle state machine with valid transitions and business rules
- [x] Step 4: Define business rules for campaign CRUD, panel member assignment, and category management
- [x] Step 5: Define frontend components for campaign management, category management, and campaign detail views
- [x] Step 6: Generate functional design artifacts

---

## Clarifying Questions

The requirements and application design are detailed, but a few areas need clarification to ensure correct functional design.

### Q1: Campaign Date Enforcement
FR-03 specifies campaigns have start/end dates for submissions and evaluation periods. Should the system **automatically transition** campaign status based on dates (e.g., auto-activate on start date, auto-close on end date), or should transitions be **manual Admin actions only** with dates serving as informational/display fields?

[Answer]: automatically transition

### Q2: Panel Member Assignment Timing
Can panel members be assigned to a campaign at any lifecycle stage, or only during specific stages (e.g., only while Draft or Active)?

[Answer]: At any lifecycle stage

### Q3: Category Scope
Are categories **global** (shared across all campaigns) or **per-campaign** (each campaign has its own category set)?

[Answer]: global

### Q4: Campaign Editing Restrictions
Once a campaign moves to Active status, which fields should be locked from editing? For example, can an Admin change the campaign description or dates while it's Active, or only while it's in Draft?

[Answer]: Only while it's in Draft

### Q5: Campaign Deletion
Should Admins be able to delete campaigns, or only deactivate/close them? If deletion is allowed, should it be restricted to Draft campaigns only?

[Answer]: deletion is allowed, restricted to Draft campaigns only. Soft delete

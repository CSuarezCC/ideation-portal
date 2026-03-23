# Functional Design Plan — Unit 3: Idea Submission

## Unit Context
- **Unit**: Unit 3 — Idea Submission
- **Requirements Covered**: FR-02 (Idea Submission), FR-10 partial (Categorization & Filtering), NFR-07 partial (Auto-save), NFR-08 (Data Retention)
- **Dependencies**: Unit 1 (auth, shared infrastructure), Unit 2 (active campaign context, categories)
- **Components**: IdeaComponent (IdeaService Lambda)

---

## Plan Steps

- [x] Step 1: Define Idea domain entity with all fields, statuses, and attachment metadata
- [x] Step 2: Define Idea lifecycle state machine (Draft → Submitted → Under Review → Evaluated → Winner)
- [x] Step 3: Define business rules for idea CRUD, submission, auto-save, attachments, and filtering
- [x] Step 4: Define frontend components for idea submission form, my ideas list, and idea detail view
- [x] Step 5: Generate functional design artifacts

---

## Clarifying Questions

### Q1: Category Multiplicity
FR-10 says ideas "shall be tagged with one or more categories." Should an idea support multiple categories (multi-select), or exactly one category (single-select dropdown)?

[Answer]: multi-select

### Q2: Attachment Limits
FR-02 mentions optional file attachments. What limits should apply?
- Maximum number of attachments per idea?
- Maximum file size per attachment?
- Allowed file types (e.g., PDF, images, documents only, or any)?

[Answer]: 5 attachments maximum per idea, with maximum size (whichever one you think is appropriate), any documents

### Q3: Draft Auto-Save Conflict Resolution
If a user has the idea form open in two browser tabs and both auto-save, how should conflicts be handled? Options:
A) Last write wins (simpler)
B) Optimistic locking with version check (safer but more complex)

[Answer]: A

### Q4: Idea Visibility After Submission
Once an idea is submitted, can other employees see it (e.g., on a public ideas list), or is it only visible to the submitter and Admin/Panel Members until evaluation completes?

[Answer]: it is only visible to the submitter and Admin/Panel Members until evaluation completes

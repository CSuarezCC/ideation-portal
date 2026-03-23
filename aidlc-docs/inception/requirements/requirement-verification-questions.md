# Requirements Clarification Questions - Ideation Portal

Please answer the following questions by filling in the letter choice after each `[Answer]:` tag.
If none of the options match your needs, choose the last option (Other) and describe your preference.

Let me know when you're done answering all questions.

---

## Question 1
What is the primary deployment target for the Ideation Portal?

A) Cloud-hosted SaaS (AWS, Azure, GCP)
B) On-premises / self-hosted within the organization's infrastructure
C) Hybrid (cloud + on-premises)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
What is the expected scale of the platform in terms of users?

A) Small organization (up to 500 employees)
B) Medium organization (500 – 5,000 employees)
C) Large organization (5,000 – 50,000 employees)
D) Enterprise scale (50,000+ employees)
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 3
How should users authenticate to the Ideation Portal?

A) Username and password (local accounts managed by the portal)
B) Single Sign-On (SSO) via corporate identity provider (e.g., SAML, OIDC, Azure AD)
C) Social login (Google, Microsoft)
D) Multi-factor authentication (MFA) required
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
What are the user roles required in the system? (Select the best description)

A) Two roles only: Employee (idea submitter) and Panel Member (evaluator)
B) Three roles: Employee, Panel Member, and Admin (manages users, categories, evaluation cycles)
C) Four or more roles: Employee, Panel Member, Admin, and additional roles (e.g., Department Head, Read-only Viewer)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5
How should the idea evaluation process work?

A) Panel members score ideas independently and scores are aggregated automatically (blind scoring — panel members cannot see each other's scores until all have submitted)
B) Panel members score ideas independently and scores are visible to all panel members in real time
C) Panel members score ideas and then hold a consensus discussion before finalizing scores
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
What evaluation dimensions/criteria should be used to score ideas? (Select the best match)

A) Three fixed dimensions: Feasibility, Impact, Innovation (as described in the requirements)
B) Three fixed dimensions plus a free-text justification field per dimension
C) Configurable dimensions — admins can define custom evaluation criteria per campaign/cycle
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 7
Should the Ideation Portal support multiple idea campaigns or evaluation cycles (e.g., Q1 Innovation Drive, Annual Hackathon)?

A) Yes — support multiple named campaigns with defined start/end dates
B) No — single continuous open submission model (ideas are always open for submission)
C) Both — a default open channel plus the ability to create time-boxed campaigns
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 8
What should the recognition/reward system look like for the top 3 ideas?

A) Digital badges and certificates displayed on the portal (no monetary reward)
B) Formal announcement on the portal leaderboard with winner profiles highlighted
C) Integration with an external HR or rewards system to trigger monetary/gift rewards
D) Both digital recognition on the portal AND notification to HR/management for follow-up
E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 9
What technology stack preference do you have for the application?

A) Full-stack JavaScript/TypeScript (e.g., React frontend + Node.js/Express backend)
B) Java/Spring Boot backend + React or Angular frontend
C) Python backend (FastAPI or Django) + React frontend
D) No preference — let the AI recommend the most suitable stack
E) Other (please describe after [Answer]: tag below)

[Answer]: E - Typescript, React frontend + Node.js backend, serverless in aws with lambdas, asynchronous events as necesary. All resources defined in a template.yaml

---

## Question 10
What is the preferred database technology?

A) Relational database (PostgreSQL or MySQL)
B) NoSQL document store (MongoDB, DynamoDB)
C) Managed cloud database (AWS RDS, Azure SQL, Google Cloud SQL)
D) No preference — let the AI recommend
E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 11
Should the portal support idea categorization (e.g., by department, topic, or business unit)?

A) Yes — ideas should be tagged/categorized and filterable by category
B) No — all ideas go into a single pool
C) Yes — and categories should be admin-configurable
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 12
What notification capabilities are required?

A) In-portal notifications only (no email)
B) Email notifications for key events (idea submitted, evaluation complete, winner announced)
C) Both in-portal and email notifications
D) Push notifications (mobile) in addition to in-portal and email
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 13
Are there any compliance or data privacy requirements to consider?

A) Standard internal data handling — no specific regulatory requirements
B) GDPR compliance required (EU employees or data subjects)
C) Other regional data privacy regulations (CCPA, PDPA, etc.)
D) Internal data classification policies (e.g., data must stay within corporate network)
E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 14: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

# Execution Plan — Ideation Portal

## Detailed Analysis Summary

### Change Impact Assessment
- **User-facing changes**: Yes — full new application with submission UI, evaluation UI, dashboards, leaderboards, recognition
- **Structural changes**: Yes — new system architecture (serverless, event-driven, multi-role)
- **Data model changes**: Yes — new DynamoDB tables for users, ideas, campaigns, evaluations, notifications
- **API changes**: Yes — new REST API via API Gateway + Lambda
- **NFR impact**: Yes — serverless scalability, blind scoring enforcement, async event processing, performance targets

### Risk Assessment
- **Risk Level**: Medium-High (new system, multiple domains, async workflows, role-based security)
- **Rollback Complexity**: Easy (greenfield — nothing to roll back to)
- **Testing Complexity**: Complex (multi-role, blind scoring logic, async event flows, aggregation)

---

## Workflow Visualization

### Text Representation (Canonical)

```
INCEPTION PHASE
  [x] Workspace Detection          - COMPLETED
  [ ] Reverse Engineering          - SKIPPED (Greenfield)
  [x] Requirements Analysis        - COMPLETED
  [ ] User Stories                 - SKIPPED (requirements clear, user approved skip)
  [x] Workflow Planning            - IN PROGRESS
  [ ] Application Design           - EXECUTE
  [ ] Units Generation             - EXECUTE

CONSTRUCTION PHASE (per unit)
  [ ] Functional Design            - EXECUTE
  [ ] NFR Requirements             - EXECUTE
  [ ] NFR Design                   - EXECUTE
  [ ] Infrastructure Design        - EXECUTE
  [ ] Code Generation              - EXECUTE (ALWAYS)
  [ ] Build and Test               - EXECUTE (ALWAYS)

OPERATIONS PHASE
  [ ] Operations                   - PLACEHOLDER
```

### Mermaid Diagram

```mermaid
flowchart TD
    Start(["User Request"])

    subgraph INCEPTION["INCEPTION PHASE"]
        WD["Workspace Detection\nCOMPLETED"]
        RE["Reverse Engineering\nSKIPPED"]
        RA["Requirements Analysis\nCOMPLETED"]
        US["User Stories\nSKIPPED"]
        WP["Workflow Planning\nIN PROGRESS"]
        AD["Application Design\nEXECUTE"]
        UG["Units Generation\nEXECUTE"]
    end

    subgraph CONSTRUCTION["CONSTRUCTION PHASE"]
        FD["Functional Design\nEXECUTE"]
        NFRA["NFR Requirements\nEXECUTE"]
        NFRD["NFR Design\nEXECUTE"]
        ID["Infrastructure Design\nEXECUTE"]
        CG["Code Generation\nEXECUTE"]
        BT["Build and Test\nEXECUTE"]
    end

    subgraph OPERATIONS["OPERATIONS PHASE"]
        OPS["Operations\nPLACEHOLDER"]
    end

    Start --> WD
    WD --> RA
    RA --> WP
    WP --> AD
    AD --> UG
    UG --> FD
    FD --> NFRA
    NFRA --> NFRD
    NFRD --> ID
    ID --> CG
    CG -->|Next Unit| FD
    CG --> BT
    BT -.-> OPS
    BT --> End(["Complete"])

    style WD fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style RA fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style WP fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style CG fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style BT fill:#4CAF50,stroke:#1B5E20,stroke-width:3px,color:#fff
    style RE fill:#BDBDBD,stroke:#424242,stroke-width:2px,stroke-dasharray: 5 5,color:#000
    style US fill:#BDBDBD,stroke:#424242,stroke-width:2px,stroke-dasharray: 5 5,color:#000
    style AD fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style UG fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style FD fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style NFRA fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style NFRD fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style ID fill:#FFA726,stroke:#E65100,stroke-width:3px,stroke-dasharray: 5 5,color:#000
    style OPS fill:#BDBDBD,stroke:#424242,stroke-width:2px,stroke-dasharray: 5 5,color:#000
    style INCEPTION fill:#BBDEFB,stroke:#1565C0,stroke-width:3px,color:#000
    style CONSTRUCTION fill:#C8E6C9,stroke:#2E7D32,stroke-width:3px,color:#000
    style OPERATIONS fill:#FFF59D,stroke:#F57F17,stroke-width:3px,color:#000
    style Start fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px,color:#000
    style End fill:#CE93D8,stroke:#6A1B9A,stroke-width:3px,color:#000

    linkStyle default stroke:#333,stroke-width:2px
```

---

## Phases to Execute

### INCEPTION PHASE
- [x] Workspace Detection — COMPLETED
- [x] Reverse Engineering — SKIPPED (Greenfield, no existing code)
- [x] Requirements Analysis — COMPLETED
- [ ] User Stories — SKIPPED
  - **Rationale**: Requirements are detailed and clear. User approved skipping. No ambiguity requiring story-level clarification.
- [x] Workflow Planning — IN PROGRESS
- [ ] Application Design — EXECUTE
  - **Rationale**: New system with multiple new services (User Service, Idea Service, Campaign Service, Evaluation Service, Notification Service, Analytics Service, Recognition Service). Component boundaries, methods, and service interactions need definition before code generation.
- [ ] Units Generation — EXECUTE
  - **Rationale**: Multiple independent domains can be developed as separate units of work, enabling structured parallel development and clear code generation scope per unit.

### CONSTRUCTION PHASE (per unit)
- [ ] Functional Design — EXECUTE
  - **Rationale**: Complex business logic including blind scoring enforcement, score aggregation algorithm, campaign lifecycle state machine, draft auto-save, and recognition workflow require detailed design.
- [ ] NFR Requirements — EXECUTE
  - **Rationale**: Serverless tech stack (Lambda, DynamoDB, Cognito, EventBridge, S3, CloudFront) needs explicit NFR mapping. Performance targets (2s API, 5s dashboard refresh) and scalability (500–5,000 users) need design decisions.
- [ ] NFR Design — EXECUTE
  - **Rationale**: NFR patterns need incorporation: DynamoDB access patterns, Lambda cold start mitigation, EventBridge event schema design, Cognito JWT validation middleware, S3 pre-signed URL patterns.
- [ ] Infrastructure Design — EXECUTE
  - **Rationale**: Full AWS SAM template.yaml needs specification covering all Lambda functions, API Gateway routes, DynamoDB tables, Cognito User Pool, EventBridge rules, S3 buckets, CloudFront distribution, and IAM roles.
- [ ] Code Generation — EXECUTE (ALWAYS)
  - **Rationale**: Implementation of all units.
- [ ] Build and Test — EXECUTE (ALWAYS)
  - **Rationale**: Build, test, and verification instructions for all units.

### OPERATIONS PHASE
- [ ] Operations — PLACEHOLDER
  - **Rationale**: Future deployment and monitoring workflows not yet defined.

---

## Estimated Units of Work (Preliminary)

The following units are anticipated from Application Design + Units Generation:

| Unit | Domain | Key Scope |
|---|---|---|
| Unit 1 | Infrastructure & Auth | SAM template, Cognito, API Gateway, shared middleware |
| Unit 2 | User & Campaign Management | User CRUD, role assignment, campaign lifecycle |
| Unit 3 | Idea Submission | Idea form, draft saving, category tagging, file upload |
| Unit 4 | Evaluation Engine | Blind scoring, score aggregation, evaluation workflow |
| Unit 5 | Dashboards & Leaderboard | Real-time leaderboard, multi-dimensional views |
| Unit 6 | Analytics | Top ideas, comparative analysis, participation metrics |
| Unit 7 | Notifications & Recognition | In-portal notifications, top-3 recognition, admin alerts |

*Final units will be confirmed after Application Design and Units Generation stages.*

---

## Success Criteria
- **Primary Goal**: Fully functional Ideation Portal deployed on AWS (serverless)
- **Key Deliverables**: React SPA, Lambda API, DynamoDB schema, SAM template.yaml, async event flows
- **Quality Gates**: Blind scoring enforced server-side, RBAC on all endpoints, leaderboard accuracy, recognition workflow triggered correctly

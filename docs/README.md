# SecureAssess — Documentation Overview

SecureAssess is an enterprise-grade, multi-tenant B2B SaaS platform for online examinations, timed assessments, live video interviews, and real-time proctoring/integrity monitoring. It allows organizations (universities, enterprises, recruitment agencies, and bootcamps) to manage question banks, construct evaluations, conduct browser-monitored tests, and run peer-to-peer video interviews with zero third-party conferencing tools.

---

## Documentation Index

| Document | Purpose |
| :--- | :--- |
| [**Architecture & Design (ARCHITECTURE.md)**](./ARCHITECTURE.md) | High-level system topology, decoupled identity model, RBAC matrix, request lifecycle, WebRTC signaling, and runtime execution pipeline. |
| [**Phase-by-Phase Summary (PHASE_BY_PHASE_SUMMARY.md)**](./PHASE_BY_PHASE_SUMMARY.md) | Detailed chronological breakdown of all 20 milestones from Phase 0 to Step 19. |
| [**REST & Real-Time API (API.md)**](./API.md) | Comprehensive route index across all 19 completed modules, HTTP request/response payloads, authentication guards, and Socket.io events. |
| [**Data Model & Schemas (DATA_MODEL.md)**](./DATA_MODEL.md) | Mongoose schema definitions, field types, relationships, indexes, and multi-tenant scoping rules. |
| [**Environment & Setup Guide (SETUP.md)**](./SETUP.md) | Prerequisites, environment variables specification, step-by-step installation, and database seeding procedures. |
| [**Contributing & Code Conventions (CONTRIBUTING.md)**](./CONTRIBUTING.md) | Clean Architecture 9-file module contract, naming patterns, DTO mappers, and coding conventions. |

---

## Key Features & Completed Modules (Steps 1–19)

- **Decoupled Identity & Multi-Tenancy**: Universal user identity allowing individuals to belong to multiple independent organizations with distinct roles (`UserMembership`).
- **Granular RBAC**: 121 fine-grained permissions divided into `PLATFORM` and `ORGANIZATION` scopes across 7 system roles (`PLATFORM_OWNER`, `PLATFORM_ADMIN`, `ORGANIZATION_OWNER`, `ORGANIZATION_ADMIN`, `EXAMINER`, `PROCTOR`, `CANDIDATE`).
- **Academic Hierarchy**: Deep structure organizing assessments by Department, Program, and Subject with tenant foreign-key isolation.
- **Question Bank & Multi-Type Questions**: Question banks supporting `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`, `CODING`, `VIDEO_RESPONSE`, tags, and categories.
- **Assessment Builder & 7-Stage Lifecycle**: Authoring engine with immutable question snapshots and lifecycle transitions: `DRAFT` $\to$ `READY_FOR_REVIEW` $\to$ `APPROVED` $\to$ `PUBLISHED` $\to$ `ACTIVE` $\to$ `CLOSED` $\to$ `ARCHIVED`.
- **Candidate & Cohort Assignment**: Candidate profiling, candidate groups with horizontal membership collections, cryptographic access codes (`SA-XXXX-XXXX`), and candidate authorization boundaries.
- **Runtime Attempt Engine**: Authoritative server-side timers (`expiresAt = MIN(...)`), duplicate active attempt prevention, candidate question/option shuffling with masked answers, and heartbeat telemetry.
- **Answer Management & Autosave**: Isolated answer storage, debounced autosave with versioning, anti-tampering guards, and race-condition protected atomic submission.
- **Evaluation & Automated Grading Engine**: Extensible strategy pattern graders, per-question `EvaluationItem` breakdown, negative marking, pass/fail and grade calculation, versioned regrading, and publication gates.

---

## Tech Stack

### Backend
- **Runtime**: Node.js (v18+ LTS, ES Modules `"type": "module"`)
- **Web Framework**: Express v5.2.1
- **Database & ODM**: MongoDB with Mongoose v9.9.4
- **Real-Time & Signaling**: Socket.io v4.8.3
- **Media & Cloud Storage**: Cloudinary SDK
- **Email & Notifications**: Nodemailer (SMTP / Gmail)
- **Authentication & Security**: JSON Web Tokens (`jsonwebtoken` v9.0.3), `bcryptjs` v3.0.3, CORS v2.8.6, Custom Security Headers

### Frontend
- **Framework & Build Tool**: React v19.2.8, Vite v8.2.2
- **Routing**: React Router v7.18.2
- **State Management**: Zustand v5.0.15
- **Styling**: Tailwind CSS with Universal Theme Engine (Light / Dark)

---

## Integration Test Coverage

SecureAssess features dedicated end-to-end integration test suites across every completed development stage:

```bash
# Run All Integration Test Suites
node server/tests/integration/step13_hierarchy.test.js
node server/tests/integration/step14_question_bank.test.js
node server/tests/integration/step15_assessment_lifecycle.test.js
node server/tests/integration/step16_candidate_assignment.test.js
node server/tests/integration/step17_assessment_attempts.test.js
node server/tests/integration/step18_answer_management.test.js
node server/tests/integration/step19_evaluation_engine.test.js
```

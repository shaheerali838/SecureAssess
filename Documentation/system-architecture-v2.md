# SecureAssess — System Architecture & Review Document (v2.5.0)

> **Document Version:** 2.5.0  
> **Status:** Steps 1 through 19 Complete & Verified via End-to-End Integration Test Suites  
> **Target Application:** SecureAssess (Enterprise Multi-Tenant Assessment, Video Interview & AI-Proctored Examination SaaS)

---

## Table of Contents

1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Project Root & Workspace Structure](#2-project-root--workspace-structure)
3. [Decoupled Identity & Multi-Tenant Model](#3-decoupled-identity--multi-tenant-model)
4. [RBAC & Authorization Matrix](#4-rbac--authorization-matrix)
5. [End-to-End Assessment Execution Engine (Steps 13–19)](#5-end-to-end-assessment-execution-engine-steps-1319)
6. [Database Collections & Schemas](#6-database-collections--schemas)
7. [Module Implementation Status Matrix](#7-module-implementation-status-matrix)

---

## 1. Executive Summary & System Architecture

SecureAssess is a multi-tenant B2B SaaS platform designed to conduct high-stakes assessments, live coding examinations, and proctored video interviews. It strictly isolates customer tenants (universities, enterprises, training bootcamps) while allowing the platform owner to maintain system oversight.

```
+──────────────────────────────────────────────────────────────────────────────────────+
|                                SecureAssess Platform                                 |
+──────────────────────────────────────────────────────────────────────────────────────+
                                           │
        ┌──────────────────────────────────┴──────────────────────────────────┐
        ▼                                                                     ▼
┌───────────────────────────────────┐                 ┌───────────────────────────────────┐
│       Client (React + Vite)       │                 │        Backend Service (Node)     │
│  - Candidate Exam Interface       │◄────HTTP/WS────►│  - Express REST API & RBAC Guards │
│  - Recruiter & Examiner Workspace │                 │  - WebRTC Signaling Server        │
│  - Real-Time Media & Audio Flags  │                 │  - Multi-Tenant Data Partitioning │
└───────────────────────────────────┘                 └─────────────────┬─────────────────┘
                                                                        │
                                                                        ▼
                                                      ┌───────────────────────────────────┐
                                                      │      MongoDB (SecureAssess)       │
                                                      │  - Users, Memberships, Sessions   │
                                                      │  - 7 System Roles & 121 Perms     │
                                                      │  - Hierarchy, Banks & Assessments │
                                                      │  - Candidates, Attempts & Results │
                                                      └───────────────────────────────────┘
```

---

## 2. Project Root & Workspace Structure

```
SecureAssess/
│
├── server/               # Backend REST API, WebSockets & Database layers
│   ├── src/
│   │   ├── config/       # Database, env, storage, cors, logger
│   │   ├── constants/    # Roles, 121 permissions, statuses, types
│   │   ├── middleware/   # Auth, Tenant, Role, Permission, RateLimit, Error
│   │   ├── modules/      # 19 Completed Domain Feature Modules
│   │   └── database/     # RBAC & Platform Admin seeders
│   └── tests/integration/# Integration test suites (Steps 13-19)
│
├── client/               # Frontend React single-page application (Vite)
├── docs/                 # Comprehensive documentation suite (API, Architecture, Data Model)
├── Shared/               # Cross-boundary DTO schemas, types & global enums
├── Documentation/        # Architecture specs, multi-tenancy rules & DB conventions
├── Infrastructure/       # Docker, coturn TURN server & cloud provisioning
├── README.md             # Project overview
└── package.json          # Root npm workspace orchestrator
```

---

## 3. Decoupled Identity & Multi-Tenant Model

SecureAssess avoids the anti-pattern of tying a User directly to a single organization. A User represents a **universal identity** who can hold different roles across multiple independent organizations.

```
                         SecureAssess Platform
                                  │
                             Authentication
                                  │
                                 User
                                  │
                  ┌───────────────┴────────────────┐
                  │                                │
           Platform Scope                  Organization Scope
                  │                                │
           platformRole                      UserMembership
                  │                                │
          ┌───────┴───────┐                ┌───────┴────────┐
          │               │                │                │
    PLATFORM_OWNER  PLATFORM_ADMIN    Organization A   Organization B
    (Root Owner)    (Platform Staff)       │                │
                                      roleId: ADMIN    roleId: EXAMINER
                                           │
                                     Candidate Profile
                                      (VU-CAND-01)
```

---

## 4. RBAC & Authorization Matrix

SecureAssess includes an RBAC engine with **121 granular permissions** mapped across **7 system roles**:

| System Role | Scope | Total Perms | Primary Responsibilities |
| :--- | :---: | :---: | :--- |
| **`PLATFORM_OWNER`** | `PLATFORM` | **121** | Root system administrator. Full authority over platform, organizations, subscriptions, billing, and system configurations. |
| **`PLATFORM_ADMIN`** | `PLATFORM` | **12** | Platform operations staff for monitoring organizations and viewing audit logs. |
| **`ORGANIZATION_OWNER`** | `ORGANIZATION` | **85** | Primary tenant administrator managing organization profile, staff, academic structure, question banks, exams, and candidate cohorts. |
| **`ORGANIZATION_ADMIN`** | `ORGANIZATION` | **57** | Operational administrator managing staff, schedules, question banks, exams, assignments, and grading. |
| **`EXAMINER`** | `ORGANIZATION` | **45** | Creates and curates question banks, constructs assessments, schedules candidate cohorts, and evaluates candidate attempts. |
| **`PROCTOR`** | `ORGANIZATION` | **9** | Supervises live examinations, monitors candidate streams, and reviews/flags integrity violations. |
| **`CANDIDATE`** | `ORGANIZATION` | **11** | Examinee. Strictly isolated to starting own attempts, updating own answers, and viewing published results. |

---

## 5. End-to-End Assessment Execution Engine (Steps 13–19)

```
Academic Structure (Step 13: Dept → Program → Subject)
       │
       ▼
Question Banks & Multi-Type Questions (Step 14: SingleChoice, MultipleChoice, Coding, Essay, TrueFalse)
       │
       ▼
Assessment Builder & 7-Stage Lifecycle (Step 15: Immutable Snapshots & Draft → Published Locking)
       │
       ▼
Candidate & Cohort Management (Step 16: Profiles, Groups, SA-XXXX-XXXX Access Codes, Authorization Boundary)
       │
       ▼
Runtime Attempts (Step 17: Authoritative Timers, Duplicate Protection, Option Shuffling, Heartbeat)
       │
       ▼
Answer Engine (Step 18: Debounced Autosave, Versioning, Tamper Protection, Atomic Submission)
       │
       ▼
Evaluation Engine (Step 19: Strategy Graders, Question-Level Items, Pass/Fail, Result Publishing)
```

---

## 6. Database Collections & Schemas

| Collection | Model File | Purpose | Key Compound Indexes |
| :--- | :--- | :--- | :--- |
| **`users`** | `user.model.js` | Universal identity | `{ email: 1 }` (unique), `{ platformRole: 1 }` |
| **`usermemberships`** | `userMembership.model.js` | Tenant role bindings | `{ userId: 1, organizationId: 1 }` (unique) |
| **`sessions`** | `session.model.js` | Token family sessions | `{ userId: 1 }`, `{ tokenFamily: 1 }` |
| **`organizations`** | `organization.model.js` | Tenant container | `{ slug: 1 }` (unique), `{ code: 1 }` (unique) |
| **`departments`** | `department.model.js` | Academic department | `{ organizationId: 1, code: 1 }` (unique) |
| **`programs`** | `program.model.js` | Degree program | `{ organizationId: 1, departmentId: 1, code: 1 }` (unique) |
| **`subjects`** | `subject.model.js` | Academic course | `{ organizationId: 1, programId: 1, code: 1 }` (unique) |
| **`questionbanks`** | `questionBank.model.js` | Question repository | `{ organizationId: 1, code: 1 }` (unique) |
| **`questions`** | `question.model.js` | Multi-type questions | `{ organizationId: 1, questionBankId: 1 }` |
| **`assessments`** | `assessment.model.js` | Exam configuration | `{ organizationId: 1, code: 1 }` (unique) |
| **`assessmentquestions`** | `assessmentQuestion.model.js` | Immutable snapshots | `{ organizationId: 1, assessmentId: 1 }` |
| **`candidates`** | `candidate.model.js` | Candidate profile | `{ organizationId: 1, candidateCode: 1 }` (unique) |
| **`candidategroups`** | `candidateGroup.model.js` | Cohorts & batches | `{ organizationId: 1, code: 1 }` (unique) |
| **`candidategroupmembers`** | `candidateGroupMember.model.js` | Group memberships | `{ organizationId: 1, groupId: 1, candidateId: 1 }` (unique) |
| **`assessmentassignments`**| `assessmentAssignment.model.js`| Exam assignments | `{ organizationId: 1, assessmentId: 1, candidateId: 1, status: 1 }` |
| **`attempts`** | `attempt.model.js` | Runtime attempt | `{ organizationId: 1, candidateId: 1, assessmentId: 1 }` |
| **`attemptquestions`** | `attemptQuestion.model.js` | Randomized runtime questions | `{ attemptId: 1, order: 1 }` |
| **`answers`** | `answer.model.js` | Candidate answers | `{ attemptId: 1, attemptQuestionId: 1 }` (unique) |
| **`evaluations`** | `evaluation.model.js` | Evaluation session | `{ organizationId: 1, attemptId: 1 }` |
| **`evaluationitems`** | `evaluationItem.model.js` | Question scores | `{ evaluationId: 1, attemptQuestionId: 1 }` (unique) |
| **`results`** | `result.model.js` | Final exam result | `{ attemptId: 1 }` (unique) |

---

## 7. Module Implementation Status Matrix

| Module | Status | Verification Test Suite |
| :--- | :---: | :--- |
| **Auth & Sessions (Steps 9–10)** | ✅ **100% DONE** | Automated login, refresh & revocation tests |
| **Multi-Tenancy & RBAC (Steps 5–12)** | ✅ **100% DONE** | Cross-tenant isolation test suites |
| **Departments, Programs & Subjects (Step 13)** | ✅ **100% DONE** | `step13_hierarchy.test.js` |
| **Question Bank & Multi-Type Questions (Step 14)**| ✅ **100% DONE** | `step14_question_bank.test.js` |
| **Assessment Builder & Lifecycle (Step 15)** | ✅ **100% DONE** | `step15_assessment_lifecycle.test.js` |
| **Candidate & Cohort Assignments (Step 16)** | ✅ **100% DONE** | `step16_candidate_assignment.test.js` |
| **Assessment Attempts Engine (Step 17)** | ✅ **100% DONE** | `step17_assessment_attempts.test.js` |
| **Answer Management & Autosave (Step 18)** | ✅ **100% DONE** | `step18_answer_management.test.js` |
| **Evaluation & Automated Grading (Step 19)** | ✅ **100% DONE** | `step19_evaluation_engine.test.js` |

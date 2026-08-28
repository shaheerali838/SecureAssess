# SecureAssess — Master Implementation Plan

**Document Version:** 1.0.0  
**Status:** In Active Execution  
**Architecture Baseline:** Vertical-Slice Modular Backend + 3-Portal Frontend  
**Target Milestone:** Frontend Foundation & Route Guard Implementation (Phases 1–5)  

---

## Table of Contents

1. [Executive Roadmap Summary](#1-executive-roadmap-summary)
2. [Current Project State vs Master Baseline](#2-current-project-state-vs-master-baseline)
3. [Phase-by-Phase Implementation Blueprint (Phases 1 – 20)](#3-phase-by-phase-implementation-blueprint-phases-1--20)
   - [Phase 1: Project & Frontend Foundation](#phase-1-project--frontend-foundation-immediate-next-step)
   - [Phase 2: Universal Identity & Auth Lifecycle](#phase-2-universal-identity--auth-lifecycle)
   - [Phase 3: Multi-Tenancy & Isolation Guardrails](#phase-3-multi-tenancy--isolation-guardrails)
   - [Phase 4: Scope-Aware RBAC & Dynamic Permissions](#phase-4-scope-aware-rbac--dynamic-permissions)
   - [Phase 5: Platform Super Admin Portal](#phase-5-platform-super-admin-portal)
   - [Phase 6: Organization Management Suite](#phase-6-organization-management-suite)
   - [Phase 7: Question Banks & Authoring Subsystem](#phase-7-question-banks--authoring-subsystem)
   - [Phase 8: Assessment Builder & Configuration Engine](#phase-8-assessment-builder--configuration-engine)
   - [Phase 9: Assignments & Candidate Scheduling](#phase-9-assignments--candidate-scheduling)
   - [Phase 10: Candidate Portal & Experience Layout](#phase-10-candidate-portal--experience-layout)
   - [Phase 11: Secure Candidate Examination Engine](#phase-11-secure-candidate-examination-engine)
   - [Phase 12: Automated & Manual Grading Engine](#phase-12-automated--manual-grading-engine)
   - [Phase 13: Multi-Tier Proctoring Engine](#phase-13-multi-tier-proctoring-engine)
   - [Phase 14: Live WebRTC Technical Interviews](#phase-14-live-webrtc-technical-interviews)
   - [Phase 15: Results, Analytics & Reporting](#phase-15-results-analytics--reporting)
   - [Phase 16: Certificates & Notification Pipeline](#phase-16-certificates--notification-pipeline)
   - [Phase 17: Security Hardening & Audit Verification](#phase-17-security-hardening--audit-verification)
   - [Phase 18: Automated Testing Suite & Pen Testing](#phase-18-automated-testing-suite--pen-testing)
   - [Phase 19: Deployment Infrastructure & CI/CD](#phase-19-deployment-infrastructure--cicd)
   - [Phase 20: Production SaaS Launch Readiness](#phase-20-production-saas-launch-readiness)
4. [Critical Tenant-Isolation Test Matrix](#4-critical-tenant-isolation-test-matrix)
5. [Definition of Done (DoD) Checklist](#5-definition-of-done-dod-checklist)

---

## 1. Executive Roadmap Summary

```
                      SECUREASSESS 20-PHASE ROADMAP
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
COMPLETED (Backend Core)                            CURRENT FOCUS (Frontend)
├── Phase 1 Backend Scaffold (✅)                   ├── Phase 1 Frontend Foundation (⏳ NEXT)
├── Phase 2 Identity & Sessions (✅)                 ├── Phase 3/4 Auth & Tenant Context (⏳)
├── Phase 3 Tenant Isolation (✅)                    ├── Phase 5 Platform Portal (⏳)
├── Phase 4 Dual-Scope RBAC (✅)                    ├── Phase 6 Organization Portal (⏳)
└── 30+ Domain Schemas/Services (✅)                └── Phase 10/11 Candidate Exam Engine (⏳)
                                    │
                                    ▼
                        FUTURE INTEGRATIONS
                        ├── Phase 13 Multi-Tier AI Proctoring
                        ├── Phase 14 WebRTC Live Video Interviews
                        └── Phase 16 PDF Certificates with QR Verification
```

---

## 2. Current Project State vs Master Baseline

| Layer / Area | Specification Requirement | Repository Implementation State | Status |
| :--- | :--- | :--- | :---: |
| **Backend Workspace** | `server/` with modular vertical slices | `server/src/modules/` (30+ domain modules) |  **Complete** |
| **Identity Architecture** | Universal `User` + `UserMembership` | Implemented in `users/user.model.js` & `userMembership.model.js` |  **Complete** |
| **Tenant Middleware** | `tenant.middleware.js` with boundary checks | Implemented in `middleware/tenant.middleware.js` |  **Complete** |
| **RBAC & Permissions** | Platform vs Organization Scopes | Implemented in `constants/roles.js` & `middleware/permission.middleware.js` |  **Complete** |
| **Frontend Foundation** | React + Vite + Zustand + Axios | Boilerplate initialized in `client/` | ⏳ **Next Priority** |
| **Frontend Portals** | Platform, Organization & Candidate | Route shells and page components to be structured | ⏳ **Upcoming** |
| **Examination Engine** | Anti-tamper timer, auto-save, lock | Backend schema ready; UI examination runner to be implemented | ⏳ **Upcoming** |

---

## 3. Phase-by-Phase Implementation Blueprint (Phases 1 – 20)

### Phase 1: Project & Frontend Foundation (Immediate Next Step)
* **Goal:** Establish the unified API client, role/permission constants, and global context providers in `client/`.
* **Backend Status:**  Complete (Express, MongoDB, CORS, Helmet, rate limits active).
* **Frontend Tasks:**
  1. `client/src/services/api.js`: Axios instance with request interceptors injecting `Authorization: Bearer <token>` and `x-organization-id: <orgId>`, plus response interceptor for automatic refresh token rotation on HTTP 401.
  2. `client/src/constants/roles.js`, `client/src/constants/permissions.js`, `client/src/constants/status.js`: Sync with backend constants.
  3. `client/src/contexts/AuthContext.jsx`: Global authentication state, login, logout, and token restoration.
  4. `client/src/contexts/OrganizationContext.jsx`: Active organization selector, tenant switcher, and membership state.
  5. `client/src/contexts/ThemeContext.jsx` & `SidebarContext.jsx`: UI state management.
* **Deliverable:** Working client that logs in against backend and manages tenant context in localStorage/memory.

---

### Phase 2: Universal Identity & Auth Lifecycle
* **Backend Status:**  Complete (`auth` module, bcrypt, JWT access/refresh token generation, sessions).
* **Frontend Tasks:**
  1. `client/src/pages/auth/Login.jsx`: Secure login form with validation and error toast handling.
  2. `client/src/pages/auth/ForgotPassword.jsx` & `ResetPassword.jsx`: Self-service recovery workflow.
  3. `client/src/pages/auth/ChangePassword.jsx`: Authenticated password rotation.
* **Deliverable:** End-to-end authentication with refresh token rotation and session tracking.

---

### Phase 3: Multi-Tenancy & Isolation Guardrails
* **Backend Status:**  Complete (`requireTenantContext`, membership validation, organization status checks).
* **Frontend Tasks:**
  1. Multi-organization switcher dropdown in the dashboard header for users with multiple memberships.
  2. Tenant boundary error boundary (handling suspended/deactivated organization states gracefully).
* **Deliverable:** Verified cross-tenant boundary isolation with automatic HTTP header synchronization.

---

### Phase 4: Scope-Aware RBAC & Dynamic Permissions
* **Backend Status:**  Complete (`requirePlatformPermission`, `requireOrganizationOrPlatformPermission`).
* **Frontend Tasks:**
  1. `client/src/routes/ProtectedRoute.jsx`: Authentication verification guard.
  2. `client/src/routes/PlatformRoute.jsx`: Restricts `/platform/*` to `PLATFORM_OWNER` and `PLATFORM_ADMIN`.
  3. `client/src/routes/OrganizationRoute.jsx`: Restricts `/organization/*` to active organization members.
  4. `client/src/routes/CandidateRoute.jsx`: Restricts `/candidate/*` to candidates.
  5. `client/src/hooks/usePermissions.js`: Client-side UI capability helper (`can('assessment.create')`).
* **Deliverable:** Robust declarative route protection matching backend permission rules.

---

### Phase 5: Platform Super Admin Portal
* **Goal:** Build the executive dashboard for platform owners to govern tenants.
* **Tasks:**
  1. `/platform/dashboard`: Platform KPIs (Total Orgs, Active Candidates, Server Health, Concurrent Exams).
  2. `/platform/organizations`: Organization listing, creation wizard, status toggle (Active/Suspended/Deactivated).
  3. `/platform/users`: Global user directory and platform role assignments.
  4. `/platform/roles` & `/platform/permissions`: Visual RBAC permission explorer.
  5. `/platform/analytics` & `/platform/audit-logs`: Cross-tenant activity log stream.
* **Deliverable:** Functional Super Admin portal in `client/src/pages/platform/`.

---

### Phase 6: Organization Management Suite
* **Goal:** Enable tenant owners and admins to manage their institution.
* **Tasks:**
  1. `/organization/dashboard`: High-level tenant metrics (Active Assessments, Candidates, Pass Rates).
  2. `/organization/candidates`: Candidate roster, CSV bulk import, and individual profile views.
  3. `/organization/batches`: Cohort grouping, batch assignment, and membership management.
  4. `/organization/members`: Staff invitations (Examiners, Proctors, Admins) and role assignments.
* **Deliverable:** Operational Organization workspace in `client/src/pages/organization/`.

---

### Phase 7: Question Banks & Authoring Subsystem
* **Goal:** Full authoring lifecycle for diverse question types.
* **Tasks:**
  1. `/organization/questionBanks`: Category and tag management for question repositories.
  2. `/organization/questions/CreateQuestion`: Rich authoring form supporting MCQ, Multiple-Select, True/False, Short Answer, Long Answer, and Coding questions with test cases.
  3. Question search, filter by difficulty/tag, and question preview drawer.
* **Deliverable:** Reusable question repository with automated syntax validation.

---

### Phase 8: Assessment Builder & Configuration Engine
* **Goal:** Visual assessment builder for scheduling and security rule configuration.
* **Tasks:**
  1. Step-by-step assessment wizard (General Info $\rightarrow$ Sections & Questions $\rightarrow$ Grading Rules $\rightarrow$ Security/Proctoring Settings).
  2. Question selection modal from question banks with point weighting.
  3. Security configuration toggles: Fullscreen enforcement, Tab switch limits, WebRTC proctoring, Question randomization.
* **Deliverable:** `/organization/assessments/CreateAssessment` and assessment detail views.

---

### Phase 9: Assignments & Candidate Scheduling
* **Goal:** Target delivery of assessments to candidates and cohorts.
* **Tasks:**
  1. `/organization/assignments`: Assignment creation interface linking assessments to Batches or Candidate lists.
  2. Scheduling window controls: Available from / Available until, and maximum attempt limits.
  3. Automated invitation trigger generating secure candidate direct access tokens.
* **Deliverable:** Assignment distribution engine with real-time invitation tracking.

---

### Phase 10: Candidate Portal & Experience Layout
* **Goal:** Dedicated, clean candidate workspace.
* **Tasks:**
  1. `/candidate/dashboard`: Active, upcoming, and past assessment roster.
  2. `/candidate/assessments/Instructions`: Pre-exam briefing, system requirements checklist, and microphone/camera permission verification.
  3. Candidate profile and certificate repository.
* **Deliverable:** Clean, distraction-free candidate portal in `client/src/pages/candidate/`.

---

### Phase 11: Secure Candidate Examination Engine
* **Goal:** Build the mission-critical high-stakes exam runner.
* **Tasks:**
  1. Locked fullscreen examination viewport (`/candidate/assessments/Attempt`).
  2. Anti-tamper server-synchronized countdown timer with local animation fallback.
  3. Question navigation palette with status markers (Answered, Flagged for Review, Unvisited).
  4. Auto-save engine persisting candidate responses every 15 seconds over debounced API calls.
  5. Network disconnect detection with offline answer buffer and automatic recovery sync.
  6. Final review modal and submission confirmation.
* **Deliverable:** Resilient candidate examination engine with zero-data-loss guarantees.

---

### Phase 12: Automated & Manual Grading Engine
* **Goal:** Complete evaluation pipeline for objective and subjective answers.
* **Tasks:**
  1. Backend evaluation runner automatically scoring MCQ, True/False, and Coding test cases.
  2. `/organization/grading`: Manual grading queue for examiners to review essay and long-form answers with rubrics.
  3. Score calculation, grading curve application, and result publication workflows.
* **Deliverable:** Fast, accurate grading engine with audit-recorded examiner feedback.

---

### Phase 13: Multi-Tier Proctoring Engine
* **Goal:** Real-time exam integrity monitoring and anomaly detection.
* **Tasks:**
  1. Client-side browser event listeners (`visibilitychange`, `blur`, `fullscreenchange`, copy/paste interceptors).
  2. Media stream capture (webcam video + microphone audio) via WebRTC.
  3. Real-time telemetry ingestion writing to `ProctoringEvent` records.
  4. `/organization/proctoring`: Live invigilator dashboard displaying candidate video grid with risk flags.
* **Deliverable:** End-to-end multi-tier proctoring system.

---

### Phase 14: Live WebRTC Technical Interviews
* **Goal:** Real-time peer-to-peer technical interview rooms.
* **Tasks:**
  1. WebSocket signaling gateway for WebRTC SDP Offer/Answer and ICE candidate exchange.
  2. Split-screen interview UI: Two-way HD video/audio, collaborative Monaco code editor, and live chat.
  3. Private interviewer rubric scorecard and note-taking panel.
* **Deliverable:** Production-ready live video interview workspace.

---

### Phase 15: Results, Analytics & Reporting
* **Goal:** Deep performance insights for candidates, organizations, and platform admins.
* **Tasks:**
  1. Candidate scorecard view with topic-wise strength/weakness analysis.
  2. Organization cohort analytics: Score distribution histograms, question difficulty indices, and completion rates.
  3. CSV / PDF export engine for gradebooks and administrative compliance reports.
* **Deliverable:** Comprehensive interactive reporting suite.

---

### Phase 16: Certificates & Notification Pipeline
* **Goal:** Automated credentialing and communication.
* **Tasks:**
  1. Backend PDF certificate generation using PDFKit or Puppeteer with embedded verification QR code.
  2. Public verification route (`/verify/certificate/:id`) allowing external parties to validate authenticity.
  3. In-app notification center and transactional email dispatch (Nodemailer / SendGrid).
* **Deliverable:** Tamper-evident digital certification and notification infrastructure.

---

### Phase 17: Security Hardening & Audit Verification
* **Goal:** Enterprise security verification and penetration readiness.
* **Tasks:**
  1. Security audit across all 30+ modules verifying tenant isolation in every query (`{ organizationId }`).
  2. Rate limit tuning on auth endpoints (login, forgot password, token refresh).
  3. Comprehensive audit trail logging for all mutations across the platform.
* **Deliverable:** Fully hardened, compliant enterprise security posture.

---

### Phase 18: Automated Testing Suite & Pen Testing
* **Goal:** Comprehensive unit, integration, and end-to-end test coverage.
* **Tasks:**
  1. Backend integration tests using Jest / Supertest covering Auth, Tenant boundary, and RBAC guards.
  2. Tenant isolation penetration test matrix executing cross-tenant access attempts.
  3. Frontend component tests and candidate exam runner simulation tests.
* **Deliverable:** Continuous integration automated test pipeline with $>85\%$ coverage on core services.

---

### Phase 19: Deployment Infrastructure & CI/CD
* **Goal:** Production-grade containerization and cloud orchestration.
* **Tasks:**
  1. Multi-stage Dockerfiles for `server` and `client` (Nginx SPA proxy).
  2. Coturn TURN server deployment for reliable WebRTC media traversal behind corporate firewalls.
  3. GitHub Actions CI/CD pipeline for automated linting, testing, and container deployment.
* **Deliverable:** Scalable cloud deployment manifests and automated delivery pipeline.

---

### Phase 20: Production SaaS Launch Readiness
* **Goal:** Final operational readiness and commercial go-live.
* **Tasks:**
  1. Production database indexing and query optimization.
  2. Automated daily backup configuration with point-in-time recovery.
  3. Production monitoring (Sentry error tracking, Prometheus/Grafana metrics).
  4. Final end-to-end smoke testing across Super Admin, Org Admin, and Candidate user journeys.
* **Deliverable:** Live, production-ready SecureAssess enterprise B2B SaaS platform.

---

## 4. Critical Tenant-Isolation Test Matrix

Every organization-scoped resource must be systematically tested against cross-tenant breach attempts:

| Resource Entity | Test Scenario | Actor Context | Target Resource | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **Organizations** | Access other org settings | User in Org A | Org B Metadata | **403 Forbidden** |
| **Candidates** | Query candidate roster | Admin in Org A | Org B Candidates | **403 / Empty Set** |
| **Question Banks** | Read private question bank | Examiner in Org A | Org B Question Bank | **404 / 403 Forbidden** |
| **Assessments** | Edit assessment draft | Admin in Org A | Org B Assessment | **403 Forbidden** |
| **Assignments** | Assign exam to external batch | Admin in Org A | Org B Batch | **400 / 403 Forbidden** |
| **Attempts** | Submit answer to external attempt | Candidate in Org A | Org B Attempt | **403 Forbidden** |
| **Results** | View gradebook / scores | Admin in Org A | Org B Results | **403 Forbidden** |
| **Audit Logs** | Query security activity | Admin in Org A | Org B Audit Trail | **403 Forbidden** |

---

## 5. Definition of Done (DoD) Checklist

A feature is considered complete **only** when all of the following criteria are satisfied:
- [x] **Database Schema & Indexes:** Schema created with tenant isolation (`organizationId`) and performance indexes.
- [x] **Service Layer:** Business logic encapsulated in service class; controllers remain thin.
- [x] **Validation:** Request body, query parameters, and route parameters validated via Joi/Zod or custom validator.
- [x] **Authentication & RBAC:** Protected by `requireAuth()`, `requireTenantContext()`, and granular permission middleware.
- [x] **Tenant Boundary Check:** Query strictly bound to `{ organizationId: req.organizationId }`.
- [x] **Frontend UI & State:** Responsive React UI integrated with `api.js` and context providers.
- [x] **Error Handling:** Graceful API error responses using `ApiError` and user-friendly toast notifications.
- [x] **Audit Trail:** Meaningful mutations logged to `AuditLog`.
- [x] **Automated Tests:** Unit or integration test verifying successful execution and 403 unauthorized rejection.

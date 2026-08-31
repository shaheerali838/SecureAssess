# 🏛️ SecureAssess — Complete Phase-by-Phase Implementation Summary (Phase 0 to Step 19)

> **Document Version:** 1.0.0  
> **Status:** 20 Milestones Completed & Verified via Automated Integration Test Suites  
> **Scope:** Complete architectural and functional progression of the SecureAssess platform.

---

## 🗺️ System Pipeline Architecture

```
                      PHASE 0 to 6 (Core Infrastructure & Identity)
                                           │
       ┌───────────────────────────────────┼───────────────────────────────────┐
       ▼                                   ▼                                   ▼
  Decoupled Identity                 Multi-Tenancy Scoping               121 Granular RBAC
 (User ↔ UserMembership)            (Tenant Scoped Isolation)          (7 Built-in System Roles)
                                           │
                                           ▼
                      PHASES 7 to 13 (End-to-End Exam Execution Pipeline)
                                           │
  Step 13: Academic Structure (Dept → Program → Subject)
       │
       ▼
  Step 14: Question Banks (MCQ, Coding, Essay, True/False, Short Answer)
       │
       ▼
  Step 15: Assessment Builder (Immutable Snapshots & 7-Stage Lifecycle)
       │
       ▼
  Step 16: Candidate & Cohort Assignments (Candidate Groups & SA-XXXX-XXXX Codes)
       │
       ▼
  Step 17: Attempt Engine (Authoritative Timers, Option Shuffling & Heartbeat)
       │
       ▼
  Step 18: Answer Management (Autosave Versioning, Anti-Tamper & Atomic Lock)
       │
       ▼
  Step 19: Evaluation Engine (Strategy Graders, Score Breakdown & Result Publishing)
```

---

## 📋 Comprehensive Phase-by-Phase Breakdown

### Phase 0: System Architecture & Inception
- **Architecture Blueprint**: Designed SecureAssess as an enterprise-grade multi-tenant B2B SaaS platform for universities, enterprises, and recruitment agencies.
- **Workspace Organization**: Established dual-workspace repository containing the React 19 / Vite client (`client/`) and the Node.js / Express backend (`server/`).
- **WebRTC Signaling Strategy**: Established peer-to-peer WebRTC video/audio streaming via Socket.io signaling where media never proxies through API servers.

---

### Phase 1: Backend Foundation & Infrastructure (Steps 1–4)
- **Express & Mongoose Setup**: Modern ES Modules (`"type": "module"`), fail-fast MongoDB connection with connection pooling and graceful shutdown listeners.
- **Environment & Configuration**: Typed, frozen environment loader (`config/env.js`), CORS whitelist policies, and centralized Winston logging.
- **Clean Architecture 9-File Contract**: Established modular standard (`model`, `controller`, `service`, `repository`, `validator`, `routes`, `mapper`, `constants`, `index.js`).

---

### Phase 2: Granular RBAC & Universal Error Handling (Steps 5–6)
- **121 Atomic RBAC Permissions**: Structured as `resource.action` across `PLATFORM` and `ORGANIZATION` scopes.
- **7 System Roles**: `PLATFORM_OWNER`, `PLATFORM_ADMIN`, `ORGANIZATION_OWNER`, `ORGANIZATION_ADMIN`, `EXAMINER`, `PROCTOR`, `CANDIDATE`.
- **Database Seeder Pipeline**: Built `seedRBAC()` and `seedAdmin()` to populate roles and initialize root Platform Owner.
- **Universal Error Handling Engine**: Centralized `ApiError`, standard `ApiResponse`, `asyncHandler`, and global error interceptor.

---

### Phase 3: Media Upload & Cloud Storage (Step 7)
- **Cloudinary Integration**: Configured secure media storage for proctoring snapshots, identity verification photos, and candidate avatars.
- **Multer Upload Pipeline**: Memory storage buffering with file size limits, MIME type guards, and signed expiring URLs.

---

### Phase 4: Organization & Tenant Management (Step 8)
- **Tenant Management APIs**: Implemented full CRUD for `/api/v1/organizations`.
- **Tenant Lifecycle**: Built organization states (`ACTIVE`, `PENDING_VERIFICATION`, `SUSPENDED`, `DEACTIVATED`).
- **Organization Membership Roster**: Added member invitation, role modification, and member removal endpoints.

---

### Phase 5: Decoupled Identity & Authentication (Steps 9–10)
- **Decoupled User Identity**: Split identity into universal `User` records and contextual `UserMembership` records. A single user can belong to multiple organizations with different roles without hardcoding `organizationId` into `User`.
- **Session & Token Management**: JWT Access Tokens (15m/1d) and Refresh Tokens (7d) with token family rotation in MongoDB `Session` to detect and block replay attacks.
- **Account Security**: Bcrypt password hashing, login lockout after failed attempts, and token version revocation.

---

### Phase 6: Multi-Tenant Scoping & Security Boundaries (Steps 11–12)
- **Tenant Middleware**: Built `requireTenantContext` interceptor extracting `req.organizationId` strictly from verified JWT tokens or `x-organization-id` headers.
- **Cross-Tenant Data Isolation**: Implemented tenant isolation guards ensuring tenant A can never query, modify, or leak data belonging to tenant B.

---

### Phase 7: Academic Hierarchy (Step 13)
- **3-Tier Academic Taxonomy**: `Department` $\to$ `Program` $\to$ `Subject`.
- **Relational Validation**: Cross-tenant foreign key verification (`program.departmentId` and `subject.programId` must match current `organizationId`).
- **Compound Indexes**: Unique constraints on `{ organizationId: 1, code: 1 }`.
- **Verification**: Verified via `step13_hierarchy.test.js`.

---

### Phase 8: Question Bank & Multi-Type Authoring (Step 14)
- **Question Repository**: Built `QuestionBank`, `QuestionCategory`, and `QuestionTag` modules.
- **Multi-Type Questions**: Full support for `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`, `CODING`, and `VIDEO_RESPONSE`.
- **Answer Masking (DTO Mapper)**: Built `QuestionMapper` delivering full answer keys to examiners while completely stripping `correctAnswer` and `isCorrect` from candidate delivery.
- **Verification**: Verified via `step14_question_bank.test.js`.

---

### Phase 9: Assessment Builder & 7-Stage Lifecycle (Step 15)
- **Authoring Engine**: Section management, duration configuration, passing scores, anti-cheat switches.
- **Immutable Question Snapshots**: Assessments copy question snapshots (`prompt`, `options`, `correctAnswer`, `points`) into `AssessmentQuestion` records upon adding. Question bank edits never distort running or past exams.
- **7-Stage Lifecycle**: `DRAFT` $\to$ `READY_FOR_REVIEW` $\to$ `APPROVED` $\to$ `PUBLISHED` $\to$ `ACTIVE` $\to$ `CLOSED` $\to$ `ARCHIVED`.
- **Published Exam Locking**: Strictly blocks exam modifications once status reaches `PUBLISHED`.
- **Verification**: Verified via `step15_assessment_lifecycle.test.js`.

---

### Phase 10: Candidate Profiling & Cohort Assignments (Step 16)
- **Candidate Profiles**: `Candidate` profile model binding universal user identity to tenant-scoped candidate codes (`candidateCode`).
- **Normalized Candidate Groups**: Built `CandidateGroup` and high-scale `CandidateGroupMember` collections.
- **Individual & Batch Assignments**: Supports individual assignments and batch group assignments with generated access codes (`SA-XXXX-XXXX`) and personalized availability windows (`availableFrom`, `availableUntil`).
- **Candidate Authorization Boundary**: Built candidate portal endpoints (`/candidate-portal/*`) where access is granted strictly through active assignments, eliminating IDOR vulnerabilities.
- **Verification**: Verified via `step16_candidate_assignment.test.js`.

---

### Phase 11: Examination Runtime — Attempt Engine & Timers (Step 17)
- **Authoritative Server Timers**: `expiresAt = MIN(now + duration, assignment.availableUntil, assessment.scheduling.endAt)`.
- **Duplicate Active Attempt Protection**: Prevents concurrent attempts for the same candidate while supporting seamless reconnections/resume without consuming attempt quotas.
- **Runtime Question Delivery**: Materializes `AttemptQuestion` snapshots with candidate-specific option order shuffling and masked answers.
- **Heartbeat Telemetry**: Live `/heartbeat` tracking `lastActivityAt` and authoritative remaining seconds.
- **Submission Locking**: Transitions status to `SUBMITTED`, sets `submittedAt`, and locks against further modifications.
- **Verification**: Verified via `step17_assessment_attempts.test.js`.

---

### Phase 12: Answer Management & Autosave Engine (Step 18)
- **Decoupled Answer Storage**: Dedicated `Answer` collection with unique index `{ attemptId: 1, attemptQuestionId: 1 }`.
- **Structured Representation**: Typed answer schemas supporting all 6 question formats.
- **Debounced Autosave & Versioning**: Version tracking (`version`) on every answer save.
- **Anti-Tampering Guard**: Rejects any request carrying client-supplied grading fields (`points`, `isCorrect`, `score`) with `400 Bad Request`.
- **Navigation & Policy Controls**: Server-enforced back-navigation policies (`allowBackNavigation`) and unanswered submission policies (`allowUnanswered`).
- **Atomic Concurrency Guard**: Atomic conditional updates on submission preventing race conditions with expiry timers.
- **Verification**: Verified via `step18_answer_management.test.js`.

---

### Phase 13: Evaluation & Automated Grading Engine (Step 19)
- **Decoupled Evaluation & Results**: Separates evaluation mechanics (`Evaluation`) from official published results (`Result`).
- **Strategy Pattern Graders**: Registry of specialized graders (`singleChoice`, `multipleChoice`, `trueFalse`, `shortAnswer`, `coding`, `manual`).
- **Question-Level Breakdown (`EvaluationItem`)**: Individual score records storing earned points, percentage, and feedback per question.
- **Scoring Logic**: Full points, partial credit, and assessment-level negative marking penalties.
- **Result Generation & Pass/Fail**: Percentage calculation, pass/fail decision based on `passingScore`, and letter grade assignment (`A+` to `F`).
- **Publication Gate**: Unpublished results remain `WITHHELD` until reviewed and published by an examiner (`published: true`).
- **Versioned Regrading**: Examiner can regrade attempts with version tracking (`version: 2`) preserving historical records.
- **Verification**: Verified via `step19_evaluation_engine.test.js`.

---

### Phase 14: Proctoring & Exam Integrity Foundation (Step 20)
- **Attempt-Bound Proctoring Sessions**: `ProctoringSession` model maintaining hardware states (`cameraEnabled`, `microphoneEnabled`, `screenShareEnabled`), browser/device telemetry, and heartbeat timestamps (`lastHeartbeatAt`).
- **Granular Integrity Event Taxonomy**: Built `ProctoringEvent` supporting 20 event types (`TAB_SWITCH`, `FULLSCREEN_EXITED`, `NO_FACE_DETECTED`, `MULTIPLE_FACES_DETECTED`, `SCREEN_SHARE_STOPPED`, `SUSPICIOUS_AUDIO`, `COPY_ATTEMPT`, `PASTE_ATTEMPT`, etc.).
- **Server-Authoritative Risk Engine**: `RiskService` and `riskRules.js` computing cumulative risk scores (0–100) and risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), strictly ignoring client-supplied scores.
- **Client Event Deduplication**: Sparse unique compound index `{ proctoringSessionId: 1, clientEventId: 1 }` preventing accidental duplicate event ingestion.
- **Chronological Audit Timeline & Violation Review**: Examiner timeline endpoint (`/timeline`) and annotation endpoint (`/review`) allowing proctors to mark violations as reviewed with audit notes.
- **Verification**: Verified via `step20_proctoring_foundation.test.js`.

---

### Phase 15: Notifications & Communication System (Step 21)
- **Centralized Event-Driven Notifier**: `Notification` and `NotificationPreference` models decoupling domain event triggers from delivery channels (`IN_APP`, `EMAIL`, `PUSH`, `SMS`).
- **Comprehensive Notification Taxonomy**: 25 notification types across accounts, assignments, attempts, evaluations, proctoring warnings, interviews, certificates, subscriptions, and security alerts.
- **Asynchronous Notification Queue Worker**: `runNotificationJob` processing pending emails in batches with templated HTML rendering.
- **In-App Management & UI Badges**: Real-time `/unread-count`, `/read`, `/read-all`, soft deletion, and critical security notification preference bypass.
- **Verification**: Verified via `step21_notifications_communication.test.js`.

---

### Phase 16: Reports & Analytics (Step 22)
- **High-Performance Aggregation Layer (`ReportAggregations`)**: MongoDB aggregation pipelines computing real-time completion rates, average scores, pass rates, question difficulty distributions, and proctoring telemetry breakdowns.
- **Multi-Level Dashboard Analytics**: Dedicated executive views for Organization Owners/Examiners (`/reports/dashboard`) and Platform Administrators (`/platform/reports/dashboard`).
- **Comprehensive Question & Difficulty Analytics**: Computes success rates per question to dynamically categorize item difficulty (`EASY` >80%, `MEDIUM` 40–80%, `HARD` <40%).
- **Multi-Format Export Engine**: `ReportService.exportReport` supporting instant JSON analytics and asynchronous CSV, PDF, and XLSX export files with 7-day retention management.
- **Candidate Self-Service Analytics**: Secure `/candidate/reports/performance` endpoint allowing candidates to audit their personal academic trajectory without cross-tenant or administrative data exposure.
- **Verification**: Verified via `step22_reports_analytics.test.js`.

---
### Phase 17: Certificates & Credential Management (Step 23)
- **Credential Model & Cryptographic Verification**: `Certificate` model with sequential human-readable numbers (`SA-YYYY-XXXXXX`) and cryptographically non-sequential verification codes (`XXXX-XXXX-XXXX`).
- **Sanitized Public Verification**: Unauthenticated public `/api/v1/public/certificates/verify/:verificationCode` endpoint returning authentic credential verification and revocation statuses without leaking candidate PII or internal IDs.
- **Strict Passing Eligibility Guards**: Enforces prerequisite assessment completion, passing score verification, and idempotency checks before issuing credentials.
- **Certificate Lifecycle & Revocation**: Complete credential lifecycle support (`DRAFT` $\to$ `ISSUED` $\to$ `REVOKED` / `EXPIRED`) with audit tracking (`revokedAt`, `revokedBy`, `revocationReason`).
- **Storage & Automated PDF Generation**: Seamless integration with `PdfService` and `StorageService` to produce verifiable PDF credentials alongside asynchronous queue processing via `runCertificateGenerationJob`.
- **Verification**: Verified via `step23_certificates_credentials.test.js`.

### Phase 18: Live Video Interviews & WebRTC Signaling (Step 25)
- **Comprehensive Interview & Session Architecture**: `Interview` (business schedule event), `InterviewParticipant` (multi-role presence & waiting room states), `InterviewSession` (live runtime room instance), and `InterviewEvent` (chronological audit logs).
- **Dedicated WebRTC Signaling Namespace (`/interviews`)**: JWT-authenticated Socket.IO gateway relaying peer-to-peer WebRTC SDP offers/answers and ICE candidate packets without routing bulky media streams through the Express server.
- **In-Room Media & Collaboration Controls**: Real-time notifications for camera/microphone toggling, screen sharing start/stop audit tracking, and in-room text chat.
- **Granular RBAC & Tenant Protection**: 12 new granular permissions governing scheduling, joining, ending, recording, and participant access control.
- **Verification**: Verified via `step25_live_interviews_webrtc.test.js`.

---

### Phase 19: Assessment Engine: Question Bank & Question Management (Step 26)
- **Rich Multi-Type Question Taxonomy**: Comprehensive support for 7 question formats (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`, `CODING`, `FILE_UPLOAD`), negative marking, coding execution configurations, and file attachment constraints.
- **Master Question Versioning**: Automatic version incrementation preserving historical assessment snapshots and immutability of candidate attempts.
- **Enterprise Bulk Import & Export**: Batch question import (JSON) and multi-format export (`CSV` and `JSON`) with automated field mapping.
- **Multi-Criteria Search & Filtering**: Fast full-text querying (`?q=`) and multi-dimensional filtering by difficulty (`EASY`, `MEDIUM`, `HARD`, `EXPERT`), type, category, and subject.
- **Answer Security & Candidate Protection**: Strict separation between Admin/Examiner DTOs (containing correct answers and explanations) and Candidate DTOs (sanitized).
- **Verification**: Verified via `step26_question_bank_engine.test.js`.

---

### Phase 20: Assessment Builder & Configuration (Step 27)
- **Comprehensive Assessment Configuration**: Modular configuration blocks for `securitySettings` (AI/live proctoring, fullscreen lock, tab detection, peripheral verification), `gradingSettings` (passing score, negative marking, automatic/hybrid grading), `attemptSettings` (max attempts, resume permissions), `scheduling` (windowed vs immediate), and `duration`.
- **Hierarchical Structure & Section Management**: Multi-section organization with dynamic drag-and-drop section and question reordering.
- **Immutable Question Snapshots**: Deep point-in-time question snapshot capturing protecting historical exams and candidate submissions against future master question bank edits.
- **Publish & Duplication Workflows**: Strict pre-publish integrity validation and full assessment deep cloning (`duplicate`) with independent section and question snapshots.
- **Candidate & Group Assignment Integration**: Batch assignment dispatching real-time notifications with personalized time windows and attempts allowed.
- **Verification**: Verified via `step27_assessment_builder_config.test.js`.

---

### Phase 21: Candidate Attempt & Examination Engine (Step 28)
- **Authoritative Server Timer & Expiry Engine**: Dynamic calculation of effective expiry based on assessment duration and assignment scheduling windows with automated timeout submission.
- **Candidate Snapshot Isolation**: Generates ordered `AttemptQuestion` entries with point-in-time snapshots protecting attempts against master question edits.
- **Dynamic Question & Option Randomization**: Deterministic per-candidate question and option shuffling stored persistently in attempt questions.
- **Continuous Autosave & Heartbeat Telemetry**: Debounced answer persistence with versioning, answered counters, question flagging (`FLAGGED_FOR_REVIEW`), and telemetry synchronization.
- **Double-Submission & Tamper Protection**: Atomic state transitions (`IN_PROGRESS` $\to$ `SUBMITTED`), objective grading calculation, result creation, and locks preventing post-submission modifications.
- **Modern Candidate Exam Interface**: Complete React component suite in `client/src/modules/candidateExam/` (`ExamInstructions`, `ExamPage`, `ExamSubmitted`, `ExamTimer`, `QuestionPanel`, `QuestionNavigation`, `AnswerInput`, `SubmitExamModal`).
- **Verification**: Verified via `step28_candidate_exam_engine.test.js`.

---

### Phase 22: Evaluation & Grading Engine (Step 29)
- **Automatic & Strategy-Based Evaluation**: Deterministic auto-grading for objective question types (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`) with negative marking penalties and partial credit calculations.
- **Subjective Review Queue & Hybrid Grading**: Flags manual questions (`ESSAY`, `CODING`, `VIDEO_RESPONSE`) as `NEEDS_MANUAL_REVIEW`, routing attempts to the examiner manual grading workflow.
- **Examiner Subjective Grading & Validation**: Allows examiners to award marks with upper-bound validation (`marksAwarded <= marksAvailable`) and qualitative feedback.
- **Evaluation Finalization & Official Results**: Locks completed evaluations, computes letter grades and pass/fail thresholds, and generates official `Result` credentials.
- **Result Visibility Governance**: Respects institutional visibility policies (`IMMEDIATE`, `AFTER_REVIEW`, `HIDDEN`) with candidate self-service isolation.
- **Verification**: Verified via `step29_evaluation_grading_engine.test.js`.

---

### Phase 23: Proctoring & Exam Security Engine (Step 30)
- **Multi-Modal Candidate Supervision**: Live telemetry capturing camera permissions, microphone stream audio, and screen sharing with browser event listening (`TAB_SWITCH`, `FULLSCREEN_EXIT`, `DEVTOOLS_DETECTED`, `COPY_ATTEMPT`).
- **Server-Authoritative Risk Engine**: Dynamic event weighting and AI confidence calibration with cumulative risk score tracking (0-100) and risk tiering (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Event Deduplication & Anti-Flooding**: Client event ID caching and 2000ms window throttling preventing malicious or glitchy frontend event floods.
- **Evidence Management & Secure Storage**: Immutable `ProctoringEvidence` metadata with checksum verification and restricted short-lived storage access.
- **Proctor Intervention & Governance Suite**: Real-time candidate warning notifications, live exam pause controls, event review annotation (`CONFIRMED_VIOLATION` / `FALSE_POSITIVE`), and attempt termination enforcement with mandatory audit logging.
- **Verification**: Verified via `step30_proctoring_exam_security.test.js`.

---

### Phase 24: Notifications & Central Communication Engine (Step 31)
- **Central Event-Driven Architecture**: Connects platform events (`assessment.assigned`, `result.published`, `proctor.warning`, `security.alert`) directly to `NotificationService` across `IN_APP`, `EMAIL`, and `REALTIME` channels.
- **Idempotency Protection**: Unique `idempotencyKey` hashing preventing duplicate email blasts or notification spam during background worker retries.
- **Granular User Preferences**: Channel-specific category subscriptions with non-bypassable mandatory rules for critical security and proctoring warnings.
- **Bulk Notification Dispatching**: Asynchronous batching for mass assessment assignments and institutional announcements without blocking HTTP request threads.
- **Candidate & Tenant Isolation**: Secure user-bound recipient indexing preventing cross-tenant and cross-user data leakage.
- **Interactive UI Notification Center**: Navbar bell with dynamic unread counter badge, instant dropdown preview, full-page notification feed with category tabs, mark-as-read/all, and live preference customization.
- **Verification**: Verified via `step31_notifications_communication.test.js`.

---

### Phase 25: Reports & Analytics Engine (Step 32)
- **Multi-Dimensional Assessment Analytics**: Database-side MongoDB aggregations computing real-time candidate completion rates, pass rates, score averages, high/low records, and median statistics without in-memory payload overhead.
- **Item Discrimination & Difficulty Indexes**: Per-question analytical telemetry measuring total attempts, correct/incorrect/skipped rates, discriminatory accuracy (%), and automated classification (`EASY`, `MEDIUM`, `HARD`).
- **Score Distribution Cohorts**: Aggregated bucket intervals (`90-100`, `80-89`, `70-79`, `60-69`, `<60`) for institutional grading distribution curve evaluations.
- **Proctoring Telemetry & Risk Summaries**: Cohort risk distributions (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), cumulative violation counts, confirmed cheating flags, warnings, and attempt terminations.
- **Platform-Level Aggregations**: Root-authorized overview metrics spanning global organizations, users, candidates, assessments, and platform pass rates.
- **Instant CSV & PDF Report Exports**: Immediate file streaming and asynchronous export generation with secure download endpoints and 7-day retention lifecycle management.
- **Interactive Reports UI Suite**: `ReportsDashboard.jsx`, `AssessmentAnalytics.jsx`, `CandidatePerformance.jsx`, `QuestionAnalytics.jsx`, `ProctoringAnalytics.jsx`, `StatCard.jsx`, `ScoreDistribution.jsx`, `PerformanceChart.jsx`, `QuestionAnalysisTable.jsx`, `ExportReportModal.jsx`.
- **Verification**: Verified via `step32_reports_analytics.test.js`.

---

### Phase 26: Audit Logs & Security Activity (Step 33)
- **Immutable & Append-Only Audit Architecture**: Tamper-resistant `AuditLog` schema with Mongoose pre-hook mutation blocks preventing unauthorized updates or deletions.
- **Automated Metadata Sanitization**: Sensitive keys (`password`, `token`, `secret`, `jwt`, `creditCard`) are automatically stripped/redacted before database persistence.
- **Enterprise Request Tracing**: Global `requestIdMiddleware` attaching unique `X-Request-Id` headers and correlation identifiers to every audit record.
- **Security Incident & Authorization Failure Auditing**: Automated detection and logging of `PERMISSION_DENIED`, `TENANT_ACCESS_DENIED`, and `TOKEN_REUSE_DETECTED` events within authorization and tenant boundary middleware.
- **Forensic Query & Search Engine**: Multi-dimensional search, date range filtering, resource/user lookup, and pagination (`page`, `limit`, `totalPages`, `total`).
- **Self-Auditing File Exports**: CSV streaming export endpoints that record an immutable audit log when reports or activity trails are extracted.
- **Interactive Security UI Suite**: `AuditLogs.jsx`, `AuditLogTable.jsx`, `AuditLogFilters.jsx`, `AuditLogDetails.jsx`, `SecurityEventBadge.jsx`, `useAuditLogs.js`.
- **Verification**: Verified via `step33_audit_logs.test.js`.

---

## 🧪 Integration Test Suite Execution Commands

Every functional phase can be verified by running its dedicated integration test script:

```bash
# Academic Hierarchy (Step 13)
node server/tests/integration/step13_hierarchy.test.js

# Question Bank & Multi-Type Questions (Step 14)
node server/tests/integration/step14_question_bank.test.js

# Assessment Lifecycle & Snapshots (Step 15)
node server/tests/integration/step15_assessment_lifecycle.test.js

# Candidate Profiles & Assignments (Step 16)
node server/tests/integration/step16_candidate_assignment.test.js

# Examination Runtime & Timers (Step 17)
node server/tests/integration/step17_assessment_attempts.test.js

# Answer Autosave & Submission (Step 18)
node server/tests/integration/step18_answer_management.test.js

# Evaluation & Automated Grading (Step 19)
node server/tests/integration/step19_evaluation_engine.test.js

# Proctoring & Exam Integrity Foundation (Step 20)
node server/tests/integration/step20_proctoring_foundation.test.js

# Reports & Analytics (Step 22)
node server/tests/integration/step22_reports_analytics.test.js

# Certificates & Credential Management (Step 23)
node server/tests/integration/step23_certificates_credentials.test.js

# Notifications & Communication Foundation (Step 24)
node server/tests/integration/step24_notifications_communication.test.js

# Live Video Interviews & WebRTC (Step 25)
node server/tests/integration/step25_live_interviews_webrtc.test.js

# Question Bank & Question Management (Step 26)
node server/tests/integration/step26_question_bank_engine.test.js

# Assessment Builder & Configuration (Step 27)
node server/tests/integration/step27_assessment_builder_config.test.js

# Candidate Attempt & Examination Engine (Step 28)
node server/tests/integration/step28_candidate_exam_engine.test.js

# Evaluation & Grading Engine (Step 29)
node server/tests/integration/step29_evaluation_grading_engine.test.js

# Proctoring & Exam Security Engine (Step 30)
node server/tests/integration/step30_proctoring_exam_security.test.js

# Central Notifications & Communication Engine (Step 31)
node server/tests/integration/step31_notifications_communication.test.js

# Reports & Analytics Engine (Step 32)
node server/tests/integration/step32_reports_analytics.test.js

# Audit, Compliance & Security Governance Engine (Step 55)
node server/tests/integration/step55_audit_security_governance.test.js

# Subscription, Plans & SaaS Entitlement Engine (Step 56)
node server/tests/integration/step56_subscription_entitlement_engine.test.js

# Billing & Payment Integration Layer (Step 57)
node server/tests/integration/step57_billing_payment_integration.test.js

# Production Infrastructure, Deployment & Observability (Step 58)
node server/tests/integration/step58_production_infrastructure.test.js

# Production Readiness & Final System Validation (Step 59)
node server/tests/integration/step59_final_system_validation.test.js

# Audit Logs & Security Activity (Step 33)
node server/tests/integration/step33_audit_logs.test.js

# Complete Question Bank Engine (Step 35)
node server/tests/integration/step35_question_bank_engine.test.js

# Assessment Builder & Assessment Lifecycle (Step 36)
node server/tests/integration/step36_assessment_builder_lifecycle.test.js

# Assessment Assignment & Candidate Scheduling (Step 37)
node server/tests/integration/step37_assessment_assignment_scheduling.test.js

# Exam Attempt Engine v2 (Step 38)
node server/tests/integration/step38_exam_attempt_engine.test.js

# Evaluation & Grading Engine (Step 39)
node server/tests/integration/step39_evaluation_grading_engine.test.js

# Results & Candidate Publication (Step 40)
node server/tests/integration/step40_results_publication.test.js

# Certificate & Credential Management (Step 41)
node server/tests/integration/step41_certificates_credentials.test.js

# Proctoring & Anti-Cheating Engine (Step 42)
node server/tests/integration/step42_proctoring_anti_cheating.test.js

# Interview & Live Video System (Step 43)
node server/tests/integration/step43_interviews_live_system.test.js

# Notifications & Communication System (Step 44)
node server/tests/integration/step44_notifications_communication.test.js

# Billing, Subscriptions & SaaS Entitlements (Step 45)
node server/tests/integration/step45_billing_subscriptions.test.js

# Organization Management & Tenant Administration (Step 46)
node server/tests/integration/step46_organization_management.test.js

# Candidate Management & Candidate Portal (Step 47)
node server/tests/integration/step47_candidate_management_portal.test.js
```

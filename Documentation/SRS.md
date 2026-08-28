# SecureAssess — Software Requirements Specification (SRS)

**Document Version:** 1.0.0  
**Product Name:** SecureAssess  
**Architecture Baseline:** SecureAssess Architecture Specification v2.0.0  
**Application Type:** Enterprise Multi-Tenant B2B Assessment & Examination SaaS  
**Standard Compliance:** IEEE 830 / ISO/IEC/IEEE 29148  
**Target Delivery:** Multi-Organization University & Corporate Examination Platform  

---

## Table of Contents

1. [Introduction](#1-introduction)
   - 1.1 Purpose
   - 1.2 Scope of Product
   - 1.3 Definitions, Acronyms, and Abbreviations
   - 1.4 References
   - 1.5 Document Overview
2. [Overall Description](#2-overall-description)
   - 2.1 Product Perspective & SaaS Topology
   - 2.2 Product Functions
   - 2.3 User Classes and Personas
   - 2.4 Operating Environment
   - 2.5 Design and Implementation Constraints
   - 2.6 Assumptions and Dependencies
3. [Specific Requirements — Functional Requirements (FR)](#3-specific-requirements--functional-requirements-fr)
   - 3.1 Module 1: Universal Identity, Authentication & Session Lifecycle (FR-AUTH)
   - 3.2 Module 2: Multi-Tenancy & Organization Management (FR-TENANT)
   - 3.3 Module 3: Scope-Aware RBAC & Dynamic Permissions (FR-RBAC)
   - 3.4 Module 4: Question Banks & Authoring Subsystem (FR-QBANK)
   - 3.5 Module 5: Assessment Construction & Configuration (FR-ASSESS)
   - 3.6 Module 6: Candidate & Batch Scheduling / Assignment (FR-ASSIGN)
   - 3.7 Module 7: Secure Candidate Examination Engine (FR-ENGINE)
   - 3.8 Module 8: Multi-Tier Proctoring & Security Event Detection (FR-PROCTOR)
   - 3.9 Module 9: Real-Time WebRTC Live Interview Subsystem (FR-RTC)
   - 3.10 Module 10: Automated & Manual Grading Subsystem (FR-GRADE)
   - 3.11 Module 11: Results, Analytics & Reporting Engine (FR-ANALYTICS)
   - 3.12 Module 12: Certificate Generation & Public Verification (FR-CERT)
   - 3.13 Module 13: Audit Logging & System Observability (FR-AUDIT)
   - 3.14 Module 14: Platform Administration & Subscription Management (FR-PLATFORM)
4. [External Interface Requirements](#4-external-interface-requirements)
   - 4.1 User Interfaces (3-Portal Architecture)
   - 4.2 Hardware Interfaces
   - 4.3 Software & API Interfaces
   - 4.4 Communications Interfaces (WebSockets, WebRTC, HTTPS)
5. [Non-Functional Requirements (NFR)](#5-non-functional-requirements-nfr)
   - 5.1 Performance Requirements
   - 5.2 Security & Cryptographic Requirements
   - 5.3 Reliability, Fault Tolerance & Auto-Save Recovery
   - 5.4 Availability & Disaster Recovery
   - 5.5 Maintainability & Scalability
   - 5.6 Usability & Accessibility (WCAG 2.1 AA)
6. [Data Model & Verification Matrix](#6-data-model--verification-matrix)
   - 6.1 Core Data Entity Dictionary
   - 6.2 Traceability & Verification Matrix

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) document details the complete functional and non-functional requirements for **SecureAssess**, an enterprise-grade multi-tenant assessment, examination, and interview SaaS platform. This document serves as the formal baseline for developers, QA engineers, architects, and stakeholders throughout all phases of implementation.

### 1.2 Scope of Product
SecureAssess provides an end-to-end digital testing infrastructure that allows multiple independent organizations (universities, corporations, recruiting firms, certification bodies) to author, schedule, deliver, proctor, grade, and analyze assessments within strictly isolated tenant boundaries.

```
                         SECUREASSESS PLATFORM
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
   UNIVERSITIES               COMPANIES             TRAINING INSTITUTES
  - Term Exams               - Technical Hiring       - Certifications
  - Quizzes & Midterms       - Coding Challenges      - Skill Assessments
  - Distance Learning        - Live Video Interviews  - Cohort Evaluations
```

### 1.3 Definitions, Acronyms, and Abbreviations
* **B2B SaaS:** Business-to-Business Software-as-a-Service.
* **Tenant / Organization:** An isolated organizational account with independent users, assessments, candidates, question banks, and audit logs.
* **Universal Identity:** A unified user record uncoupled from any single organization, allowing a single user account to participate in multiple organizations with distinct roles.
* **UserMembership:** The relational association linking a Universal User to an Organization with a designated Role.
* **RBAC:** Role-Based Access Control, scoped into `PLATFORM` and `ORGANIZATION` domains.
* **WebRTC:** Web Real-Time Communication for low-latency peer-to-peer audio, video, and data channels.
* **STUN/TURN:** Session Traversal Utilities for NAT / Traversal Using Relays around NAT for media relay.
* **State of Examination:** The atomic runtime state of a candidate's attempt (timer, current question, answers, security flags).

### 1.4 References
1. SecureAssess Architecture Specification v2.0.0
2. IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018 (Systems and software engineering — Life cycle processes — Requirements engineering)
3. RFC 7519 (JSON Web Token - JWT)
4. W3C WebRTC 1.0: Real-Time Communication Between Browsers
5. WCAG 2.1 AA Accessibility Guidelines

---

## 2. Overall Description

### 2.1 Product Perspective & SaaS Topology
SecureAssess is deployed as a cloud-native modular monolith featuring:
* **Client Layer:** Single-Page Application (SPA) built with React and Vite, delivering three dedicated portals: **Platform Portal**, **Organization Portal**, and **Candidate Portal**.
* **Server Layer:** Node.js / Express REST API structured in a vertical-slice modular architecture, integrated with a WebSocket/WebRTC signaling server.
* **Data Tier:** MongoDB database cluster with strict organization-partitioned schemas and indexes.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              SECUREASSESS                                  │
├──────────────────────────────┬─────────────────────────────────────────────┤
│ CLIENT (React + Vite)        │ Three Isolated Portals                      │
│                              │  ├── Platform Portal (/platform/*)          │
│                              │  ├── Organization Portal (/organization/*)  │
│                              │  └── Candidate Portal (/candidate/*)        │
├──────────────────────────────┼─────────────────────────────────────────────┤
│ API & COMMUNICATION          │ REST (JSON) + WebSockets (Signaling) + TURN │
├──────────────────────────────┼─────────────────────────────────────────────┤
│ SERVER (Node + Express)      │ Vertical-Slice Modular Engine               │
│                              │  ├── Auth & Tenant Boundary Guards          │
│                              │  ├── Scope-Aware RBAC Matrix                │
│                              │  └── 30+ Domain Business Services           │
├──────────────────────────────┼─────────────────────────────────────────────┤
│ DATABASE (MongoDB)           │ Partitioned Tenant Schemas & Audit Trails   │
└──────────────────────────────┴─────────────────────────────────────────────┘
```

### 2.2 Product Functions
* **Multi-Tenant Administration:** Creation, lifecycle control (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`), and subscription management of organizations.
* **Authoring & Question Banks:** Multi-format question authoring (MCQ, Multi-Select, True/False, Short Answer, Long Answer, Code Challenges) organized into categorizable question banks.
* **Assessment Configuration:** Creation of time-boxed, sectioned, randomized assessments with configurable security rules and proctoring parameters.
* **Candidate Delivery & Proctoring:** Full-screen locked examination window, client-side event monitoring (tab switch, window blur, fullscreen exit), audio/video anomaly detection, and periodic auto-save sync.
* **Live Video Interviews:** WebRTC-powered audio/video rooms with real-time code editor, candidate evaluation rubrics, and interviewer notes.
* **Grading & Certification:** Automated objective grading, manual evaluator grading for subjective questions, automated percentile calculation, and tamper-evident certificate issuance with public QR verification.

### 2.3 User Classes and Personas

| Role Scope | Role Name | Primary Responsibilities | Target Persona |
| :--- | :--- | :--- | :--- |
| **Platform** | `PLATFORM_OWNER` | Root platform configuration, tenant onboarding, global RBAC, system metrics, and billing. | Platform Super Administrator |
| **Platform** | `PLATFORM_ADMIN` | Operational tenant support, global audit reviews, and system health oversight. | Platform Support & Operations Lead |
| **Organization** | `ORGANIZATION_OWNER` | Full administrative control of a single tenant, user invites, department billing, and audit logs. | University Dean / VP of Talent Acquisition |
| **Organization** | `ORGANIZATION_ADMIN` | Day-to-day management of question banks, assessments, candidate batches, and staff assignments. | Assessment Coordinator / HR Lead |
| **Organization** | `EXAMINER` | Question bank authoring, assessment authoring, manual answer grading, and scorecard review. | University Professor / Technical Interviewer |
| **Organization** | `PROCTOR` | Real-time monitoring of live candidate examination streams, event log inspection, and fraud flagging. | Exam Invigilator / Integrity Monitor |
| **Organization** | `CANDIDATE` | Identity verification, reading exam instructions, answering questions under proctored conditions, and reviewing scorecards. | Student / Job Applicant / Examinee |

---

## 3. Specific Requirements — Functional Requirements (FR)

### 3.1 Module 1: Universal Identity, Authentication & Session Lifecycle (FR-AUTH)
* **FR-AUTH-001 [Universal Identity]:** The system shall create user accounts uncoupled from organizations. A user record contains email, password hash, avatar, platform role, and verification status.
* **FR-AUTH-002 [Dual Token Issuance]:** Upon successful login, the system shall issue a short-lived JWT Access Token (15-minute validity) and a cryptographically random Refresh Token (7-day validity).
* **FR-AUTH-003 [Refresh Token Rotation]:** When a refresh token is exchanged, the previous token must be invalidated immediately and a new token family member issued. Detection of a reused revoked refresh token must revoke the entire session tree.
* **FR-AUTH-004 [Session Tracking]:** The system shall record active sessions containing IP address, user-agent, device metadata, creation timestamp, and revocation state in `Session`.
* **FR-AUTH-005 [Password Security]:** Passwords must be hashed using bcrypt (cost factor $\ge 10$) with salt. Password reset workflows must issue one-time cryptographically secure reset tokens with 1-hour expiration.

### 3.2 Module 2: Multi-Tenancy & Organization Management (FR-TENANT)
* **FR-TENANT-001 [Tenant Context Resolution]:** Every organization-scoped API request must transmit the target tenant identifier via the `x-organization-id` header or URL parameter.
* **FR-TENANT-002 [Membership Verification]:** The backend `tenant.middleware.js` shall verify that `req.user` holds an `ACTIVE` `UserMembership` within the specified organization before dispatching the request to controllers.
* **FR-TENANT-003 [Tenant Data Partitioning]:** Every database query and mutation targeting an organization-owned entity must filter on `{ organizationId: req.organizationId }`.
* **FR-TENANT-004 [Payload Anti-Spoofing]:** The middleware shall sanitize and overwrite any client-supplied `req.body.organizationId` with the verified tenant context.
* **FR-TENANT-005 [Tenant Lifecycle Enforcement]:** If an organization's status is `DEACTIVATED` or `SUSPENDED`, all incoming non-platform requests shall be terminated with HTTP 403 Forbidden.

### 3.3 Module 3: Scope-Aware RBAC & Dynamic Permissions (FR-RBAC)
* **FR-RBAC-001 [Dual Scope Hierarchy]:** Roles must belong to either `ROLE_SCOPES.PLATFORM` or `ROLE_SCOPES.ORGANIZATION`. Platform roles must not be assigned within tenant memberships.
* **FR-RBAC-002 [Granular Permission Enforcement]:** Controllers shall not rely on raw role strings for authorization; access must be evaluated against explicit permission keys (e.g., `assessment.create`, `candidate.view`, `result.publish`).
* **FR-RBAC-003 [Platform Owner Bypass]:** The `PLATFORM_OWNER` shall have root authority over all platform administration endpoints, but must be explicitly bound to tenant context when interacting with tenant-specific resources.

### 3.4 Module 4: Question Banks & Authoring Subsystem (FR-QBANK)
* **FR-QBANK-001 [Question Bank Repositories]:** Organizations shall create compartmentalized question banks categorized by subject, difficulty, and program tags.
* **FR-QBANK-002 [Supported Question Types]:** The authoring engine must support:
  1. `MCQ` (Single correct option with negative marking support)
  2. `MULTIPLE_SELECT` (Multiple correct options with partial credit)
  3. `TRUE_FALSE` (Binary evaluation)
  4. `SHORT_ANSWER` (Exact string match / regex match)
  5. `LONG_ANSWER` (Rich-text subjective submission)
  6. `CODE` (Programming challenge with hidden test cases)
* **FR-QBANK-003 [Media Attachments]:** Questions and options must support image and code snippet attachments.

### 3.5 Module 5: Assessment Construction & Configuration (FR-ASSESS)
* **FR-ASSESS-001 [Assessment Metadata]:** An assessment entity shall define title, description, time limit (duration in minutes), total marks, passing percentage, and attempt limit.
* **FR-ASSESS-002 [Section & Question Ordering]:** Assessments must support sectioned questions with independent time limits or a global assessment timer.
* **FR-ASSESS-003 [Randomization Engine]:** The system shall support pseudo-randomized question ordering and option shuffling per candidate attempt based on a deterministic seed.
* **FR-ASSESS-004 [Lifecycle States]:** Assessments shall transition across `DRAFT` $\rightarrow$ `REVIEW` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ACTIVE` $\rightarrow$ `CLOSED` $\rightarrow$ `ARCHIVED`.

### 3.6 Module 6: Candidate & Batch Scheduling / Assignment (FR-ASSIGN)
* **FR-ASSIGN-001 [Batch Management]:** Candidates can be organized into batches (e.g., "Computer Science Cohort 2026", "Engineering Hiring Batch Q3").
* **FR-ASSIGN-002 [Assessment Assignment]:** Assessments can be assigned to individual candidates or entire batches with custom start/end accessibility windows.
* **FR-ASSIGN-003 [Automated Invitations]:** Upon assignment, the notification service shall dispatch email invitations containing secure examination access links.

### 3.7 Module 7: Secure Candidate Examination Engine (FR-ENGINE)
* **FR-ENGINE-001 [Atomic Attempt Initialization]:** When a candidate starts an assessment, the system generates an `AssessmentAttempt` with an initialized countdown timer.
* **FR-ENGINE-002 [Anti-Tamper Server-Side Timer]:** The time remaining must be calculated server-side based on `startedAt + duration` to prevent client clock tampering.
* **FR-ENGINE-003 [Periodic Auto-Save]:** The candidate UI must auto-save modified answers every 15 seconds or upon question navigation to `Answer` records.
* **FR-ENGINE-004 [Network Interruption Recovery]:** If a candidate experiences network loss, the exam state must resume seamlessly upon reconnection within the allotted duration.
* **FR-ENGINE-005 [Auto-Submission on Expiry]:** Upon timer expiration, the client and server must automatically finalize and lock the attempt into `SUBMITTED` status.

### 3.8 Module 8: Multi-Tier Proctoring & Security Event Detection (FR-PROCTOR)
* **FR-PROCTOR-001 [Browser Boundary Events]:** The examination client shall continuously listen for and record:
  * `TAB_SWITCH` (Visibility change API)
  * `WINDOW_BLUR` (Loss of browser focus)
  * `FULLSCREEN_EXIT` (Exit from mandated fullscreen mode)
  * `DEVTOOLS_OPEN` / `KEYBOARD_SHORTCUT_RESTRICTED` (Copy/paste prevention)
* **FR-PROCTOR-002 [Media Feed Ingestion]:** When video proctoring is enabled, the client must stream candidate webcam and microphone audio feeds.
* **FR-PROCTOR-003 [Anomaly Event Telemetry]:** Security violations must be transmitted in real time over WebSockets and logged into `ProctoringEvent` records with millisecond timestamps.
* **FR-PROCTOR-004 [Invigilator Live Feed]:** Proctors and examiners shall view an active grid of all live examinees with real-time risk scores and event logs.

### 3.9 Module 9: Real-Time WebRTC Live Interview Subsystem (FR-RTC)
* **FR-RTC-001 [Signaling Architecture]:** The backend WebSocket gateway shall broker SDP Offer/Answer exchanges and ICE candidate trickle between candidate and interviewer peers.
* **FR-RTC-002 [Collaborative Workspace]:** The interview room must integrate synchronized real-time code editor, live chat, and whiteboard capabilities.
* **FR-RTC-003 [In-Session Evaluation]:** Interviewers must be able to record structured candidate evaluation rubrics and private interview notes during the call.

### 3.10 Module 10: Automated & Manual Grading Subsystem (FR-GRADE)
* **FR-GRADE-001 [Automated Objective Grading]:** Objective questions (MCQ, True/False, Multiple-Select, Coding test cases) must be graded immediately upon submission.
* **FR-GRADE-002 [Manual Subjective Grading]:** Long-form text answers and open responses must be queued into an evaluator grading workflow with rubric scoring and feedback notes.
* **FR-GRADE-003 [Final Score Aggregation]:** Once all questions are evaluated, the system computes total marks, percentage, percentile rank, and pass/fail determination.

### 3.11 Module 11: Results, Analytics & Reporting Engine (FR-ANALYTICS)
* **FR-ANALYTICS-001 [Candidate Result Cards]:** Candidates view scorecards, question breakdowns (if enabled by assessment policy), and percentile rankings.
* **FR-ANALYTICS-002 [Organization Cohort Analytics]:** Administrators view batch distributions, difficulty discrimination indices per question, and average completion durations.
* **FR-ANALYTICS-003 [Platform-Wide Metrics]:** Platform owners view total tenant usage, active concurrent exam attempts, and system storage load.

### 3.12 Module 12: Certificate Generation & Public Verification (FR-CERT)
* **FR-CERT-001 [Dynamic Certificate PDF]:** Upon passing an assessment, the system generates a cryptographically signed PDF certificate embedding candidate name, score, date, and unique certificate ID.
* **FR-CERT-002 [Public QR Verification]:** Each certificate must feature a public verification URL and QR code resolving to an unauthenticated verification endpoint.

### 3.13 Module 13: Audit Logging & System Observability (FR-AUDIT)
* **FR-AUDIT-001 [Immutable Audit Logs]:** All sensitive administrative and assessment events (tenant edits, role changes, question modifications, exam submissions) must be written to `AuditLog`.
* **FR-AUDIT-002 [Audit Metadata]:** Audit logs must record `actorId`, `organizationId`, `action`, `resourceType`, `resourceId`, `ipAddress`, `userAgent`, and `diffSnapshot`.

### 3.14 Module 14: Platform Administration & Subscription Management (FR-PLATFORM)
* **FR-PLATFORM-001 [Tenant Provisioning]:** Platform owners can create, modify, suspend, or decommission tenant organizations.
* **FR-PLATFORM-002 [Subscription Plan Tiers]:** The system shall enforce plan limits (`TRIAL`, `BASIC`, `PRO`, `ENTERPRISE`) covering max monthly candidates, storage quotas, and proctoring hours.

---

## 4. External Interface Requirements

### 4.1 User Interfaces (3-Portal Architecture)
1. **Platform Portal (`/platform/*`):** High-density dark/light executive console for system metrics, organization management, global RBAC, and subscription oversight.
2. **Organization Portal (`/organization/*`):** Comprehensive administrative suite for assessment authoring, candidate rosters, grading queues, and analytics.
3. **Candidate Portal (`/candidate/*`):** Focused, distraction-free examination UI with high-contrast timers, question palette, and video status badge.

### 4.2 Software & API Interfaces
* **REST API Endpoint Convention:** `/api/v1/:module`
* **Payload Format:** JSON (`application/json`)
* **Standard Response Envelope:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {},
  "message": "Operation successful"
}
```

### 4.3 Communications Interfaces
* **HTTPS/TLS 1.3:** Mandatory for all client-server REST communication.
* **WSS (WebSocket Secure):** Used for real-time exam telemetry, proctoring events, and WebRTC signaling.
* **STUN/TURN Servers:** RFC 5389 / RFC 5766 compliant relays for NAT traversal during live interviews.

---

## 5. Non-Functional Requirements (NFR)

### 5.1 Performance Requirements
* **NFR-PERF-001 [API Latency]:** 95% of non-media API requests must respond within $< 200\text{ ms}$ under standard operational load.
* **NFR-PERF-002 [Concurrent Examinees]:** A single cluster instance must support at least 1,000 concurrent active examination sessions with continuous auto-save.
* **NFR-PERF-003 [Auto-Save Throughput]:** Auto-save answer batch operations must execute in $< 100\text{ ms}$ database write latency.

### 5.2 Security & Cryptographic Requirements
* **NFR-SEC-001 [Tenant Boundary Integrity]:** 100% of organization-scoped queries must enforce tenant isolation at the database layer.
* **NFR-SEC-002 [Cryptographic Standards]:** AES-256 for data at rest; TLS 1.3 for data in transit; bcrypt ($cost \ge 10$) for passwords.
* **NFR-SEC-003 [Token Integrity]:** JWT access tokens signed with HMAC-SHA256 or RSA-256 with strict expiration checks.

### 5.3 Reliability, Fault Tolerance & Auto-Save Recovery
* **NFR-REL-001 [Zero Data Loss on Exam Interruption]:** Candidate answers must be persisted in durable storage such that a sudden power or browser loss loses no more than 15 seconds of progress.
* **NFR-REL-002 [Graceful Degradation]:** If video proctoring fails due to candidate bandwidth constraints, text-based examination and client-side event tracking must continue uninterrupted.

### 5.4 Availability & Disaster Recovery
* **NFR-AVAIL-001 [System Uptime]:** Target availability of 99.9% uptime excluding scheduled maintenance windows.
* **NFR-AVAIL-002 [Database Backup]:** Automated daily snapshot backups with point-in-time recovery capabilities.

### 5.5 Usability & Accessibility
* **NFR-ACC-001 [Accessibility Compliance]:** All candidate-facing interfaces must comply with WCAG 2.1 Level AA standards.
* **NFR-USE-002 [Responsive Design]:** Administrative portals must support desktop displays ($1280 \times 720$ minimum); candidate exam engine must support desktop and tablet devices.

---

## 6. Data Model & Verification Matrix

### 6.1 Core Data Entity Dictionary

```
┌──────────────────┐       1:N       ┌────────────────────────┐
│       User       ├────────────────►│     UserMembership     │
└────────┬─────────┘                 └───────────┬────────────┘
         │ 1:N                                   │ N:1
         ▼                                       ▼
┌──────────────────┐                 ┌────────────────────────┐
│     Session      │                 │      Organization      │
└──────────────────┘                 └───────────┬────────────┘
                                                 │ 1:N
                  ┌──────────────────────────────┼──────────────────────────────┐
                  ▼                              ▼                              ▼
      ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
      │      QuestionBank      │    │       Assessment       │    │       Candidate        │
      └───────────┬────────────┘    └────────────┬───────────┘    └───────────┬────────────┘
                  │ 1:N                          │ 1:N                        │ 1:N
                  ▼                              ▼                            ▼
      ┌────────────────────────┐    ┌────────────────────────┐    ┌────────────────────────┐
      │        Question        │    │  AssessmentAssignment  │◄───┤         Batch          │
      └────────────────────────┘    └────────────┬───────────┘    └────────────────────────┘
                                                 │ 1:N
                                                 ▼
                                    ┌────────────────────────┐
                                    │    AssessmentAttempt   │
                                    └────────────┬───────────┘
                                                 │ 1:N
                                                 ▼
                                    ┌────────────────────────┐
                                    │         Answer         │
                                    └────────────┬───────────┘
                                                 │ 1:1
                                                 ▼
                                    ┌────────────────────────┐
                                    │         Result         │
                                    └────────────┬───────────┘
                                                 │ 1:1
                                                 ▼
                                    ┌────────────────────────┐
                                    │      Certificate       │
                                    └────────────────────────┘
```

### 6.2 Traceability & Verification Matrix

| Requirement ID | Module | Verification Method | Acceptance Criteria |
| :--- | :--- | :--- | :--- |
| **FR-AUTH-001** | Auth / Identity | Unit & Integration Test | User created without hardcoded tenant ID; platform role assigned correctly. |
| **FR-AUTH-003** | Auth / Sessions | Security Automated Test | Reused refresh token triggers entire token family revocation and session invalidation. |
| **FR-TENANT-001** | Multi-Tenancy | API Integration Test | Request without `x-organization-id` or membership returns HTTP 400/403. |
| **FR-TENANT-003** | Multi-Tenancy | Isolation Pen Test | User from Org A attempting to read Org B assessment receives HTTP 403 Forbidden. |
| **FR-RBAC-002** | RBAC | Role Guard Test | Examiner attempting to delete organization receives HTTP 403 Forbidden. |
| **FR-ENGINE-002** | Exam Engine | Integration Clock Test | Advancing client device clock does not extend remaining attempt time. |
| **FR-ENGINE-003** | Exam Engine | E2E Browser Test | Answers auto-save to MongoDB every 15s; refreshing browser restores exact answer state. |
| **FR-PROCTOR-001**| Proctoring | E2E Event Test | Switching browser tabs creates structured `ProctoringEvent` record within 1 second. |
| **FR-CERT-002** | Certificates | Public Web Test | Scanning QR code verifies candidate name, assessment title, and pass status. |

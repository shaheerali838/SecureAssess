# SecureAssess — System Architecture Plan

**Document Version:** 1.0.0  
**Architecture Baseline:** SecureAssess Architecture Specification v2.0.0  
**Application Classification:** Enterprise Multi-Tenant B2B SaaS  
**Primary Technology Stack:** MERN (MongoDB, Express, React, Node.js) + WebSockets + WebRTC  

---

## Table of Contents

1. [High-Level System Topology](#1-high-level-system-topology)
2. [Universal Identity & Multi-Tenancy Architecture](#2-universal-identity--multi-tenancy-architecture)
   - 2.1 Decoupled Identity Model
   - 2.2 Tenant Partitioning & Boundary Resolution
   - 2.3 Defense-in-Depth Query Isolation Strategy
3. [Scope-Aware RBAC & Authorization Pipeline](#3-scope-aware-rbac--authorization-pipeline)
   - 3.1 Dual-Scope Role Hierarchy
   - 3.2 Granular Permission Matrix & Resolution
   - 3.3 End-to-End Request & Security Middleware Flow
4. [Backend Vertical-Slice Modular Architecture (`server/`)](#4-backend-vertical-slice-modular-architecture-server)
   - 4.1 Structural Pattern & Module Anatomy
   - 4.2 Controller-Service-Repository Separation of Concerns
   - 4.3 Database Schemas & Entity Relationship Overview
5. [Three-Portal Frontend Architecture (`client/`)](#5-three-portal-frontend-architecture-client)
   - 5.1 Portal Specialization & Component Hierarchy
   - 5.2 Declarative Route Protection & Guard Hierarchy
   - 5.3 Unified Client-Server API Bridge & Interceptor Pipeline
   - 5.4 State Management Strategy
6. [Real-Time WebRTC & Multi-Tier Proctoring Subsystem](#6-real-time-webrtc--multi-tier-proctoring-subsystem)
   - 6.1 WebSocket Signaling Gateway
   - 6.2 Peer-to-Peer Media Negotiation & TURN Relay
   - 6.3 Proctoring Telemetry Ingestion & Anomaly Detection
7. [High-Stakes Candidate Examination Engine](#7-high-stakes-candidate-examination-engine)
   - 7.1 Server-Synchronized Anti-Tamper Timer
   - 7.2 Periodic Auto-Save & Offline Recovery Protocol
   - 7.3 State Machine for Attempt Transitions
8. [Security, Cryptography & Audit Observability](#8-security-cryptography--audit-observability)
9. [Production Deployment & Infrastructure Strategy](#9-production-deployment--infrastructure-strategy)

---

## 1. High-Level System Topology

SecureAssess is designed as a cloud-native modular monolith featuring dedicated real-time signaling gateways and an isolated single-page application frontend.

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SECUREASSESS PLATFORM                                       │
└─────────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                                  │
                  ┌───────────────────────────────┴───────────────────────────────┐
                  ▼                                                               ▼
  ┌───────────────────────────────┐                               ┌───────────────────────────────┐
  │      CLIENT APPLICATION       │                               │       BACKEND CLUSTER         │
  │        (React + Vite)         │                               │       (Node + Express)        │
  ├───────────────────────────────┤                               ├───────────────────────────────┤
  │  1. Platform Portal           │                               │  1. REST API Engine (/api/v1) │
  │  2. Organization Portal       │◄───────────HTTPS─────────────►│  2. Tenant & RBAC Guards      │
  │  3. Candidate Exam Interface  │                               │  3. Vertical-Slice Services   │
  └───────────────┬───────────────┘                               └───────────────┬───────────────┘
                  │                                                               │
                  │                           WSS / WebRTC                        │
                  ├───────────────────────────────────────────────────────────────┤
                  │ (Signaling, Live Video Streams, Real-Time Exam Telemetry)     │
                  │                                                               │
                  ▼                                                               ▼
  ┌───────────────────────────────┐                               ┌───────────────────────────────┐
  │     COTURN TURN/STUN RELAY    │                               │     MONGODB CLUSTER (MERN)    │
  │  (Media NAT Traversal & Relay)│                               │  - Partitioned Tenant Data    │
  │                               │                               │  - Immutable Audit Trails     │
  └───────────────────────────────┘                               └───────────────────────────────┘
```

---

## 2. Universal Identity & Multi-Tenancy Architecture

### 2.1 Decoupled Identity Model
SecureAssess avoids the anti-pattern of hardcoding a tenant identifier into the core `User` model. A `User` is a **universal global identity**. A user's participation in an organization is established via an explicit `UserMembership` entity.

```
                          UNIVERSAL USER
                     (email, password, avatar)
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
          Platform Scope               Organization Scope
                 │                             │
          platformRole                   UserMembership
                 │                             │
       ┌─────────┴─────────┐         ┌─────────┴─────────┐
       │                   │         │                   │
 PLATFORM_OWNER      PLATFORM_ADMIN  University A    Corporate Corp
                                     (Role: ADMIN)   (Role: EXAMINER)
```

### 2.2 Tenant Partitioning & Boundary Resolution
Every organization-scoped request is resolved deterministically by [`tenant.middleware.js`](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/middleware/tenant.middleware.js):
1. **Header / Parameter Extraction:** Reads `x-organization-id` header or `:organizationId` route param.
2. **Organization Validation:** Checks existence and confirms lifecycle status (`ACTIVE`). Suspended/deactivated tenants are immediately blocked.
3. **Membership Verification:** Verifies an active `UserMembership` record linking `req.user.id` to `req.organizationId`.
4. **Context Injection:** Attaches `req.organization`, `req.organizationId`, `req.membership`, and `req.organizationRole` to the request pipeline.
5. **Anti-Spoofing:** Overwrites any client-supplied `req.body.organizationId` with the verified tenant ID.

```
Incoming Request (Bearer JWT + x-organization-id: Org123)
   │
   ▼
requireAuth() ──► Resolves req.user
   │
   ▼
requireTenantContext()
   │
   ├── Is Platform Owner / Admin? ──► YES ──► (Platform Access Granted)
   │
   └── Regular User:
         ├── Query UserMembership({ userId: req.user.id, organizationId: Org123, status: 'ACTIVE' })
         ├── Found? ──► NO ──► HTTP 403 Forbidden
         └── YES ──► Injects req.organization & req.organizationRole ──► Continue
```

### 2.3 Defense-in-Depth Query Isolation Strategy
To eliminate the risk of cross-tenant data leakage, every repository and service query targeting an organization-owned resource must strictly enforce:

$$\text{Query Filter} = \{\, \_id: \text{resourceId},\, \text{organizationId}: \text{req.organizationId} \,\}$$

---

## 3. Scope-Aware RBAC & Authorization Pipeline

### 3.1 Dual-Scope Role Hierarchy

```
                                    SYSTEM ROLES
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
             PLATFORM SCOPE                            ORGANIZATION SCOPE
                   │                                           │
         ┌─────────┴─────────┐                       ┌─────────┼─────────┐
         ▼                   ▼                       ▼         ▼         ▼
  PLATFORM_OWNER      PLATFORM_ADMIN             ORG_OWNER  ORG_ADMIN  EXAMINER
  (Root System Ops)   (Support Staff)                          │
                                                     ┌─────────┴─────────┐
                                                     ▼                   ▼
                                                  PROCTOR            CANDIDATE
```

### 3.2 Granular Permission Matrix & Resolution
Controllers never authorize actions based on hardcoded role strings; they evaluate against atomic permission keys:

```js
// Example: Controller authorization check
router.post(
  "/:organizationId/assessments",
  requireAuth,
  requireTenantContext,
  requireOrganizationOrPlatformPermission(
    PLATFORM_PERMISSIONS.MANAGE_ORGANIZATIONS,
    ORGANIZATION_PERMISSIONS.MANAGE_ASSESSMENTS
  ),
  validate(createAssessmentSchema),
  assessmentController.createAssessment
);
```

### 3.3 End-to-End Request & Security Middleware Flow

```
   HTTP CLIENT REQUEST
           │
           ▼
   [ Express Router ] ──► /api/v1/organizations/:orgId/assessments
           │
           ▼
   [ requireAuth ] ────► Validates JWT Access Token & Account Status
           │
           ▼
   [ requireTenantContext ] ──► Validates Tenant Header & UserMembership
           │
           ▼
   [ requirePermission ] ───► Evaluates Role Permissions against Action
           │
           ▼
   [ validateMiddleware ] ──► Validates Request Body / Query (Joi/Zod)
           │
           ▼
   [ Controller ] ──────────► Unpacks Request & Invokes Service Layer
           │
           ▼
   [ Service Layer ] ───────► Executes Business Logic & State Rules
           │
           ▼
   [ Model / MongoDB ] ─────► Executes Tenant-Scoped DB Query
           │
           ▼
   [ ApiResponse ] ─────────► Returns Standard JSON Response Envelope
```

---

## 4. Backend Vertical-Slice Modular Architecture (`server/`)

### 4.1 Structural Pattern & Module Anatomy
The backend is structured into vertical-slice feature modules inside [`server/src/modules/`](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/modules/). Each module completely encapsulates its own domain:

```
server/src/modules/assessments/
├── assessment.model.js        # Mongoose Schema & Indexes
├── assessment.controller.js   # HTTP Request/Response Handler
├── assessment.service.js      # Core Business Logic & State Machine
├── assessment.validator.js    # Payload Validation Schemas
├── assessment.routes.js       # Route Definitions & Middleware Bindings
├── assessment.constants.js    # Domain Constants (Status, Types)
└── index.js                   # Public Module Export
```

### 4.2 Controller-Service-Repository Separation of Concerns
* **Controller:** Strictly responsible for parsing HTTP inputs, invoking service methods, and formatting the output via `ApiResponse`. Contains zero business logic.
* **Service:** Encapsulates domain validation, state transitions, transactions, multi-model interactions, and audit logging.
* **Model:** Defines schema validation, defaults, Mongoose middlewares, and compound tenant indexes (e.g., `{ organizationId: 1, slug: 1 }`).

### 4.3 Database Entity Relationship Overview

```
                                  ┌────────────────────┐
                                  │        User        │
                                  └─────────┬──────────┘
                                            │ 1:N
                                            ▼
┌────────────────────┐   1:N      ┌────────────────────┐
│    Organization    ├───────────►│   UserMembership   │
└─────────┬──────────┘            └─────────┬──────────┘
          │ 1:N                             │ N:1
          │                                 ▼
          │                       ┌────────────────────┐
          │                       │        Role        │
          │                       └─────────┬──────────┘
          │                                 │ N:M
          │                                 ▼
          │                       ┌────────────────────┐
          │                       │     Permission     │
          │                       └────────────────────┘
          ├────────────────────────────────┬────────────────────────────────┐
          ▼                                ▼                                ▼
┌────────────────────┐           ┌────────────────────┐           ┌────────────────────┐
│    QuestionBank    │           │     Assessment     │           │     Candidate      │
└─────────┬──────────┘           └──────────┬─────────┘           └─────────┬──────────┘
          │ 1:N                             │ 1:N                           │ 1:N
          ▼                                 ▼                               ▼
┌────────────────────┐           ┌────────────────────┐           ┌────────────────────┐
│      Question      │           │AssessmentAssignment│◄──────────┤       Batch        │
└────────────────────┘           └──────────┬─────────┘           └────────────────────┘
                                            │ 1:N
                                            ▼
                                 ┌────────────────────┐
                                 │ AssessmentAttempt  │
                                 └──────────┬─────────┘
                                            │ 1:N
                                            ▼
                                 ┌────────────────────┐
                                 │       Answer       │
                                 └──────────┬─────────┘
                                            │ 1:1
                                            ▼
                                 ┌────────────────────┐
                                 │       Result       │
                                 └──────────┬─────────┘
                                            │ 1:1
                                            ▼
                                 ┌────────────────────┐
                                 │    Certificate     │
                                 └────────────────────┘
```

---

## 5. Three-Portal Frontend Architecture (`client/`)

### 5.1 Portal Specialization & Component Hierarchy
The frontend single-page application is strictly partitioned into three specialized user portals:

```
client/src/pages/
├── auth/                 # Public Authentication (Login, Reset Password)
├── platform/             # Super Admin Platform Management (/platform/*)
│   ├── dashboard/        # Global Metrics & Tenant Health
│   ├── organizations/    # Tenant Provisioning & Subscription Oversight
│   ├── users/            # Global User Directory
│   ├── roles/            # RBAC Definition & Permissions Explorer
│   └── auditLogs/        # System-Wide Audit Log Stream
├── organization/         # Tenant Administration (/organization/*)
│   ├── dashboard/        # Tenant Operations & Assessment KPIs
│   ├── candidates/       # Candidate Rosters & Batch Management
│   ├── questionBanks/    # Question Authoring & Repositories
│   ├── assessments/      # Assessment Builder & Scheduling
│   ├── grading/          # Objective/Subjective Grading Queues
│   ├── results/          # Analytics, Gradebooks & Reports
│   └── proctoring/       # Live Examination Invigilation Grid
└── candidate/            # Candidate Experience (/candidate/*)
    ├── dashboard/        # Assigned Assessments
    ├── instructions/     # Pre-Exam Environment & Hardware Verification
    ├── attempt/          # Locked High-Stakes Exam Interface
    ├── results/          # Scorecards & Topic Breakdowns
    └── certificates/     # Verifiable PDF Credentials
```

### 5.2 Declarative Route Protection & Guard Hierarchy

```
                            <AppRoutes />
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
            <PublicRoute>                  <ProtectedRoute>
                  │                               │
            [ Login Page ]                        ▼
                                          <RoleRoute / Scope>
                                                  │
                 ┌────────────────────────────────┼────────────────────────────────┐
                 ▼                                ▼                                ▼
         <PlatformRoute>                 <OrganizationRoute>               <CandidateRoute>
                 │                                │                                │
         /platform/*                      /organization/*                  /candidate/*
```

### 5.3 Unified Client-Server API Bridge & Interceptor Pipeline
[`client/src/services/api.js`](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/client/src/services/api.js) centralizes all REST interactions:

```
React Component / Service Call
              │
              ▼
   [ Axios Request Interceptor ]
   ├── Injects 'Authorization: Bearer <accessToken>'
   └── Injects 'x-organization-id: <currentOrgId>'
              │
              ▼
   [ HTTP / HTTPS REST Call ]
              │
              ▼
   [ Axios Response Interceptor ]
   ├── Success (2xx) ──► Returns response.data
   └── Error (401)   ──► Triggers Refresh Token Rotation (/api/v1/auth/refresh)
                         ├── Success ──► Replays original failed request
                         └── Failure ──► Clears auth state & redirects to /login
```

---

## 6. Real-Time WebRTC & Multi-Tier Proctoring Subsystem

```
┌────────────────────────────────┐                 ┌────────────────────────────────┐
│       Candidate Browser        │                 │        Proctor Browser         │
├────────────────────────────────┤                 ├────────────────────────────────┤
│  - Webcam & Mic Capture        │                 │  - Live Video Stream Grid      │
│  - Fullscreen/Tab Listeners    │                 │  - Instant Anomaly Alerts      │
│  - WebRTC PeerConnection       │                 │  - Risk Score Calculation      │
└───────────────┬────────────────┘                 └────────────────┬───────────────┘
                │                                                   │
                │ WebRTC Media (RTP/SRTP via Coturn)                │
                ├───────────────────────────────────────────────────┤
                │                                                   │
                ▼                                                   ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS / SOCKET.IO SIGNALING GATEWAY                          │
│  - SDP Offer/Answer Exchange                                                      │
│  - ICE Candidate Brokerage                                                        │
│  - Real-Time Proctoring Telemetry (TAB_SWITCH, FULLSCREEN_EXIT, BLUR)              │
└─────────────────────────────────────────┬─────────────────────────────────────────┘
                                          │
                                          ▼
                               ┌─────────────────────┐
                               │   ProctoringEvent   │
                               │  (MongoDB Storage)  │
                               └─────────────────────┘
```

---

## 7. High-Stakes Candidate Examination Engine

### 7.1 Server-Synchronized Anti-Tamper Timer
To prevent client device clock manipulation, time remaining is derived server-side:

$$\text{Remaining Seconds} = \text{Duration} - \left( \text{Current Server Time} - \text{Attempt Started At} \right)$$

### 7.2 Periodic Auto-Save & Offline Recovery Protocol
1. Candidate modifies an answer $\rightarrow$ Local React/Zustand state updates immediately.
2. An asynchronous debounced sync job transmits the answer delta to `/api/v1/attempts/:id/save` every 15 seconds.
3. In case of network interruption, answers are cached in browser `IndexedDB` / `localStorage`.
4. Upon network restoration, the client flushes all pending answer deltas with sequence timestamps.

### 7.3 State Machine for Attempt Transitions

```
[ NOT_STARTED ]
       │  (Candidate clicks "Start Assessment")
       ▼
[ IN_PROGRESS ] ◄──► [ PAUSED / RECONNECTING ] (Network Loss)
       │
       ├──► (Candidate clicks "Submit Exam") ───────┐
       │                                            ▼
       └──► (Server Timer Reaches 00:00) ────► [ SUBMITTED ]
                                                    │
                                                    ▼
                                             [ EVALUATION ]
                                                    │
                                                    ▼
                                              [ COMPLETED ]
```

---

## 8. Security, Cryptography & Audit Observability

* **Password Security:** Salted bcrypt hashing ($cost \ge 10$).
* **Token Architecture:** Short-lived JWT access tokens (15m) + rotated refresh tokens (7d) backed by database `Session` records.
* **Rate Limiting:** IP and user-based sliding window rate limiters protecting authentication endpoints.
* **Immutable Audit Trail:** All system mutations generate detailed `AuditLog` records containing actor ID, IP address, user-agent, target entity, and before/after delta snapshots.

---

## 9. Production Deployment & Infrastructure Strategy

```
                                  PUBLIC INTERNET
                                         │
                                         ▼
                             [ Cloudflare / AWS WAF ]
                                         │
                                         ▼
                            [ NGINX Reverse Proxy / ALB ]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [ Static Frontend CDN ]                        [ Node.js API Cluster (PM2) ]
        (React SPA Bundle)                                       │
                                         ┌───────────────────────┼───────────────────────┐
                                         ▼                       ▼                       ▼
                                [ MongoDB Replica Set ]     [ Redis Cache ]     [ Coturn TURN Relay ]
```

---

## 10. Summary & Canonical Baseline
This document represents the definitive **System Architecture Plan** for SecureAssess. All subsequent feature development, API contracts, and database migrations must strictly adhere to the patterns and boundary rules formalized herein.

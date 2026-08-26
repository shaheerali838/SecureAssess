# SecureAssess — Comprehensive System Architecture & Review Document

> **Document Version:** 1.0.0  
> **Status:** Steps 1 to 3 Complete  
> **Target Application:** SecureAssess (Multi-Tenant Video Assessment & Proctoring Platform)

---

## Table of Contents
1. [Executive Summary & High-Level Architecture](#1-executive-summary--high-level-architecture)
2. [Project Root & Workspace Structure](#2-project-root--workspace-structure)
3. [Backend Modular Clean Architecture (`server/src/`)](#3-backend-modular-clean-architecture-serversrc)
4. [The Standard Module Contract](#4-the-standard-module-contract)
5. [Multi-Tenancy & Data Isolation Model](#5-multi-tenancy--data-isolation-model)
6. [Database & Mongoose Conventions](#6-database--mongoose-conventions)
7. [Application Lifecycle & Fail-Fast Startup](#7-application-lifecycle--fail-fast-startup)
8. [Module Implementation Status Matrix](#8-module-implementation-status-matrix)
9. [Next Steps Roadmap](#9-next-steps-roadmap)

---

## 1. Executive Summary & High-Level Architecture

SecureAssess is an all-in-one assessment, online interview, and proctoring platform designed for multi-organizational use (universities, enterprises, bootcamps). The system is built with a decoupled frontend (React + Vite) and backend (Node.js + Express + Socket.io + MongoDB) using a strict multi-tenant isolation model.

```
+─────────────────────────────────────────────────────────────────────────────+
|                             SecureAssess Platform                           |
+─────────────────────────────────────────────────────────────────────────────+
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     Client (React + Vite)     │             │        Backend (Express)      │
│  - Candidate Exam Interface   │◄──HTTP/WS──►│  - REST API & RBAC Guards     │
│  - Recruiter Dashboard UI     │             │  - WebRTC Signaling Server    │
│  - Real-Time Media & Monitor  │             │  - Multi-Tenant Data Access   │
└───────────────────────────────┘             └───────────────┬───────────────┘
                                                              │
                                                              ▼
                                              ┌───────────────────────────────┐
                                              │      MongoDB (secureassess)   │
                                              │  - Scoped by organizationId   │
                                              │  - Native ObjectId References │
                                              └───────────────────────────────┘
```

---

## 2. Project Root & Workspace Structure

The project root is organized into clear functional boundaries:

```
SecureAssess/
│
├── server/               # Backend service (REST API, WebSockets, DB layer)
│
├── client/               # Frontend single-page application (React, Tailwind, Vite)
│
├── Shared/               # Cross-boundary constants, validation schemas, and DTO types
│
├── Documentation/        # Architectural specifications, conventions, and review notes
│
├── Scripts/              # Database seeders, maintenance, and deployment scripts
│
├── Infrastructure/       # Docker, coturn TURN server, and cloud provisioning
│
├── .gitignore            # Root-level secret & artifact ignore rules
├── README.md             # Project overview and getting started guide
└── package.json          # Root npm workspace orchestrator
```

---

## 3. Backend Modular Clean Architecture (`server/src/`)

```
server/
├── src/
│   │
│   ├── config/                      # Infrastructure & Environment Configurations
│   │   ├── db.js                    # Modern Mongoose fail-fast connection & lifecycle events
│   │   ├── env.js                   # Typed environment variable loader & fallback defaults
│   │   ├── cors.js                  # CORS origin whitelist & security policies
│   │   ├── logger.js                # Formatted timestamped logging utility
│   │   ├── storage.js               # Multi-provider file storage configuration
│   │   ├── email.js                 # SMTP transport settings
│   │   ├── redis.js                 # Redis caching client configuration
│   │   └── cloudinary.js            # Media upload credentials
│   │
│   ├── constants/                   # Global System Constants
│   │   ├── roles.js                 # SUPER_ADMIN, ADMIN, RECRUITER, EXAMINER, CANDIDATE
│   │   ├── permissions.js           # Granular RBAC capabilities
│   │   ├── assessmentTypes.js       # MCQ, CODING, VIDEO_INTERVIEW, HYBRID, ESSAY
│   │   ├── questionTypes.js         # SINGLE_CHOICE, MULTIPLE_CHOICE, CODING, ESSAY...
│   │   ├── attemptStatuses.js       # NOT_STARTED, IN_PROGRESS, SUBMITTED, EXPIRED...
│   │   ├── resultStatuses.js        # PASS, FAIL, PENDING, FLAGGED
│   │   ├── userStatuses.js          # ACTIVE, INACTIVE, SUSPENDED
│   │   ├── subscriptionPlans.js     # FREE_TRIAL, STARTER, PROFESSIONAL, ENTERPRISE
│   │   └── systemConstants.js       # Pagination bounds, token durations, salt rounds
│   │
│   ├── middleware/                  # Request Interceptors & Guards
│   │   ├── auth.middleware.js       # Cryptographic JWT authentication (req.user)
│   │   ├── tenant.middleware.js     # Untrusted client protection & req.organizationId derivation
│   │   ├── role.middleware.js       # RBAC role enforcement (requireRoles)
│   │   ├── permission.middleware.js # Permission enforcement (requirePermissions)
│   │   ├── validation.middleware.js # Payload validation interceptor
│   │   ├── rateLimit.middleware.js  # Token-bucket rate limiting middleware
│   │   ├── security.middleware.js   # Helmet security headers (CSP, FrameGuard, XSS)
│   │   ├── error.middleware.js      # Centralized error handler returning ApiResponse format
│   │   └── notFound.middleware.js   # 404 Route handler
│   │
│   ├── utils/                       # Shared Helpers & Classes
│   │   ├── ApiError.js              # Standardized API error class with HTTP status code
│   │   ├── ApiResponse.js           # Standardized JSON response envelope
│   │   ├── asyncHandler.js          # Promise wrapper to eliminate try/catch in controllers
│   │   ├── pagination.js            # Page, limit, skip, and pagination metadata calculation
│   │   ├── token.js                 # JWT access and refresh token generator & verifier
│   │   ├── password.js              # Bcrypt password hashing and comparison
│   │   ├── tenantScope.js           # Schema helper and query builder filter for organizationId
│   │   ├── generateCode.js          # Assessment room codes and OTP generators
│   │   ├── date.js                  # Expiration checking and duration formatting
│   │   ├── file.js                  # MIME type checking and file size formatting
│   │   └── sanitize.js              # Input sanitization and XSS stripping
│   │
│   ├── services/                    # Shared Technical Services
│   │   ├── email/                   # Email service with HTML templates
│   │   ├── storage/                 # Local & cloud file upload handler
│   │   ├── notification/            # In-app notifications & WebSockets
│   │   ├── pdf/                     # Dynamic PDF generation (reports, certificates)
│   │   └── export/                  # CSV & JSON data exporting
│   │
│   ├── events/                      # Central EventBus & Domain Listeners
│   │   ├── eventBus.js              # EventEmitter instance
│   │   ├── assessment.events.js     # Assessment lifecycle events
│   │   ├── attempt.events.js        # Attempt progress & integrity violation events
│   │   ├── result.events.js         # Result evaluation triggers
│   │   └── user.events.js           # User registration & password events
│   │
│   ├── database/                    # Database Operations
│   │   ├── seeders/                 # Seeders for roles, permissions, and Super Admin
│   │   └── migrations/              # Schema & data migration runner
│   │
│   ├── routes/                      # Route Mounting
│   │   ├── index.js                 # Mounts /v1
│   │   └── v1/index.js              # Aggregates domain module routes & /health endpoint
│   │
│   ├── modules/                     # Domain Feature Modules (30+ Domains)
│   │
│   ├── app.js                       # Express Application Setup (Zero Database Logic)
│   └── server.js                    # HTTP + Socket.io Server & Fail-Fast DB Boot
│
├── .env.example                     # Environment configuration template
├── .gitignore                       # Git secret exclusion rules
└── package.json                     # Server scripts (dev, start, db:seed, db:migrate)
```

---

## 4. The Standard Module Contract

Every feature module in `server/src/modules/` adheres to a strict contract where each file has a single, well-defined responsibility:

```
moduleName/
├── moduleName.model.js        # Mongoose Schema & Domain Model
├── moduleName.controller.js   # HTTP Layer (req, res, status codes, ApiResponse)
├── moduleName.service.js      # Pure Business Logic (rules, orchestration, events)
├── moduleName.repository.js   # Data Access (direct MongoDB queries scoped by tenant)
├── moduleName.routes.js       # Route Definitions (middleware, guards, bindings)
├── moduleName.validator.js    # Payload & Query Validation Schemas
├── moduleName.mapper.js       # DTO Transformation (strips sensitive fields)
├── moduleName.constants.js    # Module-specific Enums, Statuses, Messages
└── index.js                   # Barrel Module Export (public interface)
```

### Responsibility Matrix:

| File | Primary Layer | Key Responsibility | Absolute Rule |
| :--- | :--- | :--- | :--- |
| `model.js` | Database | Defines Mongoose fields, data types, indexes, and relations. | Zero HTTP logic or external service calls. |
| `controller.js` | HTTP | Handles request parameters, HTTP status codes, and formatting. | Zero direct DB queries; delegates immediately to the service. |
| `service.js` | Domain | Validates business rules, tenant quotas, emits events. | Never touches `req` or `res` HTTP objects. |
| `repository.js` | Data Access | Encapsulates DB lookups (`findById`, `create`, `update`, `delete`). | All tenant queries MUST include `organizationId`. |
| `validator.js` | Validation | Validates types, required fields, and constraints. | Blocks bad requests before hitting controller/service logic. |
| `mapper.js` | Presentation | Formats database models into safe API DTOs. | Strips password hashes, tokens, and internal DB flags. |
| `constants.js` | Domain | Module-scoped enums and defaults. | Global constants remain in `src/constants/`. |
| `routes.js` | Routing | Maps endpoints (`POST`, `GET`, etc.) to guards & controllers. | Only wires middlewares and controllers. |
| `index.js` | Export | Public interface barrel file. | Exposes router, service, model, and repository. |

---

## 5. Multi-Tenancy & Data Isolation Model

### 5.1 The Hierarchy
```
SecureAssess Platform (Super Admin Scope)
        │
        ├── Organization A (Tenant Scope)
        │      ├── Users (Staff / Recruiters)
        │      ├── Candidates (Examinees)
        │      ├── Question Bank
        │      ├── Assessments
        │      └── Results & Reports
        │
        └── Organization B (Tenant Scope)
               ├── Users (Staff / Recruiters)
               ├── Candidates (Examinees)
               ├── Question Bank
               ├── Assessments
               └── Results & Reports
```

### 5.2 Platform vs. Organization Data Scope

1. **Platform-Level Data (No `organizationId`)**:
   - `roles`
   - `permissions`
   - `subscriptionPlans`
   - `systemConfiguration`
   - `platformAuditLogs`

2. **Organization-Level Data (Mandatory `organizationId`)**:
   - `users`, `candidates`, `candidateGroups`
   - `departments`, `programs`, `subjects`
   - `questionBank`, `questionCategories`, `questionTags`
   - `assessments`, `assessmentSections`, `assessmentQuestions`, `assessmentAssignments`
   - `attempts`, `attemptQuestions`, `answers`
   - `evaluations`, `rubrics`, `results`
   - `certificates`, `reports`, `notifications`

### 5.3 Security Principle: Never Trust `organizationId` from the Client

```
Client HTTP Request (Bearer JWT)
       │
       ▼
[auth.middleware.js] ──────► Verifies JWT signature and payload
       │
       ▼
req.user ──────────────────► Verified identity extracted
       │
       ▼
[tenant.middleware.js] ────► Sets req.organizationId = req.user.organizationId
                             (Ignores client body/query tampering)
       │
       ▼
[Repository Query] ────────► Assessment.find({ organizationId: req.organizationId, ... })
```

---

## 6. Database & Mongoose Conventions

1. **Database Name**: `secureassess` (Configured across `server/.env.example` and `config/env.js`).
2. **Automatic Timestamps**: All schemas use `{ timestamps: true }` generating `createdAt` and `updatedAt`.
3. **ObjectId References**: All relations use native MongoDB `mongoose.Schema.Types.ObjectId` with `ref`.
4. **Query-Driven Indexing**:
   - Tenant Single Index: `{ organizationId: 1 }`
   - Tenant Compound Indexes: `{ organizationId: 1, status: 1 }`, `{ organizationId: 1, createdAt: -1 }`
   - Unique High-Cardinality Indexes: `{ email: 1 }`, `{ slug: 1 }`, `{ accessCode: 1 }`
5. **Modern Mongoose Connection**:
   - Deprecated flags (`useNewUrlParser`, `useUnifiedTopology`, `useCreateIndex`) are omitted.
   - Configured with `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`, `maxPoolSize: 50`.

---

## 7. Application Lifecycle & Fail-Fast Startup

### 7.1 Startup Pipeline (`server/src/server.js`)
```
1. Load Environment Variables (config/env.js)
        │
2. Initialize Configurations & Logger (config/logger.js, config/cors.js)
        │
3. Connect MongoDB (config/db.js)
   ├── [FAILURE] ──► Log Fatal Error ──► process.exit(1) (Fail-Fast: App never starts with unreachable DB)
   └── [SUCCESS] ──► Connection established
        │
4. Initialize Express Application Pipeline (app.js)
   ├── Security Headers -> CORS -> Body Parsers -> Rate Limiting -> Tenant Resolver -> Routes -> Error Handler
        │
5. Start HTTP & Socket.io WebRTC Signaling Server (server.js on Port 7000)
```

### 7.2 Graceful Shutdown Pipeline
```
SIGTERM / SIGINT Signal Received
        │
1. Stop accepting new HTTP requests (server.close)
2. Close all active Socket.io WebSockets
3. Gracefully disconnect MongoDB connection pools (disconnectDatabase)
4. Exit process cleanly with code 0
```

---

## 8. Module Implementation Status Matrix

| Module Name | Model | Controller | Service | Repository | Routes | Validator | Mapper | Constants | Index | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`auth`** | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | **Implemented** |
| **`users`** | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | **Implemented** |
| **`organizations`** | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | **Implemented** |
| **`assessments`** | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | **Implemented** |
| *27 Other Modules* | — | — | — | — | — | — | — | — | :heavy_check_mark: | **Foundation Ready** |

*(The 27 remaining modules under `server/src/modules/` contain clean `index.js` routers without premature models or placeholder mock logic).*

---

## 9. Next Steps Roadmap

With Steps 1 to 3 structurally and architecturally complete:
- **Step 4**: Core Schema & Data Modeling (Candidates, Question Bank, Assessments, Sections, Questions).
- **Step 5**: Attempt Execution Engine & State Machine (Timer synchronization, auto-submission, answer recording).
- **Step 6**: Real-time Proctoring Engine & WebRTC Integrity Signals (Tab switch detection, fullscreen enforcement, audio/video monitoring).
- **Step 7**: Evaluation & Grading Pipeline (Automated MCQ grading, rubric evaluation, score calculation).
- **Step 8**: Frontend Client Integration (React candidate room, recruiter dashboard, video stream integration).

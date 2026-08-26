# SecureAssess — System Architecture & Review Document (v2.0.0)

> **Document Version:** 2.0.0  
> **Status:** Steps 1 through 6 Complete  
> **Target Application:** SecureAssess (Enterprise Multi-Tenant Assessment, Video Interview & AI-Proctored Examination SaaS)

---

## Table of Contents
1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Project Root & Workspace Structure](#2-project-root--workspace-structure)
3. [Decoupled Identity & Multi-Tenant Model (Step 5)](#3-decoupled-identity--multi-tenant-model-step-5)
4. [RBAC & Authorization Matrix (Step 6)](#4-rbac--authorization-matrix-step-6)
5. [Backend Modular Architecture (`server/src/`)](#5-backend-modular-architecture-serversrc)
6. [End-to-End Request & Security Lifecycle Workflow](#6-end-to-end-request--security-lifecycle-workflow)
7. [Database Models & Seeder Infrastructure](#7-database-models--seeder-infrastructure)
8. [Module Implementation Status Matrix](#8-module-implementation-status-matrix)

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
                                                      │      MongoDB (secureassess)       │
                                                      │  - Users, Memberships, Sessions   │
                                                      │  - 7 System Roles & 113 Perms     │
                                                      │  - Organizations & Assessments    │
                                                      └───────────────────────────────────┘
```

---

## 2. Project Root & Workspace Structure

```
SecureAssess/
│
├── server/               # Backend REST API, WebSockets & Database layers
├── client/               # Frontend React single-page application (Vite)
├── Shared/               # Cross-boundary DTO schemas, types & global enums
├── Documentation/        # Architecture specs, multi-tenancy rules & DB conventions
├── Scripts/              # Automated database seeders & migration helpers
├── Infrastructure/       # Docker, coturn TURN server & cloud provisioning
├── .gitignore            # Git exclusion rules (.env, build artifacts, logs)
├── README.md             # Project overview
└── package.json          # Root npm workspace orchestrator
```

---

## 3. Decoupled Identity & Multi-Tenant Model (Step 5)

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

                                Sessions
                                  User
                                   │
                           ├── Session 1 (Desktop Chrome)
                           ├── Session 2 (Mobile App)
                           └── Session 3 (Rotated Token Family)
```

### Core Entities:
1. **`User` ([user.model.js](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/modules/users/user.model.js))**:
   - Holds universal identity (`firstName`, `lastName`, `email`, `passwordHash`, `status`, `profile`, `emailVerified`).
   - Holds platform access (`platformRole`: `"PLATFORM_OWNER"`, `"PLATFORM_ADMIN"`, or `null`).
   - **Zero hardcoded `organizationId`**.

2. **`UserMembership` ([userMembership.model.js](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/modules/users/userMembership.model.js))**:
   - Links `userId` $\leftrightarrow$ `organizationId` $\leftrightarrow$ `roleId`.
   - Compound unique index `{ userId: 1, organizationId: 1 }` guarantees one active membership per tenant.

3. **`Session` ([session.model.js](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/modules/auth/session.model.js))**:
   - Represents a physical device login session with refresh token rotation (`tokenFamily`, `refreshTokenHash`, `userAgent`, `ipAddress`, `expiresAt`, `revokedAt`).

4. **`Organization` ([organization.model.js](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/modules/organizations/organization.model.js))**:
   - Tenant container (`name`, `slug`, `code`, `type`, `address`, `settings`, `subscriptionId`, `status`).

---

## 4. RBAC & Authorization Matrix (Step 6)

### 4.1 Scopes
- **`PLATFORM` Scope**: For platform administrators overseeing SecureAssess.
- **`ORGANIZATION` Scope**: For tenant-isolated staff and candidate operations.

### 4.2 System Roles & Permissions Breakdown
```
PLATFORM_OWNER (113 Permissions)
    │
    └── PLATFORM_ADMIN (12 Permissions)

ORGANIZATION_OWNER (77 Permissions)
    │
    └── ORGANIZATION_ADMIN (49 Permissions)
            │
            ├── EXAMINER (37 Permissions)
            ├── PROCTOR (9 Permissions)
            └── CANDIDATE (8 Permissions)
```

| System Role | Scope | Total Perms | Primary Responsibilities |
| :--- | :---: | :---: | :--- |
| **`PLATFORM_OWNER`** | `PLATFORM` | **113** | Root system administrator (You). Full control over all organizations, subscriptions, billing, and platform configurations. |
| **`PLATFORM_ADMIN`** | `PLATFORM` | **12** | Platform staff for monitoring organizations, viewing logs, and user support. |
| **`ORGANIZATION_OWNER`** | `ORGANIZATION` | **77** | Primary administrator of an organization. Manages org profile, staff, departments, question banks, exams, and reports. |
| **`ORGANIZATION_ADMIN`** | `ORGANIZATION` | **49** | Operational administrator managing staff, schedules, question banks, exams, and grading. |
| **`EXAMINER`** | `ORGANIZATION` | **37** | Creates and curates question banks, constructs assessments, configures rubrics, and grades candidates. |
| **`PROCTOR`** | `ORGANIZATION` | **9** | Supervises live examinations, monitors candidate streams, and reviews/flags integrity violations. |
| **`CANDIDATE`** | `ORGANIZATION` | **8** | Examinee. Strictly isolated to starting own attempts, updating own answers, and viewing own results/certificates. |

---

## 5. Backend Modular Architecture (`server/src/`)

```
server/
├── src/
│   ├── config/                      # Infrastructure & Environment configurations
│   │   ├── db.js                    # Modern Mongoose (fail-fast connection & lifecycle events)
│   │   ├── env.js                   # Typed environment variable loader
│   │   ├── cors.js                  # CORS policies & allowed origins
│   │   ├── logger.js                # Centralized logger
│   │   └── storage.js               # Multi-provider storage (Local, S3, Cloudinary)
│   │
│   ├── constants/                   # Global system constants
│   │   ├── roles.js                 # PLATFORM_ROLES, ORGANIZATION_ROLES, ROLE_SCOPES
│   │   ├── permissions.js           # 113 granular resource.action permissions
│   │   ├── userStatuses.js          # ACTIVE, INVITED, SUSPENDED, DEACTIVATED
│   │   ├── assessmentTypes.js       # MCQ, CODING, VIDEO_INTERVIEW, HYBRID, ESSAY
│   │   ├── questionTypes.js         # SINGLE_CHOICE, MULTIPLE_CHOICE, CODING...
│   │   ├── attemptStatuses.js       # NOT_STARTED, IN_PROGRESS, SUBMITTED, EXPIRED...
│   │   └── subscriptionPlans.js     # FREE_TRIAL, STARTER, PRO, ENTERPRISE
│   │
│   ├── middleware/                  # Request Interceptors & Security Pipeline
│   │   ├── auth.middleware.js       # JWT verification & req.user attachment
│   │   ├── tenant.middleware.js     # Untrusted client prevention & tenant context resolution
│   │   ├── role.middleware.js       # Role check guards
│   │   ├── permission.middleware.js # Granular permission guards
│   │   ├── security.middleware.js   # Helmet security headers (CSP, FrameGuard, XSS)
│   │   ├── rateLimit.middleware.js  # Token-bucket rate limiter
│   │   └── error.middleware.js      # Global API error handler
│   │
│   ├── database/                    # Database setup & maintenance
│   │   └── seeders/                 # rbac.seeder.js, admin.seeder.js, index.js
│   │
│   ├── modules/                     # 30+ Clean Architecture Domain Modules
│   │   ├── auth/                    # session.model.js, token rotation & auth services
│   │   ├── users/                   # user.model.js, userMembership.model.js
│   │   ├── roles/                   # role.model.js (system & custom roles)
│   │   ├── permissions/             # permission.model.js
│   │   ├── organizations/           # organization.model.js (multi-tenant core)
│   │   └── assessments/             # assessment.model.js blueprint
│   │
│   ├── app.js                       # Express Application Setup (Zero Database Logic)
│   └── server.js                    # Bootloader & Fail-Fast Database Bootstrap
│
├── .env.example                     # Environment configuration template
└── package.json                     # Server scripts
```

---

## 6. End-to-End Request & Security Lifecycle Workflow

```
1. Incoming HTTP Request (Bearer JWT)
       │
2. Security & Rate Limiting Middleware (Helmet headers, IP rate limit)
       │
3. Authentication Middleware (auth.middleware.js)
   ├── Cryptographically verifies JWT access token signature & expiration
   ├── Loads User identity & verifies status == ACTIVE
   └── Attaches req.user
       │
4. Tenant Resolver (tenant.middleware.js)
   ├── If PLATFORM_OWNER -> Allowed platform-wide scope
   └── If Tenant User -> Extracts verified organizationId from active UserMembership
       │
5. Role & Permission Guard (permission.middleware.js)
   ├── Loads user's roleId within active organization
   ├── Checks if assigned permissions contains required `resource.action`
   └── Blocks with 403 Forbidden if permission is missing
       │
6. Resource Ownership / Scope Check
   ├── Enforces tenant scoping: `{ _id: resourceId, organizationId: req.organizationId }`
   └── If Candidate: Enforces ownership: `{ _id: attemptId, candidateId: req.user.id }`
       │
7. Controller -> Service -> Repository -> MongoDB
       │
8. Response Envelope (ApiResponse format, sanitized DTO via Mapper)
```

---

## 7. Database Models & Seeder Infrastructure

| Collection | Model File | Purpose | Indexed Fields |
| :--- | :--- | :--- | :--- |
| **`users`** | `user.model.js` | Universal identity & credentials | `email: 1` (unique), `platformRole: 1`, `status: 1` |
| **`usermemberships`** | `userMembership.model.js` | User-to-Organization role binding | `{ userId: 1, organizationId: 1 }` (unique), `roleId: 1` |
| **`sessions`** | `session.model.js` | Active device session & token rotation | `userId: 1`, `tokenFamily: 1`, `expiresAt: 1` |
| **`roles`** | `role.model.js` | System & custom role definitions | `{ name: 1, scope: 1, organizationId: 1 }` (unique) |
| **`permissions`** | `permission.model.js` | Granular action registry (113 keys) | `key: 1` (unique), `resource: 1`, `action: 1` |
| **`organizations`** | `organization.model.js` | Customer tenant account | `slug: 1` (unique), `code: 1` (unique), `status: 1` |

### Seeder Pipeline (`npm run db:seed`)
1. **`rbac.seeder.js`**: Populates all 113 permissions, creates 7 system roles, and maps permissions into each role's `permissions` array.
2. **`admin.seeder.js`**: Seeds the root `owner@secureassess.com` account with `platformRole: "PLATFORM_OWNER"` (requires no tenant membership).

---

## 8. Module Implementation Status Matrix

| Module | Schema / Model | Core Logic / Contract | Seeder / Data Ready |
| :--- | :---: | :---: | :---: |
| **`auth`** | :heavy_check_mark: `session.model.js` | :heavy_check_mark: Token Rotation | :heavy_check_mark: Configured |
| **`users`** | :heavy_check_mark: `user.model.js` & `userMembership.model.js` | :heavy_check_mark: Standard Contract | :heavy_check_mark: Seeded |
| **`roles`** | :heavy_check_mark: `role.model.js` | :heavy_check_mark: Standard Contract | :heavy_check_mark: 7 System Roles Seeded |
| **`permissions`** | :heavy_check_mark: `permission.model.js` | :heavy_check_mark: Standard Contract | :heavy_check_mark: 113 Perms Seeded |
| **`organizations`** | :heavy_check_mark: `organization.model.js` | :heavy_check_mark: Standard Contract | :heavy_check_mark: Multi-tenant Ready |
| **`assessments`** | :heavy_check_mark: `assessment.model.js` | :heavy_check_mark: Standard Contract | :heavy_check_mark: Reference Ready |
| *25 Remaining Modules* | Foundation Ready | `index.js` Router Foundation | Pending Domain Steps |

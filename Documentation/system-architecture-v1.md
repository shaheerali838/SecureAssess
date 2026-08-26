# SecureAssess — System Architecture & Review Document (v1.0.0)

> **Document Version:** 1.0.0  
> **Status:** Steps 1 through 3 Complete  
> **Target Application:** SecureAssess (Initial Modular Foundation & Database Conventions)

---

## Table of Contents
1. [Executive Summary & High-Level Architecture](#1-executive-summary--high-level-architecture)
2. [Project Root & Workspace Structure](#2-project-root--workspace-structure)
3. [Backend Modular Clean Architecture (`server/src/`)](#3-backend-modular-clean-architecture-serversrc)
4. [The Standard Module Contract](#4-the-standard-module-contract)
5. [Initial Multi-Tenancy & Data Isolation Model](#5-initial-multi-tenancy--data-isolation-model)
6. [Database & Mongoose Conventions](#6-database--mongoose-conventions)
7. [Application Lifecycle & Fail-Fast Startup](#7-application-lifecycle--fail-fast-startup)
8. [Initial Module Status Matrix](#8-initial-module-status-matrix)

---

## 1. Executive Summary & High-Level Architecture

SecureAssess is an all-in-one assessment, online interview, and proctoring platform designed for multi-organizational use (universities, enterprises, bootcamps). The system is built with a decoupled frontend (React + Vite) and backend (Node.js + Express + Socket.io + MongoDB) using a multi-tenant isolation model.

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

```
SecureAssess/
│
├── server/               # Backend service (REST API, WebSockets, DB layer)
├── client/               # Frontend single-page application (React, Tailwind, Vite)
├── Shared/               # Cross-boundary constants, validation schemas, and DTO types
├── Documentation/        # Architectural specifications, conventions, and review notes
├── Scripts/              # Database seeders, maintenance, and deployment scripts
├── Infrastructure/       # Docker, coturn TURN server, and cloud provisioning
├── .gitignore            # Root-level secret & artifact ignore rules
├── README.md             # Project overview and getting started guide
└── package.json          # Root npm workspace orchestrator
```

---

## 3. Backend Modular Clean Architecture (`server/src/`)

```
server/
├── src/
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
│   │   ├── roles.js                 # Initial role definitions
│   │   ├── permissions.js           # RBAC capabilities
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
│   │   ├── role.middleware.js       # RBAC role enforcement
│   │   ├── permission.middleware.js # Permission enforcement
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
│   │   ├── pagination.js            # Page, limit, skip, and pagination calculation
│   │   ├── token.js                 # JWT access and refresh token generator & verifier
│   │   ├── password.js              # Bcrypt password hashing and comparison
│   │   └── tenantScope.js           # Schema helper and query builder filter for organizationId
│   │
│   ├── routes/                      # Route Mounting
│   │   ├── index.js                 # Mounts /v1
│   │   └── v1/index.js              # Aggregates domain module routes & /health endpoint
│   │
│   ├── modules/                     # 30+ Domain Feature Modules
│   │
│   ├── app.js                       # Express Application Setup (Zero Database Logic)
│   └── server.js                    # HTTP + Socket.io Server & Fail-Fast DB Boot
│
├── .env.example                     # Environment configuration template
└── package.json                     # Server scripts
```

---

## 4. The Standard Module Contract

Every feature module in `server/src/modules/` adheres to a strict 9-file architecture:

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

---

## 5. Initial Multi-Tenancy & Data Isolation Model

```
Platform (Super Admin Scope)
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

### Golden Security Rule:
`organizationId` is extracted server-side from verified tokens, never trusted from client query or request body parameters.

---

## 6. Database & Mongoose Conventions

1. **Database Name**: `secureassess`
2. **Automatic Timestamps**: All schemas use `{ timestamps: true }`.
3. **ObjectId References**: Native MongoDB `mongoose.Schema.Types.ObjectId` with `ref`.
4. **Indexing**: Tenant indexes on `organizationId`, unique indexes on high-cardinality fields (`slug`, `email`, `code`).
5. **Modern Connection Pool**: `serverSelectionTimeoutMS: 5000`, `maxPoolSize: 50`.

---

## 7. Application Lifecycle & Fail-Fast Startup

```
1. Load Environment Variables (config/env.js)
        │
2. Initialize Configuration & Logger (config/logger.js, config/cors.js)
        │
3. Connect MongoDB (config/db.js)
   ├── [FAILURE] ──► Log Fatal Error ──► process.exit(1) (Fail-Fast)
   └── [SUCCESS] ──► Connection established
        │
4. Initialize Express Application Pipeline (app.js)
        │
5. Start HTTP & Socket.io WebRTC Listeners (server.js on Port 7000)
```

---

## 8. Initial Module Status Matrix

| Module Name | Model | Controller | Service | Repository | Routes | Validator | Mapper | Constants | Index | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`auth`** | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | **Reference Ready** |
| **`users`** | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | **Reference Ready** |
| **`organizations`** | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | **Reference Ready** |
| **`assessments`** | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | **Reference Ready** |
| *27 Other Modules* | — | — | — | — | — | — | — | — | :heavy_check_mark: | **Foundation Ready** |

# SecureAssess — Documentation Overview

SecureAssess is an enterprise-grade, multi-tenant B2B SaaS platform for online examinations, timed assessments, live video interviews, and real-time proctoring/integrity monitoring. It allows organizations (universities, enterprises, recruitment agencies, and bootcamps) to manage question banks, construct evaluations, conduct browser-monitored tests, and run peer-to-peer video interviews with zero third-party conferencing tools.

---

## Documentation Index

| Document | Purpose |
| :--- | :--- |
| [**Architecture & Design (ARCHITECTURE.md)**](./ARCHITECTURE.md) | High-level system topology, decoupled identity model, RBAC matrix, request lifecycle, WebRTC signaling, and cross-cutting concerns. |
| [**REST & Real-Time API (API.md)**](./API.md) | Comprehensive route index, HTTP request/response payloads, authentication guards, and Socket.io signaling events. |
| [**Data Model & Schemas (DATA_MODEL.md)**](./DATA_MODEL.md) | Mongoose schema definitions, field types, relationships, indexes, and multi-tenant scoping rules. |
| [**Environment & Setup Guide (SETUP.md)**](./SETUP.md) | Prerequisites, environment variables specification, step-by-step installation, and database seeding procedures. |
| [**Contributing & Code Conventions (CONTRIBUTING.md)**](./CONTRIBUTING.md) | Clean Architecture 9-file module contract, naming patterns, DTO mappers, and coding conventions. |

---

## Key Features

- **Decoupled Identity & Multi-Tenancy**: Universal user identity allowing individuals to belong to multiple independent organizations with distinct roles (`UserMembership`).
- **Granular RBAC**: 113 fine-grained permissions divided into `PLATFORM` and `ORGANIZATION` scopes across 7 system roles (`PLATFORM_OWNER`, `PLATFORM_ADMIN`, `ORGANIZATION_OWNER`, `ORGANIZATION_ADMIN`, `EXAMINER`, `PROCTOR`, `CANDIDATE`).
- **Assessments Engine**: Support for multiple assessment types (`MCQ`, `CODING`, `VIDEO_INTERVIEW`, `HYBRID`, `ESSAY`), custom durations, passing scores, and access codes.
- **Real-Time Proctoring & Signaling**: Socket.io-based WebRTC signaling for peer-to-peer video rooms and real-time event broadcasting (tab switching, fullscreen exit, audio/video monitoring).
- **Clean Backend Architecture**: Standard 9-file module contract (`model`, `controller`, `service`, `repository`, `validator`, `routes`, `mapper`, `constants`, `index.js`) ensuring single responsibility and strict tenant isolation.
- **Fail-Fast Bootstrapping**: Modern Mongoose connection management with connection pool limits and graceful shutdown handlers (`SIGTERM`/`SIGINT`).

---

## Tech Stack

### Backend
- **Runtime**: Node.js (v18+ LTS, ES Modules `"type": "module"`)
- **Web Framework**: Express v5.2.1
- **Database & ODM**: MongoDB with Mongoose v9.9.4
- **Real-Time & Signaling**: Socket.io v4.8.3
- **Authentication & Security**: JSON Web Tokens (`jsonwebtoken` v9.0.3), `bcryptjs` v3.0.3, CORS v2.8.6, Custom Security Headers

### Frontend
- **Framework & Build Tool**: React v19.2.8, Vite v8.2.2
- **Routing**: React Router v7.18.2
- **State Management**: Zustand v5.0.15
- **Linting**: ESLint v10.9.0 with React Hooks / Refresh plugins

---

## Repository Structure

```
SecureAssess/
├── client/                     # Frontend Single-Page Application (React + Vite)
│   ├── src/
│   │   ├── App.jsx             # Main Application Component
│   │   ├── index.css           # Global stylesheet
│   │   └── main.jsx            # React root mount point
│   ├── index.html              # HTML shell
│   ├── package.json            # Client dependencies and Vite scripts
│   └── vite.config.js          # Vite bundler configuration
│
├── server/                     # Backend API & Signaling Server (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Infrastructure (db, env, cors, logger, storage, redis, email)
│   │   ├── constants/          # System roles, permissions (113 keys), statuses, types
│   │   ├── database/           # Mongoose seeders (rbac.seeder, admin.seeder)
│   │   ├── events/             # Domain event buses (user, assessment, attempt, result)
│   │   ├── jobs/               # Background task definitions (expiry, certs, notifications)
│   │   ├── middleware/         # Auth, Tenant, Role, Permission, RateLimit, Error guards
│   │   ├── modules/            # 31 domain feature modules (Clean Architecture)
│   │   │   ├── auth/           # Sessions, token rotation, login, register
│   │   │   ├── users/          # Users, memberships, profile management
│   │   │   ├── roles/          # System and tenant role definitions
│   │   │   ├── permissions/    # Granular permission registry
│   │   │   ├── organizations/  # Multi-tenant container & organization settings
│   │   │   ├── assessments/    # Assessment configuration & lifecycle
│   │   │   └── ...             # Remaining domain module folders
│   │   ├── routes/             # API Router mounting (/api/v1)
│   │   ├── services/           # External service clients (email, storage, pdf, export)
│   │   ├── utils/              # ApiResponse, ApiError, asyncHandler, pagination, token
│   │   ├── app.js              # Express pipeline setup (middleware & routes)
│   │   └── server.js           # Server bootstrap, Socket.io signaling, DB connect
│   ├── .env.example            # Environment variables template
│   └── package.json            # Server dependencies and lifecycle scripts
│
├── docs/                       # Project Documentation Suite
│   ├── README.md               # Documentation entry point & overview
│   ├── ARCHITECTURE.md         # System design & request lifecycle
│   ├── API.md                  # REST & Socket API reference
│   ├── DATA_MODEL.md           # Database schemas & relationships
│   ├── SETUP.md                # Environment setup & seeding guide
│   └── CONTRIBUTING.md         # Codebase patterns & conventions
│
├── Documentation/              # Architecture design notes & specifications
├── Infrastructure/             # Containerization, deployment & coturn configurations
├── Scripts/                    # DB automation, maintenance, and setup scripts
├── Shared/                     # Shared cross-boundary contracts, DTOs & enums
├── package.json                # Root npm workspace configuration
└── README.md                   # Root repository summary
```

---

## Quick Start Commands

```bash
# 1. Install dependencies across root workspaces
npm run install:all

# 2. Run Database Seeders (creates 113 permissions, 7 system roles, root Platform Owner)
cd server
npm run db:seed

# 3. Start Backend Development Server (Port 7000)
npm run dev

# 4. Start Frontend Development Server (Port 5173)
cd ../client
npm run dev
```

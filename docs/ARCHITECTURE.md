# SecureAssess — System Architecture

This document describes the architectural patterns, security model, request lifecycle, data isolation mechanisms, and cross-cutting concerns implemented across the SecureAssess platform.

---

## 1. High-Level System Architecture

SecureAssess uses a decoupled, multi-tenant client-server architecture. The frontend is a React Single-Page Application (SPA), while the backend is an Express HTTP REST API and Socket.io WebRTC/proctoring signaling service.

```mermaid
graph TD
    Client["Client (React + Vite SPA)"]
    Server["Backend Service (Express 5 + Socket.io)"]
    DB[(MongoDB: secureassess)]
    ST[("Cloud / Local Storage")]
    Peer["Peer Browser (WebRTC P2P)"]

    Client -- "HTTP REST (Bearer JWT)" --> Server
    Client -- "Socket.io (Signaling & Flags)" --> Server
    Client <-. "Direct Video / Audio Stream (P2P)" .-> Peer
    Server -- "Mongoose ODM (Scoped Queries)" --> DB
    Server -- "Signed Media Uploads" --> ST
```

### Key Architectural Characteristics
1. **Direct Peer-to-Peer Media**: Media streams (video, audio, screen share) flow directly between candidate and recruiter/proctor browsers using WebRTC. The backend acts solely as a signaling channel (exchanging SDP offers, answers, and ICE candidates) and never proxies audio/video payloads directly.
2. **Fail-Fast Database Bootstrapping**: The Express application and Socket.io listeners do not accept incoming traffic until the MongoDB connection is fully established and validated (`server/src/server.js`).
3. **Decoupled Identity Model**: Users exist globally at the platform layer and participate in individual tenant organizations via explicit memberships rather than being hardcoded to a single tenant.

---

## 2. Decoupled Identity & Multi-Tenant Model

SecureAssess decouples universal user identity from organization tenancy. A single `User` record can belong to multiple independent `Organization` instances with different roles in each.

```mermaid
classDiagram
    class User {
        +_id: ObjectId
        +firstName: String
        +lastName: String
        +email: String (unique)
        +passwordHash: String
        +platformRole: String (PLATFORM_OWNER | PLATFORM_ADMIN | null)
        +status: String
    }

    class UserMembership {
        +_id: ObjectId
        +userId: ObjectId
        +organizationId: ObjectId
        +roleId: ObjectId
        +status: String
    }

    class Organization {
        +_id: ObjectId
        +name: String
        +slug: String (unique)
        +code: String (unique)
        +type: String
        +status: String
        +settings: Object
    }

    class Role {
        +_id: ObjectId
        +name: String
        +scope: String (PLATFORM | ORGANIZATION)
        +organizationId: ObjectId (null for system roles)
        +permissions: ObjectId[]
    }

    class Session {
        +_id: ObjectId
        +userId: ObjectId
        +tokenFamily: String
        +refreshTokenHash: String
        +expiresAt: Date
        +revokedAt: Date
    }

    User "1" --> "0..*" UserMembership : has
    Organization "1" --> "0..*" UserMembership : contains
    Role "1" --> "0..*" UserMembership : defines
    User "1" --> "0..*" Session : owns
```

### Tenancy Scopes

| Scope | Description | Entities / Permissions Included |
| :--- | :--- | :--- |
| **`PLATFORM`** | System-wide administrative oversight. Not bound to any `organizationId`. | Platform settings, global metrics, tenant management, system subscriptions, billing. |
| **`ORGANIZATION`** | Isolated tenant boundary. All operations require a verified `organizationId`. | Question banks, assessments, candidate assignments, attempts, proctoring events, results, certificates, departments. |

### Data Isolation Rules
1. **Mandatory `organizationId` Field**: Every tenant-owned Mongoose collection (`assessments`, `attempts`, `questions`, etc.) must include an indexed `organizationId` reference.
2. **Never Trust Client-Sent Tenant IDs**: The `tenant.middleware.js` extracts `organizationId` exclusively from the cryptographically verified JWT (`req.user.organizationId`). Any client attempt to provide `?organizationId=XYZ` or `{ organizationId: "XYZ" }` in the request body is overwritten with the token-bound value.
3. **Platform Owner Override**: Only users holding `platformRole: "PLATFORM_OWNER"` or `PLATFORM_ADMIN` can operate platform-wide or explicitly target an organization via headers (`x-tenant-id`, `x-organization-id`).

---

## 3. Role-Based Access Control (RBAC) Matrix

SecureAssess includes an RBAC engine consisting of **113 granular permissions** categorized under `PLATFORM` or `ORGANIZATION` scopes, mapped across **7 system roles**.

### Role Hierarchy & Responsibilities

```mermaid
graph TD
    PO[PLATFORM_OWNER<br/>113 Permissions] --> PA[PLATFORM_ADMIN<br/>12 Permissions]
    OO[ORGANIZATION_OWNER<br/>77 Permissions] --> OA[ORGANIZATION_ADMIN<br/>49 Permissions]
    OA --> EX[EXAMINER<br/>37 Permissions]
    OA --> PR[PROCTOR<br/>9 Permissions]
    OA --> CA[CANDIDATE<br/>8 Permissions]
```

| Role | Scope | Perms Count | Summary of Access |
| :--- | :---: | :---: | :--- |
| **`PLATFORM_OWNER`** | `PLATFORM` | **113** | Root administrator with total control over all platform settings, organizations, subscriptions, billing, and logs. |
| **`PLATFORM_ADMIN`** | `PLATFORM` | **12** | Platform support staff with read/audit access to organizations, users, subscriptions, and logs. |
| **`ORGANIZATION_OWNER`** | `ORGANIZATION` | **77** | Primary tenant administrator with full authority over organization profile, staff, assessments, exams, and reports. |
| **`ORGANIZATION_ADMIN`** | `ORGANIZATION` | **49** | Operational tenant administrator managing staff, schedules, question banks, and grading workflows. |
| **`EXAMINER`** | `ORGANIZATION` | **37** | Academic/recruiter user who creates questions, builds assessments, and grades candidates. |
| **`PROCTOR`** | `ORGANIZATION` | **9** | Live exam supervisor with permissions to monitor candidate streams, review flags, and record violations. |
| **`CANDIDATE`** | `ORGANIZATION` | **8** | Examinee with strictly scoped permissions to create/update own attempts and view own results/certificates. |

---

## 4. Backend Modular Clean Architecture

Backend modules inside [`server/src/modules/`](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/modules) adhere to a 9-file Clean Architecture structure:

```
moduleName/
├── moduleName.model.js        # Mongoose Schema & domain model definition
├── moduleName.controller.js   # HTTP Request/Response handling (req, res, ApiResponse)
├── moduleName.service.js      # Pure business logic and domain orchestration
├── moduleName.repository.js   # Scoped data access layer (direct database queries)
├── moduleName.validator.js    # Payload/query validation logic (Joi / custom schemas)
├── moduleName.routes.js       # Express route declarations & middleware bindings
├── moduleName.mapper.js       # DTO transformation layer (removes sensitive attributes)
├── moduleName.constants.js    # Module-level enums, error messages, and defaults
└── index.js                   # Barrel export file exposing router, service, repository
```

### Module Responsibilities & Separation of Concerns

```mermaid
sequenceDiagram
    participant Client
    participant Routes as Routes + Middleware
    participant Controller
    participant Service
    participant Repository
    participant DB as MongoDB

    Client->>Routes: HTTP Request (Headers + Body + Bearer Token)
    Routes->>Routes: auth.middleware (Verify JWT)
    Routes->>Routes: tenant.middleware (Resolve req.organizationId)
    Routes->>Routes: role / permission.middleware (Check Access)
    Routes->>Routes: validator.middleware (Validate Payload)
    Routes->>Controller: Invokes controller method
    Controller->>Service: Invokes business logic method
    Service->>Repository: Requests data query scoped by organizationId
    Repository->>DB: Executes Mongoose find/update/create
    DB-->>Repository: Mongoose Document
    Repository-->>Service: Raw Entity Data
    Service-->>Controller: Business Result / Computed State
    Controller->>Controller: Mapper transforms entity to safe DTO
    Controller-->>Client: HTTP Response (ApiResponse Envelope)
```

---

## 5. End-to-End Request Lifecycle

Every incoming HTTP request traverses a standardized middleware pipeline before reaching domain business logic:

1. **Security Headers (`security.middleware.js`)**: Sets HTTP response headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security`, `Referrer-Policy`).
2. **CORS Validation (`config/cors.js`)**: Matches origin against configured `CORS_ORIGIN` environment settings.
3. **Payload Parsers (`app.js`)**: `express.json({ limit: "16kb" })` and `express.urlencoded({ extended: true, limit: "16kb" })` protect against oversized payloads.
4. **Rate Limiting (`rateLimit.middleware.js`)**: In-memory token bucket rate limiter (default: 200 requests per 60 seconds per IP).
5. **Tenant Resolver (`tenant.middleware.js`)**: Resolves tenant context from authenticated user identity or public headers.
6. **Authentication Guard (`auth.middleware.js`)**: Verifies cryptographic JWT access token from `Authorization: Bearer <token>` header, decodes payload, and attaches `req.user`.
7. **Role & Permission Guards (`role.middleware.js`, `permission.middleware.js`)**: Validates that `req.user` holds the required system roles or granular permission keys.
8. **Request Validator (`validation.middleware.js`)**: Validates request body, params, or query against schemas before controller invocation.
9. **Controller & Service Layer**: Executes core business workflow and repository access.
10. **Global Error Interceptor (`error.middleware.js`)**: Catches uncaught exceptions or instances of `ApiError`, returning a standardized JSON error response.

---

## 6. Real-Time WebRTC & Proctoring Signaling

Real-time signaling is handled via Socket.io in [`server/src/server.js`](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/server.js):

```mermaid
sequenceDiagram
    participant Candidate as Candidate Browser
    participant SocketServer as Socket.io Server
    participant Proctor as Proctor / Recruiter Browser

    Candidate->>SocketServer: socket.emit("join-room", { roomId, userId, role: "CANDIDATE" })
    Proctor->>SocketServer: socket.emit("join-room", { roomId, userId, role: "EXAMINER" })
    SocketServer-->>Proctor: socket.to(roomId).emit("user-joined", { userId, role, socketId })

    Candidate->>SocketServer: socket.emit("signal", { roomId, signal, targetSocketId })
    SocketServer->>Proctor: io.to(targetSocketId).emit("signal", { signal, senderSocketId })

    Note over Candidate,Proctor: WebRTC P2P Video/Audio Connection Established

    Candidate->>SocketServer: socket.emit("proctor-event", { roomId, eventType: "TAB_SWITCH", timestamp, metadata })
    SocketServer->>Proctor: socket.to(roomId).emit("candidate-flagged", { eventType, timestamp, metadata })
```

### Supported Socket Events

| Event Name | Direction | Payload | Purpose |
| :--- | :---: | :--- | :--- |
| `join-room` | Client $\rightarrow$ Server | `{ roomId, userId, role }` | Joins a designated assessment or interview room. |
| `user-joined` | Server $\rightarrow$ Room | `{ userId, role, socketId }` | Notifies existing room participants of a new peer. |
| `signal` | Bidirectional | `{ roomId, signal, targetSocketId }` | Relays WebRTC SDP offers, answers, and ICE candidates between peers. |
| `proctor-event` | Candidate $\rightarrow$ Server | `{ roomId, eventType, timestamp, metadata }` | Emits an integrity violation event (e.g. `TAB_SWITCH`, `FULLSCREEN_EXIT`). |
| `candidate-flagged` | Server $\rightarrow$ Room | `{ eventType, timestamp, metadata }` | Notifies proctors/examiners of an integrity violation in real time. |

---

## 7. Cross-Cutting Concerns

### Error Handling & Standard Responses
All API responses follow uniform JSON structures defined by `ApiResponse` and `ApiError`:

**Success Response Envelope (`ApiResponse`)**:
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Success message",
  "success": true
}
```

**Error Response Envelope (`ApiError`)**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "success": false,
  "errors": ["Email is required", "Password must be at least 8 characters"],
  "stack": "..." // Only present in development (NODE_ENV=development)
}
```

### Configuration & Environment Management
Environment settings are centralized in [`server/src/config/env.js`](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/config/env.js), loading either `server/.env` or root `.env` with fallback defaults. The resulting `ENV` object is frozen using `Object.freeze` to prevent runtime mutation.

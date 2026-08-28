# SecureAssess — System Architecture

This document describes the architectural patterns, security model, request lifecycle, data isolation mechanisms, and runtime engine across the SecureAssess platform.

---

## 1. High-Level System Architecture

SecureAssess uses a decoupled, multi-tenant client-server architecture. The frontend is a React Single-Page Application (SPA), while the backend is an Express HTTP REST API and Socket.io WebRTC/proctoring signaling service.

```mermaid
graph TD
    Client["Client (React 19 + Vite SPA)"]
    Server["Backend Service (Express 5 + Socket.io)"]
    DB[(MongoDB: SecureAssess)]
    ST[("Cloudinary (Media / Proctors)")]
    Peer["Peer Browser (WebRTC P2P)"]

    Client -- "HTTP REST (Bearer JWT + x-organization-id)" --> Server
    Client -- "Socket.io (Signaling & Flags)" --> Server
    Client <-. "Direct Video / Audio Stream (P2P)" .-> Peer
    Server -- "Mongoose ODM (Tenant Scoped)" --> DB
    Server -- "Signed Media Uploads" --> ST
```

### Key Architectural Characteristics
1. **Direct Peer-to-Peer Media**: Media streams (video, audio, screen share) flow directly between candidate and recruiter/proctor browsers using WebRTC. The backend acts solely as a signaling channel (exchanging SDP offers, answers, and ICE candidates) and never proxies audio/video payloads directly.
2. **Fail-Fast Database Bootstrapping**: The Express application and Socket.io listeners do not accept incoming traffic until the MongoDB connection is fully established and validated (`server/src/server.js`).
3. **Decoupled Identity Model**: Users exist globally at the platform layer and participate in individual tenant organizations via explicit memberships rather than being hardcoded to a single tenant.
4. **Immutable Question Snapshots**: Assessments copy question snapshots (`prompt`, `options`, `correctAnswer`, `points`, `difficulty`) into `AssessmentQuestion` records at authoring time. Question bank modifications never alter ongoing or past examinations.
5. **Runtime Attempt Questions & Anti-Tampering**: Candidates receive randomized `AttemptQuestion` records with masked answer keys (`correctAnswer` stripped) and shuffled options.

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

    class Candidate {
        +_id: ObjectId
        +organizationId: ObjectId
        +userId: ObjectId
        +candidateCode: String
        +departmentId: ObjectId
        +programId: ObjectId
        +status: String
    }

    User "1" --> "0..*" UserMembership : has
    Organization "1" --> "0..*" UserMembership : contains
    Role "1" --> "0..*" UserMembership : defines
    Organization "1" --> "0..*" Candidate : registers
    User "1" --> "0..*" Candidate : profile
```

---

## 3. Role-Based Access Control (RBAC) Matrix

SecureAssess includes an RBAC engine consisting of **121 granular permissions** categorized under `PLATFORM` or `ORGANIZATION` scopes, mapped across **7 system roles**.

### Role Hierarchy & Responsibilities

```mermaid
graph TD
    PO[PLATFORM_OWNER<br/>121 Permissions] --> PA[PLATFORM_ADMIN<br/>12 Permissions]
    OO[ORGANIZATION_OWNER<br/>85 Permissions] --> OA[ORGANIZATION_ADMIN<br/>57 Permissions]
    OA --> EX[EXAMINER<br/>45 Permissions]
    OA --> PR[PROCTOR<br/>9 Permissions]
    OA --> CA[CANDIDATE<br/>11 Permissions]
```

| Role | Scope | Summary of Access |
| :--- | :---: | :--- |
| **`PLATFORM_OWNER`** | `PLATFORM` | Root administrator with total control over all platform settings, organizations, subscriptions, billing, and logs. |
| **`PLATFORM_ADMIN`** | `PLATFORM` | Platform support staff with read/audit access to organizations, users, subscriptions, and logs. |
| **`ORGANIZATION_OWNER`** | `ORGANIZATION` | Primary tenant administrator with full authority over organization profile, staff, assessments, exams, candidates, and reports. |
| **`ORGANIZATION_ADMIN`** | `ORGANIZATION` | Operational tenant administrator managing staff, schedules, question banks, cohort assignments, and grading workflows. |
| **`EXAMINER`** | `ORGANIZATION` | Academic/recruiter user who creates questions, builds assessments, schedules cohorts, and evaluates candidate attempts. |
| **`PROCTOR`** | `ORGANIZATION` | Live exam supervisor with permissions to monitor candidate streams, review flags, and record violations. |
| **`CANDIDATE`** | `ORGANIZATION` | Examinee with strictly scoped self-permissions to start attempts, autosave answers, submit exams, and view published results. |

---

## 4. Examination Runtime & Evaluation Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate
    actor Examiner as Examiner
    participant Gateway as API Gateway
    participant AttemptSvc as Attempt Service
    participant AnswerSvc as Answer Service
    participant EvalSvc as Evaluation Engine
    participant DB as MongoDB

    Candidate->>Gateway: POST /candidate/assignments/:id/attempts
    Gateway->>AttemptSvc: Verify Candidate Profile + Assignment + Timer
    AttemptSvc->>DB: Create Attempt & Materialize AttemptQuestions (Options Shuffled)
    DB-->>Candidate: Return Candidate-Safe Attempt (Authoritative expiresAt)

    loop Exam Progress (Autosave & Navigation)
        Candidate->>Gateway: PUT /candidate/attempts/:id/questions/:qId/answer
        Gateway->>AnswerSvc: Validate Type Match + Tamper Check
        AnswerSvc->>DB: Upsert Answer (Version Increment)
        Candidate->>Gateway: POST /candidate/attempts/:id/heartbeat
        Gateway->>AttemptSvc: Update lastActivityAt + Return remainingSeconds
    end

    Candidate->>Gateway: POST /candidate/attempts/:id/submit
    Gateway->>AnswerSvc: Atomic Concurrency & Expiration Guard
    AnswerSvc->>DB: Lock Attempt (status: SUBMITTED, Freeze Answers)
    DB-->>Candidate: Confirmation of Submission

    Examiner->>Gateway: POST /attempts/:id/evaluate
    Gateway->>EvalSvc: Execute Grader Registry (SingleChoice, MultipleChoice, Coding, etc.)
    EvalSvc->>DB: Generate EvaluationItems + Result (published: false)
    DB-->>Examiner: Detailed Breakdown with Scores

    Examiner->>Gateway: POST /attempts/:id/publish-result
    Gateway->>EvalSvc: Set Result.published = true
    Candidate->>Gateway: GET /candidate/attempts/:id/result
    Gateway-->>Candidate: Return Final Grade, %, and Pass/Fail Status
```

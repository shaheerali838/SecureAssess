# 🏛️ SecureAssess — Complete Architecture, Implementation Status & Roadmap

---

## 1. High-Level System Architecture

```mermaid
graph TD
    subgraph ClientLayer ["Client Layer (React 19 + Vite + Tailwind CSS)"]
        Landing["Marketing & Auth (/login, /)"]
        PlatformPortal["Platform Admin Portal (/platform/*)"]
        OrgPortal["Organization Workspace (/organization/*)"]
        CandidatePortal["Candidate Assessment Room (/candidate/*)"]
        ThemeEngine["Universal Theme Engine (Light / Dark)"]
        AxiosBridge["Axios Interceptor Bridge (x-organization-id + JWT)"]
        SocketClient["Socket.IO Client (Real-time Telemetry & Proctoring)"]
        ExportEngine["Document Generation & CSV Export Engine"]
    end

    subgraph GatewayLayer ["API & Gateway Layer (Node.js / Express)"]
        CorsMW["CORS & Security Middleware"]
        AuthMW["JWT Authentication & Granular RBAC Middleware"]
        TenantMW["Multi-Tenant Isolation Scoper (req.organizationId)"]
        RateLimit["Rate Limiting & Audit Logger"]
        SocketServer["Socket.IO Event Hub (Proctoring & Live Sessions)"]
    end

    subgraph ServiceLayer ["Backend Service Modules (19 Complete Steps)"]
        AuthSvc["Auth, Tokens & Sessions"]
        OrgSvc["Organizations & Memberships"]
        AcademicSvc["Departments, Programs & Subjects"]
        QuestionSvc["Question Banks, Tags & Multi-Type Questions"]
        ExamSvc["Assessment Builder & 7-Stage Lifecycle"]
        AssignSvc["Candidate Management & Cohort Assignments"]
        AttemptSvc["Attempts Engine, Authoritative Timers & Heartbeat"]
        AnswerSvc["Answer Autosaving, Navigation & Tamper Guards"]
        EvalSvc["Evaluation Engine, Strategy Graders & Results"]
    end

    subgraph DataLayer ["Data & Storage Layer"]
        MongoDB[("MongoDB (Multi-Tenant Collections)")]
        Cloudinary[("Cloudinary (Media & Video Proctors)")]
    end

    Landing --> AxiosBridge
    PlatformPortal --> AxiosBridge
    OrgPortal --> AxiosBridge
    CandidatePortal --> AxiosBridge
    CandidatePortal --> SocketClient
    OrgPortal --> ExportEngine

    AxiosBridge --> CorsMW --> AuthMW --> TenantMW --> RateLimit
    SocketClient --> SocketServer

    TenantMW --> AuthSvc
    TenantMW --> OrgSvc
    TenantMW --> AcademicSvc
    TenantMW --> QuestionSvc
    TenantMW --> ExamSvc
    TenantMW --> AssignSvc
    TenantMW --> AttemptSvc
    TenantMW --> AnswerSvc
    TenantMW --> EvalSvc

    AuthSvc --> MongoDB
    OrgSvc --> MongoDB
    AcademicSvc --> MongoDB
    QuestionSvc --> MongoDB
    ExamSvc --> MongoDB
    AssignSvc --> MongoDB
    AttemptSvc --> MongoDB
    AnswerSvc --> MongoDB
    EvalSvc --> MongoDB
    EvalSvc --> Cloudinary
```

---

## 2. Multi-Tenant Security & Decoupled Identity Model

SecureAssess decouples the universal user identity from specific tenant memberships and candidate profiles:

```mermaid
graph TD
    User["Universal User Identity (User)"]
    
    subgraph PlatformAuthority ["Platform Governance"]
        PlatformRole["Platform Role (PLATFORM_OWNER / PLATFORM_ADMIN)"]
    end

    subgraph OrganizationA ["Tenant: Organization A (University)"]
        MembershipA["UserMembership A (Role: ORGANIZATION_OWNER / EXAMINER)"]
        CandidateProfileA["Candidate Profile A (VU-CAND-01)"]
        DeptA["Departments & Programs"]
        ExamsA["Published Assessments"]
        AssignA["Assessment Assignments"]
        AttemptA["Candidate Attempts"]
    end

    subgraph OrganizationB ["Tenant: Organization B (Enterprise)"]
        MembershipB["UserMembership B (Role: CANDIDATE)"]
        CandidateProfileB["Candidate Profile B (SA-CAND-01)"]
        ExamsB["Assessments"]
    end

    User --> PlatformRole
    User --> MembershipA
    User --> MembershipB
    User --> CandidateProfileA
    User --> CandidateProfileB

    MembershipA --> ExamsA
    ExamsA --> AssignA
    CandidateProfileA --> AssignA
    AssignA --> AttemptA
```

---

## 3. End-to-End Examination Execution Pipeline (Steps 13–19)

```mermaid
flowchart TD
    AcademicStructure["Step 13: Departments, Programs & Subjects"] --> QuestionBank["Step 14: Question Banks & Multi-Type Questions"]
    QuestionBank --> AssessmentBuilder["Step 15: Assessment Builder (Immutable Snapshots & 7-Stage Lifecycle)"]
    AssessmentBuilder --> Publishing["Publish Assessment (Locked against modification)"]
    
    Publishing --> CandidateManagement["Step 16: Candidates & Candidate Groups"]
    CandidateManagement --> AssessmentAssignment["Step 16: Individual & Batch Group Assignment (SA-XXXX-XXXX Access Code)"]
    
    AssessmentAssignment --> CandidateAuth["Step 16: Candidate Portal & Authorization Boundary"]
    CandidateAuth --> StartAttempt["Step 17: Start Attempt (Server-Authoritative Timer & Shuffling)"]
    
    StartAttempt --> AttemptQuestions["Step 17: Runtime Attempt Questions (Answers Masked)"]
    AttemptQuestions --> Answers["Step 18: Answer Autosave & Navigation Policy"]
    
    Answers --> FinalSubmission["Step 18: Atomic Submit & Attempt Freeze"]
    FinalSubmission --> EvaluationEngine["Step 19: Evaluation Engine (Strategy Graders & Negative Marking)"]
    
    EvaluationEngine --> EvaluationItems["Step 19: Question-Level Evaluation Items"]
    EvaluationItems --> ResultGeneration["Step 19: Result Calculation (Points, %, Grade, Pass/Fail)"]
    
    ResultGeneration --> ReviewGate{"Examiner Published?"}
    ReviewGate -- No --> Withheld["WITHHELD (Candidate Portal)"]
    ReviewGate -- Yes --> Published["PUBLISHED (Candidate Portal)"]
```

---

## 4. Implementation Status Matrix (Steps 1–19)

| Step | Area / Module | Core Functionality & Status | Verification Test Suite |
| :---: | :--- | :--- | :--- |
| **1–4** | **Repository Foundation** | Express 4, Mongoose, ESM, Environment Config & Seeders | Unit & DB Connections |
| **5** | **Granular RBAC** | 121 Granular Permissions, 7 System Roles (`seedRBAC()`) | Permission Matrix |
| **6** | **Universal Error Handling** | Standard `ApiError`, `ApiResponse`, and `asyncHandler` | Centralized Error MW |
| **7** | **Media Upload** | Cloudinary integration for proctor snapshots & media assets | Media Uploader |
| **8** | **Organization Management** | Complete CRUD `/api/v1/organizations` with tenant lifecycle | Integration Tests |
| **9** | **Decoupled User Identity** | Universal `User` $\leftrightarrow$ `UserMembership` architecture | Step 9 Tests |
| **10** | **Authentication & Security** | JWT Access & Refresh Tokens, Session tracking, Rate Limiting | Step 10 Tests |
| **11–12** | **Multi-Tenancy Isolation** | `requireTenantContext` & strict cross-tenant protection | Step 12 Tests |
| **13** | **Academic Hierarchy** | Departments, Programs & Subjects with cross-tenant FK verification | `step13_hierarchy.test.js` |
| **14** | **Question Bank** | Multi-type questions (`MCQ`, `CODING`, `ESSAY`, `TRUE_FALSE`), Tags, Categories | `step14_question_bank.test.js` |
| **15** | **Assessment Builder** | Immutable snapshotting, 7-stage lifecycle, modification locking | `step15_assessment_lifecycle.test.js` |
| **16** | **Candidate & Assignment** | Candidate profiles, Groups, Access codes, Authorization boundary | `step16_candidate_assignment.test.js` |
| **17** | **Assessment Attempts** | Authoritative timer, duplicate attempt protection, question & option shuffling | `step17_assessment_attempts.test.js` |
| **18** | **Answer Management** | Structured answer autosave, back-navigation policy, atomic submission lock | `step18_answer_management.test.js` |
| **19** | **Evaluation & Results** | Strategy graders, `EvaluationItem` breakdown, regrading, result publication | `step19_evaluation_engine.test.js` |

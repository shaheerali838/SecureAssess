# Multi-Tenancy Architecture & Core Isolation Rules

## 1. Hierarchy & Tenancy Model

SecureAssess operates on a hierarchical multi-tenant architecture designed to support diverse clients (e.g., Universities, Companies, Training Institutes) on a single platform while strictly guaranteeing data isolation:

```
SecureAssess (Platform Layer)
      │
      └── Organizations (Tenant Layer)
             │
             ├── Users (Recruiters, Examiners, Admins)
             ├── Candidates (Examinees / Applicants)
             ├── Question Bank (Categories, Tags, Questions)
             ├── Assessments (Quizzes, Interviews, Coding Tests)
             ├── Attempts (Session Logs, Streams)
             ├── Results (Scores, Evaluations)
             └── Reports (Aggregates, Audits, Certificates)
```

---

## 2. Platform-Level vs. Organization-Level Data Classification

Not every resource belongs to an organization. SecureAssess distinguishes between two clear scopes:

### A. Platform-Level Data (No `organizationId` required)
Global to the entire application, managed by Super Admins:
- **Roles** (`roles` collection / constants)
- **Permissions** (`permissions` collection / constants)
- **Subscription Plans** (`subscriptionPlans` catalog)
- **System Configuration** (global storage limits, email relays)
- **Platform Audit Logs** (administrative access history)

### B. Organization-Level Data (Mandatory `organizationId`)
Tenant-isolated, accessible only by users within that specific organization:
- **Users / Staff** (`User.organizationId`)
- **Candidates** (`Candidate.organizationId`)
- **Departments & Programs** (`Department.organizationId`, `Program.organizationId`)
- **Subjects** (`Subject.organizationId`)
- **Question Bank** (`Question.organizationId`, `QuestionCategory.organizationId`, `QuestionTag.organizationId`)
- **Assessments & Sections** (`Assessment.organizationId`, `AssessmentSection.organizationId`)
- **Assignments** (`AssessmentAssignment.organizationId`)
- **Attempts & Answers** (`Attempt.organizationId`, `Answer.organizationId`)
- **Results & Evaluations** (`Result.organizationId`, `Evaluation.organizationId`)
- **Reports & Certificates** (`Report.organizationId`, `Certificate.organizationId`)

---

## 3. The Core Rule: `organizationId` Ownership

Every organization-owned resource in the database **MUST** include an indexed `organizationId` reference:

```javascript
{
  _id: ObjectId("..."),
  organizationId: ObjectId("..."), // Mandatory tenant boundary
  title: "Full-Stack Engineer Assessment",
  // ... other fields
}
```

---

## 4. The Golden Security Rule: Never Trust `organizationId` from the Client

Client parameters like `?organizationId=ORG_B` or `{ "organizationId": "ORG_B" }` are **NEVER** trusted.

### Resolution Flow:
```
Client Request (Bearer JWT)
       ↓
JWT Verification (auth.middleware.js)
       ↓
Authenticated User (req.user)
       ↓
Verified organizationId (req.user.organizationId)
       ↓
Tenant Resolver (tenant.middleware.js -> req.organizationId)
       ↓
Authorized & Scoped Query
```

- Users can never switch tenants by spoofing request bodies or query parameters.
- Only verified Platform `SUPER_ADMIN` accounts can query cross-tenant or target a specific tenant explicitly for administrative oversight.

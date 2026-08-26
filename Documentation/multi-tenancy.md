# Multi-Tenancy Architecture & Core Isolation Rules

## 1. Hierarchy & Tenancy Model

SecureAssess operates on a hierarchical multi-tenant architecture designed to support diverse clients (e.g., Universities, Companies, Training Institutes) on a single platform while strictly guaranteeing data isolation:

```
SecureAssess (Platform Layer)
      │
      └── Organizations (Tenant Layer)
             │
             ├── UserMemberships (Role-bound staff & candidates)
             ├── Question Bank (Categories, Tags, Questions)
             ├── Assessments (Quizzes, Interviews, Coding Tests)
             ├── Attempts (Session Logs, Streams)
             ├── Results (Scores, Evaluations)
             └── Reports (Aggregates, Audits, Certificates)
```

---

## 2. Platform-Level vs. Organization-Level Data Classification

SecureAssess distinguishes between two clear authorization and data scopes:

### A. Platform-Level Data (No `organizationId` required)
Global to the entire application, managed by Platform Owners / Platform Admins:
- **Universal Users** (`users` collection with `platformRole`)
- **System Roles** (`roles` collection with `scope: "PLATFORM"`)
- **System Permissions** (`permissions` collection)
- **Subscription Plans** (`subscriptionPlans` catalog)
- **System Configuration** (global storage limits, email relays)
- **Platform Audit Logs** (administrative access history)

### B. Organization-Level Data (Mandatory `organizationId`)
Tenant-isolated, accessible only by users holding an active membership in that organization:
- **User Memberships** (`UserMembership.organizationId`)
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
Active Membership Validation (userMembership.model.js)
       ↓
Verified organizationId (req.organizationId)
       ↓
Role & Permission Verification (Role -> Permission[])
       ↓
Authorized & Tenant-Scoped Query
```

- Users can never switch tenants by spoofing request bodies or query parameters.
- Organization switching requires explicit verification against the database `UserMembership` collection.
- Platform Owners (`platformRole: "PLATFORM_OWNER"`) have platform-wide scope for system administration.

# 🛡️ SecureAssess — Enterprise Multi-Tenant Online Examination & Assessment SaaS Platform

SecureAssess is an all-in-one, enterprise-grade multi-tenant B2B SaaS platform for online examinations, timed assessments, AI-proctored integrity monitoring, and live technical evaluations. It empowers educational institutions (universities, colleges, bootcamps) and recruitment enterprises to organize academic structures, curate multi-type question banks, author immutable assessment snapshots, batch-assign candidate cohorts with secure access codes, monitor runtime attempts with authoritative server timers, autosave answers with tamper protection, and execute automated evaluation pipelines with grade calculation and publication controls.

---

## 🌟 Core System Capabilities (Steps 1–19 Completed)

```
                    ACADEMIC HIERARCHY
                (Dept → Program → Subject)
                           │
                           ▼
                     QUESTION BANK
             (MCQ, Coding, Essay, True/False)
                           │
                           ▼
                  ASSESSMENT BUILDER
             (7-Stage Lifecycle & Snapshots)
                           │
                           ▼
                  COHORT ASSIGNMENT
           (Candidate Groups & SA-XXXX-XXXX)
                           │
                           ▼
                   RUNTIME ATTEMPTS
         (Authoritative Timers & Shuffling)
                           │
                           ▼
                   ANSWER ENGINE
           (Debounced Autosave & Versioning)
                           │
                           ▼
                  EVALUATION ENGINE
         (Strategy Graders & Result Publishing)
```

1. **Decoupled Identity & Multi-Tenancy**: Universal `User` identity decoupled from tenant memberships (`UserMembership`) allowing a single person to belong to multiple organizations with distinct roles.
2. **Granular RBAC**: 121 fine-grained atomic permissions mapped across 7 system roles (`PLATFORM_OWNER`, `PLATFORM_ADMIN`, `ORGANIZATION_OWNER`, `ORGANIZATION_ADMIN`, `EXAMINER`, `PROCTOR`, `CANDIDATE`).
3. **Academic Hierarchy**: Complete academic and institutional taxonomy with Department, Program, and Subject models.
4. **Question Bank & Multi-Type Authoring**: Support for `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`, `CODING`, and `VIDEO_RESPONSE` with tag and category indexing.
5. **Assessment Builder & Immutable Snapshots**: 7-stage exam lifecycle (`DRAFT` $\to$ `READY_FOR_REVIEW` $\to$ `APPROVED` $\to$ `PUBLISHED` $\to$ `ACTIVE` $\to$ `CLOSED` $\to$ `ARCHIVED`) with immutable question snapshotting preventing post-publication exam tampering.
6. **Candidate Management & Access Codes**: Scalable candidate groups with normalized memberships, cryptographic access codes (`SA-XXXX-XXXX`), and candidate authorization boundary protection.
7. **Runtime Examination Engine**: Server-authoritative effective expiry (`expiresAt = MIN(...)`), duplicate active attempt prevention, candidate question/option shuffling with masked answers, and heartbeat tracking.
8. **Answer Autosaving & Concurrency**: Structured answer representation across all question types, debounced autosave with versioning, anti-tampering guards, and race-condition protected atomic submission.
9. **Automated Evaluation & Results**: Extensible strategy pattern graders, per-question `EvaluationItem` score breakdown, negative marking, pass/fail and grade calculation (`A+` to `F`), versioned regrading, and publication gates (`WITHHELD` vs `PUBLISHED`).

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Service** | Node.js (v18+ LTS, ES Modules), Express v5.2.1, Socket.io v4.8.3 |
| **Database & ODM** | MongoDB Atlas, Mongoose v9.9.4 |
| **Authentication & Tokens** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, HttpOnly Refresh Sessions |
| **Cloud Storage & Media** | Cloudinary SDK (Proctoring snapshots & evidence) |
| **Email & Communications** | Nodemailer (SMTP / Gmail Service) |
| **Frontend Web App** | React v19.2.8, Vite v8.2.2, React Router v7.18.2, Zustand v5.0.15, Tailwind CSS |

---

## 📂 Project Repository Structure

```
SecureAssess/
├── client/                     # Frontend Single-Page Application (React + Vite)
│   ├── src/
│   │   ├── components/         # Reusable UI component library (Buttons, Cards, Modals)
│   │   ├── pages/              # Portal views (Platform, Organization, Candidate)
│   │   ├── store/              # Zustand state stores
│   │   └── App.jsx             # Router and theme container
│   └── package.json
│
├── server/                     # Backend API & Real-time Server (Node.js + Express)
│   ├── src/
│   │   ├── config/             # Infrastructure (Database, Env, CORS, Logger, Storage)
│   │   ├── constants/          # Roles, 121 Permissions, Statuses, Types
│   │   ├── database/seeders/   # System RBAC and Platform Admin seeders
│   │   ├── middleware/         # Auth, Tenant, Role, Permission, RateLimit, Error
│   │   ├── modules/            # 19 Completed Domain Feature Modules (Clean Architecture)
│   │   │   ├── auth/           # Login, register, token rotation, sessions
│   │   │   ├── users/          # Universal identity & UserMemberships
│   │   │   ├── organizations/  # Tenant management & sub-route mounting
│   │   │   ├── departments/    # Academic departments
│   │   │   ├── programs/       # Degree & training programs
│   │   │   ├── subjects/       # Subject courses
│   │   │   ├── questionBank/   # Banks & multi-type questions
│   │   │   ├── questionTags/   # Question taxonomy tags
│   │   │   ├── assessments/    # Assessment configuration & 7-stage lifecycle
│   │   │   ├── assessmentSections/ # Exam sections
│   │   │   ├── assessmentQuestions/# Immutable question snapshots
│   │   │   ├── candidates/     # Candidate profiles
│   │   │   ├── candidateGroups/# Candidate cohorts & members
│   │   │   ├── assessmentAssignments/# Individual & batch exam assignments
│   │   │   ├── attempts/       # Examination runtime attempt engine
│   │   │   ├── attemptQuestions/# Runtime candidate question delivery
│   │   │   ├── answers/        # Answer autosaving & navigation policies
│   │   │   ├── evaluations/    # Evaluation engine & strategy graders
│   │   │   ├── evaluationItems/# Question-level score records
│   │   │   └── results/        # Final results & publication control
│   │   ├── utils/              # ApiResponse, ApiError, asyncHandler, Token helpers
│   │   ├── app.js              # Express app pipeline
│   │   └── server.js           # Server bootstrap & Socket.io listeners
│   └── tests/integration/      # End-to-end integration test suites (Steps 13-19)
│
├── docs/                       # Comprehensive Documentation Suite
│   ├── README.md               # Documentation guide & overview
│   ├── ARCHITECTURE.md         # System design, RBAC matrix, & runtime pipeline
│   ├── API.md                  # Complete REST API & Socket.io reference
│   ├── DATA_MODEL.md           # Database schemas, relationships, & indexes
│   ├── SETUP.md                # Environment configuration & installation guide
│   └── CONTRIBUTING.md         # Module contracts & code standards
│
├── SECUREASSESS_ARCHITECTURE_AND_STATUS.md # Architecture & implementation status
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **MongoDB**: MongoDB Atlas URI or local instance
- **Cloudinary**: Cloud name, API key, and secret (for media uploads)
- **SMTP**: Gmail or SMTP credentials (for email notifications)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/shaheerali838/SecureAssess.git
cd SecureAssess

# Install dependencies across workspaces
npm run install:all
```

### 3. Environment Configuration

Create `server/.env` with your credentials:

```env
NODE_ENV=development
PORT=7000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/SecureAssess
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@secureassess.com

ADMIN_FIRST_NAME=Shaheer
ADMIN_LAST_NAME=Ali
ADMIN_EMAIL=shaheer838838@gmail.com
ADMIN_PASSWORD=Admin@123
```

### 4. Database Seeding & Development Servers

```bash
# Seed 121 RBAC permissions, 7 system roles, and root Platform Owner
npm run db:seed --prefix server

# Start Backend API & Socket Server (Port 7000)
npm run dev --prefix server

# In another terminal, start Frontend Vite Dev Server (Port 5173)
npm run dev --prefix client
```

---

## 🧪 Integration Test Suites

Run the end-to-end integration tests to verify the completed examination pipeline:

```bash
node server/tests/integration/step13_hierarchy.test.js
node server/tests/integration/step14_question_bank.test.js
node server/tests/integration/step15_assessment_lifecycle.test.js
node server/tests/integration/step16_candidate_assignment.test.js
node server/tests/integration/step17_assessment_attempts.test.js
node server/tests/integration/step18_answer_management.test.js
node server/tests/integration/step19_evaluation_engine.test.js
```

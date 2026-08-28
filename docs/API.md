# SecureAssess — Complete API Reference

This document provides complete, exhaustive reference documentation for all REST API endpoints and real-time Socket.io events across all 19 completed modules in SecureAssess.

---

## 1. Global Conventions & Standards

- **Base API URL**: `http://localhost:7000/api/v1`
- **Content-Type**: `application/json`
- **Standard Envelope Response**:
  ```json
  {
    "statusCode": 200,
    "data": {},
    "message": "Operation completed",
    "success": true
  }
  ```
- **Standard Error Response**:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "success": false,
    "errors": ["Field error detail"]
  }
  ```
- **Authentication Headers**:
  - `Authorization`: `Bearer <jwt_access_token>`
  - `x-organization-id`: Tenant ObjectId for multi-tenant context resolution.

---

## 2. Authentication & Session APIs (`/api/v1/auth`)

| Method | Route | Description | Scope / Permissions |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Registers universal user identity. | Public |
| `POST` | `/api/v1/auth/login` | Authenticates credentials, creates session, and issues JWT tokens. | Public |
| `POST` | `/api/v1/auth/refresh-token` | Rotates refresh token and issues new access token. | Public |
| `POST` | `/api/v1/auth/logout` | Revokes active session and invalidates tokens. | `requireAuth` |
| `GET` | `/api/v1/auth/me` | Retrieves authenticated user profile & memberships. | `requireAuth` |

---

## 3. Organization Management APIs (`/api/v1/organizations`)

| Method | Route | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/organizations` | Creates tenant organization & assigns initial owner. | `organizations.create` (Platform) |
| `GET` | `/api/v1/organizations` | Lists all organizations (Platform) or user's tenant memberships. | `requireAuth` |
| `GET` | `/api/v1/organizations/:id` | Retrieves single organization tenant profile. | `organizations.view` / `organizations.profile.view` |
| `PATCH` | `/api/v1/organizations/:id` | Updates organization settings & branding. | `organizations.update` / `organizations.profile.update` |
| `PATCH` | `/api/v1/organizations/:id/status` | Suspends / activates organization lifecycle status. | `organizations.suspend` (Platform) |
| `DELETE` | `/api/v1/organizations/:id` | Soft deletes / deactivates organization. | `organizations.delete` (Platform) |
| `GET` | `/api/v1/organizations/:id/members` | Lists all members in the organization tenant. | `org_users.view` |
| `PATCH` | `/api/v1/organizations/:id/members/:mId/role` | Updates member role in organization. | `org_users.update` |
| `DELETE` | `/api/v1/organizations/:id/members/:mId` | Removes member from organization. | `org_users.remove` |

---

## 4. Academic Hierarchy APIs (`/departments`, `/programs`, `/subjects`)

Nested under `/api/v1/organizations/:organizationId`:

| Method | Route | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `POST` | `.../departments` | Creates academic department. | `departments.create` |
| `GET` | `.../departments` | Lists departments with program counts. | `departments.view` |
| `GET` | `.../departments/:id` | Retrieves single department details. | `departments.view` |
| `PATCH` | `.../departments/:id` | Updates department. | `departments.update` |
| `DELETE` | `.../departments/:id` | Deletes department. | `departments.delete` |
| `POST` | `.../programs` | Creates program within a department. | `programs.create` |
| `GET` | `.../programs` | Lists programs with department & subject counts. | `programs.view` |
| `GET` | `.../programs/:id` | Retrieves single program. | `programs.view` |
| `PATCH` | `.../programs/:id` | Updates program. | `programs.update` |
| `DELETE` | `.../programs/:id` | Deletes program. | `programs.delete` |
| `POST` | `.../subjects` | Creates subject linked to a program. | `subjects.create` |
| `GET` | `.../subjects` | Lists subjects with program details. | `subjects.view` |
| `GET` | `.../subjects/:id` | Retrieves single subject. | `subjects.view` |
| `PATCH` | `.../subjects/:id` | Updates subject. | `subjects.update` |
| `DELETE` | `.../subjects/:id` | Deletes subject. | `subjects.delete` |

---

## 5. Question Bank & Taxonomy APIs (`/question-banks`, `/question-tags`)

Nested under `/api/v1/organizations/:organizationId`:

| Method | Route | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `POST` | `.../question-banks` | Creates question bank for subject. | `question_banks.create` |
| `GET` | `.../question-banks` | Lists question banks with question counts. | `question_banks.view` |
| `GET` | `.../question-banks/:id` | Retrieves single question bank. | `question_banks.view` |
| `PATCH` | `.../question-banks/:id` | Updates question bank. | `question_banks.update` |
| `DELETE` | `.../question-banks/:id` | Deletes question bank. | `question_banks.delete` |
| `POST` | `.../question-banks/:id/questions` | Creates question (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `CODING`, `ESSAY`, `TRUE_FALSE`). | `questions.create` |
| `GET` | `.../question-banks/:id/questions` | Lists questions with pagination & type filter. | `questions.view` |
| `GET` | `.../question-banks/:id/questions/:qId` | Retrieves single question with options & answers. | `questions.view` |
| `PATCH` | `.../question-banks/:id/questions/:qId` | Updates question content & answers. | `questions.update` |
| `DELETE` | `.../question-banks/:id/questions/:qId` | Deletes question. | `questions.delete` |
| `POST` | `.../question-tags` | Creates question taxonomy tag. | `question_tags.create` |
| `GET` | `.../question-tags` | Lists question tags. | `question_tags.view` |

---

## 6. Assessment Builder & Lifecycle APIs (`/assessments`)

Nested under `/api/v1/organizations/:organizationId`:

| Method | Route | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `POST` | `.../assessments` | Creates assessment draft with duration & settings. | `assessments.create` |
| `GET` | `.../assessments` | Lists assessments with status filter. | `assessments.view` |
| `GET` | `.../assessments/:id` | Retrieves assessment with sections & questions. | `assessments.view` |
| `PATCH` | `.../assessments/:id` | Updates assessment (locked if `PUBLISHED`). | `assessments.update` |
| `PATCH` | `.../assessments/:id/status` | Advances assessment lifecycle (`READY_FOR_REVIEW`, `APPROVED`, `PUBLISHED`, `ACTIVE`, `CLOSED`, `ARCHIVED`). | `assessments.publish` / `assessments.update` |
| `POST` | `.../assessments/:id/sections` | Adds section to assessment. | `assessment_sections.create` |
| `PATCH` | `.../assessments/:id/sections/:secId` | Updates section title/order. | `assessment_sections.update` |
| `DELETE` | `.../assessments/:id/sections/:secId` | Deletes section. | `assessment_sections.delete` |
| `POST` | `.../assessments/:id/questions` | Adds question snapshot to assessment section (immutable copy). | `assessment_questions.add` |
| `DELETE` | `.../assessments/:id/questions/:aqId` | Removes question snapshot from section. | `assessment_questions.remove` |

---

## 7. Candidate Management & Groups APIs (`/candidates`, `/candidate-groups`)

Nested under `/api/v1/organizations/:organizationId`:

| Method | Route | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `POST` | `.../candidates` | Creates candidate profile with unique `candidateCode`. | `candidates.create` |
| `GET` | `.../candidates` | Lists candidate profiles with search & filters. | `candidates.view` |
| `GET` | `.../candidates/:id` | Retrieves single candidate details. | `candidates.view` |
| `PATCH` | `.../candidates/:id` | Updates candidate profile. | `candidates.update` |
| `DELETE` | `.../candidates/:id` | Deactivates candidate profile. | `candidates.delete` |
| `POST` | `.../candidate-groups` | Creates candidate group (cohort/batch). | `candidate_groups.create` |
| `GET` | `.../candidate-groups` | Lists groups with active member count. | `candidate_groups.view` |
| `POST` | `.../candidate-groups/:gId/members` | Adds candidate to group. | `candidate_groups.update` |
| `DELETE` | `.../candidate-groups/:gId/members/:cId`| Removes candidate from group. | `candidate_groups.update` |

---

## 8. Assessment Assignment & Access Code APIs

Nested under `/api/v1/organizations/:organizationId`:

| Method | Route | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `POST` | `.../assessments/:id/assignments` | Assigns published assessment to individual candidate IDs. | `assessment_assignments.create` |
| `POST` | `.../assessments/:id/assignments/group` | Batch assigns published assessment to entire candidate group. | `assessment_assignments.create` |
| `GET` | `.../assessments/:id/assignments` | Lists assignments for an assessment. | `assessment_assignments.view` |
| `GET` | `.../assessment-assignments/:id` | Retrieves assignment details. | `assessment_assignments.view` |
| `PATCH` | `.../assessment-assignments/:id/revoke` | Revokes candidate assignment (`REVOKED`). | `assessment_assignments.update` |
| `GET` | `.../candidate-portal/assignments` | Candidate views their own assigned exams. | `requireAuth` |
| `GET` | `.../candidate-portal/assessments/:id` | Candidate retrieves authorized exam metadata. | `requireAuth` |

---

## 9. Examination Runtime: Attempts & Answers APIs

Nested under `/api/v1/organizations/:organizationId/candidate`:

| Method | Route | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `.../assignments/:id/attempts` | Starts new attempt or resumes ongoing attempt (shuffling applied; server authoritative timer). | `requireAuth` |
| `GET` | `.../attempts/:id` | Retrieves attempt status, duration, and time remaining. | `requireAuth` |
| `GET` | `.../attempts/:id/questions` | Retrieves ordered candidate attempt questions (answers masked). | `requireAuth` |
| `GET` | `.../attempts/:id/questions/:qId` | Retrieves single question & marks `VISITED`. | `requireAuth` |
| `PUT` | `.../attempts/:id/questions/:qId/answer` | Autosaves / updates candidate answer with versioning & tamper protection. | `requireAuth` |
| `GET` | `.../attempts/:id/answers` | Retrieves candidate's current progress and saved answers. | `requireAuth` |
| `PATCH` | `.../attempts/:id/current-question` | Updates navigation state with back-navigation enforcement. | `requireAuth` |
| `POST` | `.../attempts/:id/heartbeat` | Heartbeat telemetry updating `lastActivityAt` & authoritative timer. | `requireAuth` |
| `POST` | `.../attempts/:id/submit` | Atomically locks and finalizes attempt (`SUBMITTED`). | `requireAuth` |

---

## 10. Evaluation & Automated Grading APIs

Nested under `/api/v1/organizations/:organizationId`:

| Method | Route | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `POST` | `.../attempts/:id/evaluate` | Executes strategy graders, creates `EvaluationItem`s, and calculates total score/points. | `evaluations.create` |
| `POST` | `.../attempts/:id/regrade` | Triggers regrading with version incrementing. | `evaluations.update` |
| `POST` | `.../attempts/:id/publish-result` | Publishes candidate result (`published: true`). | `results.publish` |
| `GET` | `.../attempts/:id/evaluation` | Examiner view: full breakdown with answer keys and feedback. | `evaluations.view` |
| `GET` | `.../candidate/attempts/:id/result` | Candidate view: returns final score, grade, pass/fail (withheld until published). | `requireAuth` |

---

## 11. Real-Time Socket.io Events

Socket.io server operates on `http://localhost:7000`.

### Client $\rightarrow$ Server Events
- `join-room`: `{ roomId, userId, role }` $\to$ Joins exam room and alerts proctor.
- `signal`: `{ roomId, signal, targetSocketId }` $\to$ WebRTC SDP / ICE exchange.
- `proctor-event`: `{ roomId, eventType, timestamp, metadata }` $\to$ Emits integrity anomaly (tab switch, blur).

### Server $\rightarrow$ Client Events
- `user-joined`: `{ userId, role, socketId }` $\to$ Peer joined session.
- `signal`: `{ signal, senderSocketId }` $\to$ Relayed WebRTC payload.
- `candidate-flagged`: `{ eventType, timestamp, metadata }` $\to$ Live proctor telemetry alert.

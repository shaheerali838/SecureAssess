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
| `GET` | `.../question-banks/:id` | Retrieves single question bank with subject & category details. | `question_banks.view` |
| `PATCH` | `.../question-banks/:id` | Updates question bank details. | `question_banks.update` |
| `DELETE` | `.../question-banks/:id` | Soft-deletes / archives question bank. | `question_banks.delete` |
| `POST` | `.../question-banks/:id/questions/import` | Bulk imports questions in batch (JSON/CSV). | `questions.create` |
| `GET` | `.../question-banks/:id/questions/export` | Exports questions to CSV or JSON format (`?format=CSV\|JSON`). | `questions.view` |
| `POST` | `.../question-banks/:id/questions` | Creates question (`SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`, `CODING`, `FILE_UPLOAD`). | `questions.create` |
| `GET` | `.../question-banks/:id/questions` | Lists questions inside bank with pagination & filters. | `questions.view` |
| `POST` | `.../questions` | Organization-level question creation with `questionBankId`. | `questions.create` |
| `GET` | `.../questions` | Organization-wide question search & multi-criteria filter (`?q=`, `?type=`, `?difficulty=`, `?subjectId=`, `?categoryId=`). | `questions.view` |
| `GET` | `.../questions/:id` | Retrieves single question with options, metadata, and versioning. | `questions.view` |
| `PATCH` | `.../questions/:id` | Updates question prompt & settings (increments version). | `questions.update` |
| `DELETE` | `.../questions/:id` | Archives question from active question bank. | `questions.delete` |
| `POST` | `.../question-tags` | Creates question taxonomy tag. | `question_tags.create` |
| `GET` | `.../question-tags` | Lists question tags. | `question_tags.view` |

---

## 6. Assessment Builder & Lifecycle APIs (`/assessments`)

Nested under `/api/v1/organizations/:organizationId`:

| Method | Route | Description | Permissions / Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `.../assessments` | Creates assessment with duration, security, scheduling & grading settings. | `assessments.create` |
| `GET` | `.../assessments` | Lists assessments with status & type filters. | `assessments.view` |
| `GET` | `.../assessments/:id` | Retrieves assessment with embedded sections & questions. | `assessments.view` |
| `PATCH` | `.../assessments/:id` | Updates assessment configuration (locked if `PUBLISHED`). | `assessments.update` |
| `DELETE` | `.../assessments/:id` | Archives assessment. | `assessments.delete` |
| `POST` | `.../assessments/:id/publish` | Validates pre-requisites and publishes assessment. | `assessments.publish` |
| `POST` | `.../assessments/:id/archive` | Moves assessment to `ARCHIVED` status. | `assessments.delete` |
| `POST` | `.../assessments/:id/duplicate` | Deep-clones assessment with own sections, questions, and snapshots. | `assessments.create` |
| `GET` | `.../assessments/:id/preview` | Generates candidate-facing assessment preview without creating attempts. | `assessments.view` |
| `POST` | `.../assessments/:id/assign` | Assigns candidates or candidate groups to assessment. | `assessments.update` / `assessments.create` |
| `GET` | `.../assessments/:id/assignments` | Lists candidate assignments for assessment. | `assessments.view` |
| `DELETE` | `.../assessments/:id/assignments/:candId` | Removes candidate assignment from assessment. | `assessments.update` / `assessments.delete` |
| `POST` | `.../assessments/:id/sections` | Adds section to assessment. | `assessments.update` |
| `GET` | `.../assessments/:id/sections` | Lists assessment sections. | `assessments.view` |
| `PATCH` | `.../assessments/:id/sections/reorder` | Reorders sections within assessment. | `assessments.update` |
| `PATCH` | `.../assessments/:id/sections/:secId` | Updates section title, instructions, or points. | `assessments.update` |
| `DELETE` | `.../assessments/:id/sections/:secId` | Deletes section from assessment. | `assessments.update` |
| `POST` | `.../assessments/:id/questions` | Adds question snapshot to assessment section (immutable copy). | `assessments.update` |
| `GET` | `.../assessments/:id/questions` | Lists assessment questions in section/assessment. | `assessments.view` |
| `PATCH` | `.../assessments/:id/questions/reorder` | Reorders question snapshots within assessment. | `assessments.update` |
| `PATCH` | `.../assessments/:id/questions/:qId` | Updates marks, negativeMarks, or isRequired flag on snapshot. | `assessments.update` |
| `DELETE` | `.../assessments/:id/questions/:qId` | Removes question snapshot from assessment section. | `assessments.update` |

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

Mounted under `/api/v1/attempts` (and `/api/v1/organizations/:orgId/candidate`):

| Method | Route | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/attempts/start` | Starts new attempt or resumes ongoing attempt (with question & option shuffling, server-authoritative timer). | `requireAuth` |
| `GET` | `/api/v1/attempts` | Lists attempts for authenticated candidate. | `requireAuth` |
| `GET` | `/api/v1/attempts/:id` | Retrieves attempt status, duration, and authoritative time remaining. | `requireAuth` |
| `GET` | `/api/v1/attempts/:id/questions` | Retrieves candidate-facing questions with point-in-time snapshots (correct answers sanitized). | `requireAuth` |
| `GET` | `/api/v1/attempts/:id/questions/:qId` | Retrieves single question, marks `VISITED`, returns current candidate saved answer. | `requireAuth` |
| `PUT` | `/api/v1/attempts/:id/questions/:qId/answer` | Autosaves / updates candidate answer with versioning and recalculates answered counts. | `requireAuth` |
| `PATCH` | `/api/v1/attempts/:id/questions/:qId/flag` | Flags / unflags question for review in candidate palette. | `requireAuth` |
| `POST` | `/api/v1/attempts/:id/heartbeat` | Heartbeat telemetry updating `lastActivityAt` and synchronizing remaining seconds. | `requireAuth` |
| `POST` | `/api/v1/attempts/:id/submit` | Atomically locks attempt (`SUBMITTED`), triggers objective scoring, and creates result. | `requireAuth` |
| `POST` | `/api/v1/attempts/:id/terminate` | Terminates active attempt due to proctoring policy or security violation. | `requireAuth` |

---

## 10. Evaluation & Grading Engine APIs (`/evaluations`, `/results`)

Mounted under `/api/v1/evaluations`:

| Method | Route | Description | Permissions / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/evaluations/pending` | Lists evaluations requiring manual review (`PARTIALLY_GRADED`). | `evaluations.view` |
| `GET` | `/api/v1/evaluations/:id` | Full examiner breakdown with objective scores, candidate answers, and rubric items. | `evaluations.view` |
| `POST` | `/api/v1/evaluations/:id/questions/:qId/grade` | Examiner manually awards marks and feedback for subjective/essay questions. | `evaluations.update` |
| `POST` | `/api/v1/evaluations/:id/finalize` | Finalizes evaluation (`COMPLETED`), marks pass/fail, and generates official `Result`. | `evaluations.update` |
| `POST` | `/api/v1/evaluations/:id/recalculate` | Re-evaluates attempt questions with version tracking and audit logs. | `evaluations.update` |
| `POST` | `/api/v1/evaluations/attempts/:id/evaluate` | Evaluates attempt against question snapshots and auto-graders. | `evaluations.create` |
| `POST` | `/api/v1/evaluations/attempts/:id/regrade` | Triggers attempt regrading. | `evaluations.update` |
| `POST` | `/api/v1/evaluations/attempts/:id/publish-result` | Publishes candidate result (`published: true`). | `results.publish` |

Mounted under `/api/v1/results`:

| Method | Route | Description | Permissions / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/results/my` | Candidate retrieves their own published results. | `requireAuth` |
| `GET` | `/api/v1/results/:id` | Retrieves result details (restricted to owner or staff). | `requireAuth` / `results.view` |
| `GET` | `/api/v1/results` | Staff lists all organization results with filters (`status`, `passed`). | `results.view` |
| `POST` | `/api/v1/results/:id/publish` | Staff publishes result to candidate portal. | `results.publish` |
| `GET` | `/api/v1/results/assessments/:assessmentId` | Staff lists results for a specific assessment. | `results.view` |

---

## 11. Proctoring & Exam Security Engine APIs (`/api/v1/proctoring`)

Mounted under `/api/v1/proctoring`:

| Method | Route | Description | Permissions / Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/proctoring/sessions/start` | Candidate activates monitoring session with camera/mic/screen parameters. | `requireAuth` |
| `GET` | `/api/v1/proctoring/sessions/:id` | Retrieves session telemetry, hardware toggles, risk score, and integrity status. | `requireAuth` / `proctoring.view` |
| `POST` | `/api/v1/proctoring/sessions/:id/end` | Gracefully closes proctoring session upon submission. | `requireAuth` |
| `POST` | `/api/v1/proctoring/events` | Ingests browser or AI vision event with server-authoritative risk scoring. | `requireAuth` |
| `GET` | `/api/v1/proctoring/sessions/:id/events` | Lists filtered/paginated proctoring events with severity and resolution. | `proctoring.view` |
| `GET` | `/api/v1/proctoring/sessions/:id/timeline` | Retrieves chronological audit timeline of candidate integrity events. | `proctoring.view` |
| `GET` | `/api/v1/proctoring/sessions/:id/evidence` | Lists media evidence snapshots, audio clips, and screen recordings. | `proctoring.view` |
| `GET` | `/api/v1/proctoring/evidence/:evidenceId` | Retrieves single evidence metadata record and secure storage key. | `proctoring.view` |
| `POST` | `/api/v1/proctoring/sessions/:id/warning` | Proctor dispatches real-time pop-up warning to candidate. | `proctoring.monitor` |
| `POST` | `/api/v1/proctoring/sessions/:id/pause` | Proctor pauses candidate exam session for manual identity verification. | `proctoring.monitor` |
| `POST` | `/api/v1/proctoring/sessions/:id/terminate` | Proctor terminates candidate session and attempt for confirmed cheating. | `proctoring.monitor` |
| `PATCH` | `/api/v1/proctoring/events/:id/review` | Proctor marks event reviewed (`CONFIRMED_VIOLATION` / `FALSE_POSITIVE`). | `proctoring.review` |

---

## 12. Notifications & Communication System APIs (`/api/v1/notifications`)

All endpoints require authentication (`requireAuth`) and are scoped to the authenticated user identity:

| Method | Route | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Lists paginated in-app notifications with unread/type filters. | `requireAuth` |
| `GET` | `/api/v1/notifications/unread-count` | Retrieves unread notification counter for frontend navigation badges. | `requireAuth` |
| `GET` | `/api/v1/notifications/preferences` | Retrieves user channel & category delivery preferences. | `requireAuth` |
| `PATCH` | `/api/v1/notifications/preferences` | Updates user notification preferences (email, inApp, push, sms). | `requireAuth` |
| `PATCH` | `/api/v1/notifications/:notificationId/read` | Marks single notification as read (`readAt: Date.now`). | `requireAuth` |
| `PATCH` | `/api/v1/notifications/read-all` | Marks all active user notifications as read. | `requireAuth` |
| `DELETE` | `/api/v1/notifications/:notificationId` | Soft deletes notification (`deletedAt: Date.now`). | `requireAuth` |
| `POST` | `/api/v1/notifications` | Creates notification manually (Admin / System dispatch). | `requireAuth` |

---

## 13. Reports & Analytics Engine APIs (`/api/v1/reports`)

Mounted under `/api/v1/reports`:

| Method | Route | Description | Permissions / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/dashboard` | Organization overview dashboard metrics (assessments, attempts, pass rate, proctored). | `reports.view` |
| `GET` | `/api/v1/reports/assessments/:id/summary` | Assessment summary analytics (pass rate, avg score, highest/lowest, completion time). | `reports.view` |
| `GET` | `/api/v1/reports/assessments/:id/questions` | Question / item discrimination breakdown (accuracy, difficulty rating, average marks). | `reports.view` |
| `GET` | `/api/v1/reports/assessments/:id/results` | Score distribution cohorts (`90-100`, `80-89`, `70-79`, `60-69`, `<60`) and result metrics. | `reports.view` |
| `GET` | `/api/v1/reports/assessments/:id/proctoring` | Assessment proctoring risk distribution, total violations, and terminations. | `reports.view` |
| `GET` | `/api/v1/reports/assessments/:id/export` | Instant CSV/PDF report download with candidate performance rows. | `reports.export` |
| `GET` | `/api/v1/reports/candidates/:id/performance` | Candidate performance profile (assigned, completed, pass rate, risk score). | `reports.view` |
| `GET` | `/api/v1/reports/candidate/performance` | Candidate self-service view: retrieves candidate's own academic progress. | `requireAuth` |
| `GET` | `/api/v1/reports/attempts/:id` | Attempt lifecycle, result scores, and proctoring telemetry audit. | `reports.view` |
| `GET` | `/api/v1/reports/proctoring` | Organization-wide proctoring analytics with risk levels and violation events. | `reports.view` |
| `POST` | `/api/v1/reports/export` | Generates and exports downloadable reports (JSON, CSV, PDF) with 7-day retention. | `reports.generate` |
| `GET` | `/api/v1/reports` | Lists generated reports with download links and retention status. | `reports.view` |
| `GET` | `/api/v1/reports/:id` | Retrieves single generated report metadata. | `reports.view` |
| `GET` | `/api/v1/reports/platform/overview` | Platform-wide totals (organizations, users, candidates, platform pass rate). | `requirePlatformPermission` |

---

## 14. Certificates & Credential Management APIs

Public Verification Endpoint (Unauthenticated & Rate Limited):

| Method | Route | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/public/certificates/verify/:verificationCode` | Verifies certificate authenticity via cryptographic verification code. Sanitizes private PII. | Public |

Organization-scoped endpoints nested under `/api/v1/organizations/:organizationId`:

| Method | Route | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `.../candidate/certificates` | Candidate self-service: list all issued certificates awarded to candidate. | `requireAuth` |
| `GET` | `.../certificates` | Organization administrator/examiner list of all certificates with status/date filters. | `certificates.view` |
| `POST` | `.../certificates` | Issues verifiable certificate for a passed assessment result (`resultId`). | `certificates.generate` |
| `GET` | `.../certificates/:id` | Retrieves single certificate credential details. | `certificates.view` |
| `GET` | `.../certificates/:id/download` | Retrieves authenticated certificate PDF download link. | `requireAuth` / `certificates.view` |
| `PATCH` | `.../certificates/:id/revoke` | Revokes certificate with audit reason and records revocation timestamp. | `certificates.revoke` |

---

## 15. Live Video Interviews & WebRTC APIs

Organization-scoped endpoints nested under `/api/v1/organizations/:organizationId`:

| Method | Route | Description | Permissions / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `.../candidate/interviews` | Candidate self-service: list all scheduled live interviews. | `requireAuth` |
| `GET` | `.../interviews` | Organization administrator/examiner list of all interviews with status/date filters. | `interviews.view` |
| `POST` | `.../interviews` | Schedules a new video/coding/panel interview with participants. | `interviews.create` |
| `GET` | `.../interviews/:id` | Detailed interview metadata, participants, and settings. | `requireAuth` / `interviews.view` |
| `POST` | `.../interviews/:id/join` | Authorizes participation, initializes live WebRTC session, and returns STUN ICE servers. | `requireAuth` |
| `POST` | `.../interviews/:id/end` | Concludes live interview session and marks status as `COMPLETED`. | `interviews.end` |
| `POST` | `.../interviews/:id/cancel` | Cancels interview with cancellation reason. | `interviews.update` |
| `POST` | `.../interviews/:id/participants` | Adds participant (Interviewer, Panelist, Observer) to interview. | `interviews.manage_participants` |
| `DELETE` | `.../interviews/:id/participants/:userId` | Removes participant from interview. | `interviews.manage_participants` |

---

## 16. Real-Time Socket.io & WebRTC Signaling

Socket.io server operates on `http://localhost:7000`.

### Interview WebRTC Signaling Namespace (`/interviews`)

Authentication: JWT token provided in `socket.handshake.auth.token` or `Authorization: Bearer <token>` header.

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `interview:join` | Client $\to$ Server | `{ interviewId, organizationId }` | Validates access, registers presence, and joins socket room. |
| `participant:joined` | Server $\to$ Client | `{ socketId, userId, name, role }` | Broadcast to existing room peers when a new participant connects. |
| `room:peers` | Server $\to$ Client | `{ peers: [...] }` | Sent to newly joined socket with list of active participants. |
| `webrtc:offer` | Bidirectional | `{ targetSocketId, sdp }` | Relays WebRTC SDP session description offer to target peer. |
| `webrtc:answer` | Bidirectional | `{ targetSocketId, sdp }` | Relays WebRTC SDP session description answer to target peer. |
| `webrtc:ice-candidate` | Bidirectional | `{ targetSocketId, candidate }` | Relays ICE candidate for NAT/firewall traversal. |
| `media:camera-changed` | Bidirectional | `{ enabled }` | Notifies room peers of camera toggle state. |
| `media:microphone-changed` | Bidirectional | `{ enabled }` | Notifies room peers of microphone toggle state. |
| `media:screen-share-started`| Bidirectional | `{}` | Emits screen sharing activation notice and records audit event. |
| `media:screen-share-stopped`| Bidirectional | `{}` | Emits screen sharing stop notice and records audit event. |
| `chat:message` | Bidirectional | `{ message }` | In-room real-time text chat message broadcast to room. |
| `participant:left` | Server $\to$ Client | `{ socketId, userId, name }` | Broadcast when a participant disconnects. |

### Proctoring Telemetry Signaling (`/`)
- `join-room`: `{ roomId, userId, role }` $\to$ Joins assessment exam room.
- `proctor-event`: `{ roomId, eventType, timestamp, metadata }` $\to$ Emits integrity anomaly (tab switch, blur).
- `candidate-flagged`: `{ eventType, timestamp, metadata }` $\to$ Live proctor telemetry alert.

---

## 17. Audit Logs & Security Activity APIs (`/api/v1/audit-logs`)

Mounted under `/api/v1/audit-logs`:

| Method | Route | Description | Permissions / Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/audit-logs` | Query, filter, and paginate immutable audit logs (`actorId`, `action`, `resource`, `status`, `requestId`, date range). | `audit_logs.view` / `PLATFORM_OWNER` |
| `GET` | `/api/v1/audit-logs/export` | Exports filtered audit logs to CSV/PDF format and self-audits the export transaction. | `audit_logs.export` / `PLATFORM_OWNER` |
| `GET` | `/api/v1/audit-logs/resource/:resource/:resourceId` | Forensic audit trail lookup for a specific domain resource (e.g. `ASSESSMENT`, `RESULT`). | `audit_logs.view` / `PLATFORM_OWNER` |
| `GET` | `/api/v1/audit-logs/user/:userId` | Retrieves comprehensive user-specific security activity and audit trail. | `audit_logs.view` / `PLATFORM_OWNER` |
| `GET` | `/api/v1/audit-logs/:auditLogId` | Retrieves single tamper-evident audit record with sanitized contextual metadata. | `audit_logs.view` / `PLATFORM_OWNER` |


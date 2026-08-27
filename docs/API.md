# SecureAssess — API Reference

This document provides reference documentation for all REST API endpoints and Socket.io real-time events implemented in SecureAssess.

---

## 1. Overview & Conventions

- **Base URL**: `http://localhost:7000/api/v1` (in local development)
- **Content-Type**: `application/json`
- **Response Format**: All endpoints return standard JSON envelopes using the `ApiResponse` format:
  ```json
  {
    "statusCode": 200,
    "data": {},
    "message": "Operation completed",
    "success": true
  }
  ```
- **Error Format**: Failed requests return standard `ApiError` envelopes:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "success": false,
    "errors": ["Specific validation error string"]
  }
  ```

### Authentication & Headers

| Header | Description | Required For |
| :--- | :--- | :--- |
| `Authorization` | Bearer JWT access token: `Bearer <jwt_access_token>` | All protected routes |
| `x-tenant-id` / `x-organization-id` | Optional header used by `PLATFORM_OWNER` or `SUPER_ADMIN` to target a specific tenant | Platform-level multi-tenant management |

---

## 2. Health & Monitoring

### `GET /api/v1/health`
Checks backend service health and database connectivity status.

- **Authentication**: None (Public)
- **Response Status**: `200 OK` (if DB connected), `503 Service Unavailable` (if DB disconnected)
- **Response Shape**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "application": "healthy",
      "database": "connected"
    },
    "message": "Platform health status",
    "success": true
  }
  ```

---

## 3. Authentication Endpoints (`/api/v1/auth`)

### `POST /api/v1/auth/register`
Registers a new user identity in the system.

- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "SecurePassword123!",
    "role": "CANDIDATE",
    "organizationId": "64c8d3f1a2b3c4d5e6f7a8b9"
  }
  ```
  *(Note: `name`, `email`, `password` are required. `password` must be at least 8 characters.)*
- **Response Status**: `201 Created`
- **Response Shape**:
  ```json
  {
    "statusCode": 201,
    "data": {
      "_id": "64c8d3f1a2b3c4d5e6f7a8ba",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "CANDIDATE",
      "organizationId": "64c8d3f1a2b3c4d5e6f7a8b9",
      "createdAt": "2026-08-27T10:00:00.000Z",
      "updatedAt": "2026-08-27T10:00:00.000Z"
    },
    "message": "User registered successfully",
    "success": true
  }
  ```

---

### `POST /api/v1/auth/login`
Authenticates user credentials and issues access and refresh tokens.

- **Authentication**: None (Public)
- **Request Body**:
  ```json
  {
    "email": "jane.doe@example.com",
    "password": "SecurePassword123!",
    "role": "CANDIDATE"
  }
  ```
  *(Note: `role` is optional; if provided, server validates that the user's role matches.)*
- **Response Status**: `200 OK`
- **Response Shape**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "user": {
        "_id": "64c8d3f1a2b3c4d5e6f7a8ba",
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "role": "CANDIDATE",
        "organizationId": "64c8d3f1a2b3c4d5e6f7a8b9"
      },
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    },
    "message": "Login successful",
    "success": true
  }
  ```

---

### `POST /api/v1/auth/refresh-token`
Issues a new JWT access token using a valid refresh token.

- **Authentication**: None (Requires valid refresh token in body)
- **Request Body**:
  ```json
  {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
  ```
- **Response Status**: `200 OK`
- **Response Shape**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
    },
    "message": "Token refreshed successfully",
    "success": true
  }
  ```

---

## 4. Users Endpoints (`/api/v1/users`)

All user endpoints require a valid Bearer token (`requireAuth`).

### `GET /api/v1/users/profile`
Retrieves the profile of the currently authenticated user.

- **Authentication**: Bearer JWT
- **Roles**: Any authenticated user
- **Response Status**: `200 OK`
- **Response Shape**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "_id": "64c8d3f1a2b3c4d5e6f7a8ba",
      "firstName": "Platform",
      "lastName": "Owner",
      "email": "owner@secureassess.com",
      "platformRole": "PLATFORM_OWNER",
      "status": "ACTIVE",
      "emailVerified": true,
      "profile": {
        "avatar": "",
        "phone": "",
        "bio": "",
        "timezone": "UTC"
      }
    },
    "message": "User profile retrieved successfully",
    "success": true
  }
  ```

---

### `GET /api/v1/users`
Lists paginated users belonging to the caller's organization.

- **Authentication**: Bearer JWT
- **Roles Allowed**: `SUPER_ADMIN`, `ADMIN`, `RECRUITER`
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10, max: 100)
- **Response Status**: `200 OK`
- **Response Shape**:
  ```json
  {
    "statusCode": 200,
    "data": {
      "items": [
        {
          "_id": "64c8d3f1a2b3c4d5e6f7a8ba",
          "firstName": "John",
          "lastName": "Recruiter",
          "email": "recruiter@example.com",
          "status": "ACTIVE"
        }
      ],
      "pagination": {
        "total": 1,
        "page": 1,
        "limit": 10,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPrevPage": false
      }
    },
    "message": "Users retrieved successfully",
    "success": true
  }
  ```

---

### `GET /api/v1/users/:id`
Retrieves user details by ID.

- **Authentication**: Bearer JWT
- **Response Status**: `200 OK`

---

### `PATCH /api/v1/users/:id`
Updates an existing user's attributes.

- **Authentication**: Bearer JWT
- **Request Body**:
  ```json
  {
    "firstName": "Jane",
    "lastName": "Smith",
    "profile": {
      "phone": "+1234567890",
      "timezone": "America/New_York"
    }
  }
  ```
- **Response Status**: `200 OK`

---

### `DELETE /api/v1/users/:id`
Deletes a user account.

- **Authentication**: Bearer JWT
- **Roles Allowed**: `SUPER_ADMIN`, `ADMIN`
- **Response Status**: `200 OK`

---

## 5. Assessments Endpoints (`/api/v1/assessments`)

All assessment endpoints require authentication (`requireAuth`) and active organization context (`requireTenant`).

### `POST /api/v1/assessments`
Creates a new assessment draft scoped to the authenticated user's organization.

- **Authentication**: Bearer JWT + Tenant Context
- **Roles Allowed**: `SUPER_ADMIN`, `ADMIN`, `RECRUITER`, `EXAMINER`
- **Request Body**:
  ```json
  {
    "title": "Full-Stack Node.js Developer Exam",
    "description": "Comprehensive evaluation covering Node.js, WebRTC, and MongoDB.",
    "type": "MCQ",
    "durationMinutes": 60,
    "passingPercentage": 70,
    "accessCode": "NODE2026",
    "proctoringSettings": {
      "enforceFullscreen": true,
      "trackTabSwitches": true,
      "maxTabSwitchesAllowed": 3,
      "enableWebcamMonitoring": true,
      "enableAudioDetection": false
    },
    "scheduledStart": "2026-09-01T09:00:00.000Z",
    "scheduledEnd": "2026-09-01T18:00:00.000Z"
  }
  ```
- **Response Status**: `201 Created`

---

### `GET /api/v1/assessments`
Lists paginated assessments scoped to the current tenant organization.

- **Authentication**: Bearer JWT + Tenant Context
- **Roles Allowed**: `SUPER_ADMIN`, `ADMIN`, `RECRUITER`, `EXAMINER`
- **Query Parameters**:
  - `page` (default: 1)
  - `limit` (default: 10)
- **Response Status**: `200 OK`

---

### `GET /api/v1/assessments/:id`
Retrieves single assessment details scoped to tenant.

- **Authentication**: Bearer JWT + Tenant Context
- **Response Status**: `200 OK`

---

### `PATCH /api/v1/assessments/:id`
Updates assessment settings or rules.

- **Authentication**: Bearer JWT + Tenant Context
- **Roles Allowed**: `SUPER_ADMIN`, `ADMIN`, `RECRUITER`, `EXAMINER`
- **Response Status**: `200 OK`

---

### `PATCH /api/v1/assessments/:id/publish`
Publishes an assessment, making it available for candidate attempts.

- **Authentication**: Bearer JWT + Tenant Context
- **Roles Allowed**: `SUPER_ADMIN`, `ADMIN`, `RECRUITER`, `EXAMINER`
- **Response Status**: `200 OK`
- **Response Data**: Returns updated assessment with `status: "PUBLISHED"`.

---

### `DELETE /api/v1/assessments/:id`
Removes an assessment record.

- **Authentication**: Bearer JWT + Tenant Context
- **Roles Allowed**: `SUPER_ADMIN`, `ADMIN`
- **Response Status**: `200 OK`

---

## 6. Foundation Route Barrels

The following module paths are mounted at `/api/v1` with baseline index routers for ongoing feature expansion:

| Route Prefix | Module | Current Status | Sample Response |
| :--- | :--- | :--- | :--- |
| `/api/v1/organizations` | Organizations | Model & Constants implemented; routes pending | `{ "success": true, "message": "organizations module initialized" }` |
| `/api/v1/questions` | Question Bank | Module router mounted | `{ "success": true, "message": "questionBank module initialized" }` |
| `/api/v1/attempts` | Exam Attempts | Module router mounted | `{ "success": true, "message": "attempts module initialized" }` |
| `/api/v1/proctoring` | Integrity / Proctoring | Module router mounted | `{ "success": true, "message": "proctoring module initialized" }` |
| `/api/v1/results` | Assessment Results | Module router mounted | `{ "success": true, "message": "results module initialized" }` |
| `/api/v1/platform` | Platform Management | Module router mounted | `{ "success": true, "message": "platform module initialized" }` |

---

## 7. Real-Time Socket.io Events

Socket.io runs on the same HTTP server instance (`http://localhost:7000`).

### Client $\rightarrow$ Server Events

| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `join-room` | `{ roomId: String, userId: String, role: String }` | Adds the socket client to the designated room. Broadcasts `user-joined` to other room members. |
| `signal` | `{ roomId: String, signal: Object, targetSocketId?: String }` | Exchanges WebRTC SDP offers/answers and ICE candidates. If `targetSocketId` is set, relays to that peer; otherwise broadcasts to room. |
| `proctor-event` | `{ roomId: String, eventType: String, timestamp: Number, metadata: Object }` | Reports an integrity violation (e.g., `TAB_SWITCH`, `FULLSCREEN_EXIT`). Broadcasts `candidate-flagged` to room. |

### Server $\rightarrow$ Client Events

| Event | Payload | Purpose |
| :--- | :--- | :--- |
| `user-joined` | `{ userId: String, role: String, socketId: String }` | Emitted to room participants when a new peer joins. |
| `signal` | `{ signal: Object, senderSocketId: String }` | Relays WebRTC signaling payload received from a peer. |
| `candidate-flagged` | `{ eventType: String, timestamp: Number, metadata: Object }` | Alerts proctors/recruiters in the room of a candidate integrity violation. |

# SecureAssess — Developer Guidelines & Code Conventions

This document outlines the coding standards, architectural rules, module contracts, and conventions strictly observed across the SecureAssess codebase.

---

## 1. Clean Architecture & The 9-File Module Contract

Every backend domain module located under [`server/src/modules/`](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/modules) must follow a single-responsibility 9-file structure:

```
src/modules/<moduleName>/
├── <moduleName>.model.js        # 1. Database schema and Mongoose model definition
├── <moduleName>.controller.js   # 2. HTTP controller (parses req, returns ApiResponse)
├── <moduleName>.service.js      # 3. Pure business logic and domain orchestration
├── <moduleName>.repository.js   # 4. Scoped database access methods (Mongoose queries)
├── <moduleName>.validator.js    # 5. Request payload & parameter validation schemas
├── <moduleName>.routes.js       # 6. Express router with middleware & guard bindings
├── <moduleName>.mapper.js       # 7. DTO transform layer (strips sensitive fields)
├── <moduleName>.constants.js    # 8. Module-level enums, error messages, and defaults
└── index.js                     # 9. Public module interface (barrel exports)
```

### Layer Rules & Boundaries

| Layer | Allowed Dependencies | Prohibited Behaviors |
| :--- | :--- | :--- |
| **Model** (`.model.js`) | `mongoose`, shared constants | No HTTP objects (`req`, `res`), no business logic. |
| **Controller** (`.controller.js`)| Service, Validator, `ApiResponse`, `ApiError`, `asyncHandler` | No direct Mongoose model queries; delegates immediately to Service. |
| **Service** (`.service.js`) | Repository, Mapper, EventBus, other domain services | Never accepts or returns HTTP `req`/`res` objects. |
| **Repository** (`.repository.js`)| Mongoose Model | Only executes database queries. Must apply tenant filtering for organization-owned data. |
| **Validator** (`.validator.js`) | Validation libraries (Joi / custom schemas) | Pure validation; returns `{ isValid, errors }` or throws `ApiError(400)`. |
| **Mapper** (`.mapper.js`) | Pure helper functions | Never mutates original database document; returns clean plain object (DTO). |
| **Routes** (`.routes.js`) | Controller, middleware (`requireAuth`, `requireRoles`, `requireTenant`) | No inline route logic; binds endpoints to controllers and guards. |

---

## 2. Multi-Tenancy & Security Rules

1. **The Golden Tenancy Rule**: Never trust `organizationId` sent in `req.body`, `req.query`, or client headers for tenant users. Always use `req.organizationId` derived securely from the authenticated token by `tenant.middleware.js`.
2. **Repository Tenant Scoping**: Every database query on an organization-owned entity must include `organizationId: req.organizationId`.
3. **Sensitive Field Sanitization**: Never return raw database documents containing `passwordHash`, `refreshTokenHash`, `tokenFamily`, or internal session metadata. Always run documents through `<moduleName>.mapper.js`.
4. **Asynchronous Handlers**: Always wrap route controller methods in `asyncHandler(async (req, res) => { ... })` to ensure rejected Promises are routed to the global `errorHandler` middleware.
5. **Standard Response Formatting**:
   - Success: `return res.status(200).json(new ApiResponse(200, data, "Message"));`
   - Error: `throw new ApiError(statusCode, "Message", errorsArray);`

---

## 3. Naming & File Conventions

- **Files & Folders**: `camelCase.type.js` (e.g. `assessment.model.js`, `userMembership.model.js`, `auth.service.js`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g. `USER_STATUSES`, `ASSESSMENT_TYPES`, `PERMISSIONS`).
- **Classes**: `PascalCase` (e.g. `AssessmentService`, `AuthRepository`, `ApiError`, `ApiResponse`).
- **Functions & Variables**: `camelCase` (e.g. `createAssessment`, `verifyAccessToken`, `userMembership`).
- **Database Collections**: Plural lowercase (e.g. `users`, `organizations`, `assessments`, `usermemberships`).

---

## 4. Documentation Gaps & Open Questions

The following gaps, inconsistencies, and open items were identified during codebase analysis:

### 1. Legacy Role Constants vs. RBAC System Roles
- **Observation**: `user.routes.js`, `assessment.routes.js`, and `tenant.middleware.js` reference legacy role constants (`ROLES.SUPER_ADMIN`, `ROLES.ADMIN`, `ROLES.RECRUITER`), whereas the newly implemented RBAC system (`constants/roles.js`, `constants/permissions.js`, `rbac.seeder.js`) defines 7 standardized system roles (`PLATFORM_OWNER`, `PLATFORM_ADMIN`, `ORGANIZATION_OWNER`, `ORGANIZATION_ADMIN`, `EXAMINER`, `PROCTOR`, `CANDIDATE`).
- **Action Required**: Refactor route guards in `user.routes.js` and `assessment.routes.js` to use granular permissions (`requirePermissions(PERMISSIONS.ASSESSMENTS_CREATE)`) or updated system roles (`ORGANIZATION_ADMIN`, `EXAMINER`).

### 2. User Authentication vs. Decoupled Identity Model
- **Observation**: `auth.service.js` and `auth.repository.js` directly store and query `role` and `organizationId` on the `User` document. However, the decoupled multi-tenant model in `user.model.js` and `userMembership.model.js` moves tenant-specific roles to `UserMembership` and reserves `platformRole` on the `User` entity.
- **Action Required**: Update `auth.service.js: login()` to query active `UserMembership` records upon authentication to resolve the user's role and permissions for a given tenant organization.

### 3. Client Frontend State
- **Observation**: The React frontend (`client/src/`) currently contains a minimal scaffolding (`App.jsx`) without UI pages, routing, or Zustand stores implemented yet.
- **Action Required**: Build frontend views for login, recruiter/examiner dashboard, candidate exam room, and WebRTC video interview interface.

### 4. Automated Testing Suite
- **Observation**: `server/package.json` specifies `"test": "echo \"Error: no test specified\" && exit 0"`. No automated unit or integration tests are currently present in `server/tests/`.
- **Action Required**: Implement Jest / Mocha / Supertest suites for authentication flows, RBAC permission checks, and tenant isolation queries.

### 5. Coturn & TURN Infrastructure Provisioning
- **Observation**: `Infrastructure/` contains placeholder documentation for Docker and TURN servers, but no active `turnserver.conf` or `docker-compose.yml` file is yet present.
- **Action Required**: Add Docker compose definitions for local coturn TURN relays and MongoDB test containers.

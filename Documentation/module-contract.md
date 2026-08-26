# 2.0 Backend Standard Module Contract & Responsibilities

Every backend module in SecureAssess follows a clean, single-responsibility architecture pattern. Below are the precise responsibilities of each file:

---

## File Responsibilities

### 1. `model` (`moduleName.model.js`)
- **Responsibility**: Database schema and Mongoose structure.
- **Example**: `assessment.model.js` defines fields, types, indexes, and relations (`organizationId`, `title`, `duration`, `rules`, etc.).
- **Rule**: Contains no HTTP logic or external service calls.

### 2. `controller` (`moduleName.controller.js`)
- **Responsibility**: HTTP layer only.
- **Handles**: `req`, `res`, HTTP status codes, and response envelopes (`ApiResponse` / `ApiError`).
- **Rule**: Contains no direct database queries or complex business logic. Delegates immediately to the service.

### 3. `service` (`moduleName.service.js`)
- **Responsibility**: Pure business logic and workflow orchestration.
- **Example**: Creating an assessment, validating tenant quotas, validating creator permissions, computing timer configuration, publishing.
- **Rule**: Never touches HTTP objects (`req`, `res`).

### 4. `repository` (`moduleName.repository.js`)
- **Responsibility**: Database access abstraction.
- **Methods**: `findById()`, `findByOrganization()`, `create()`, `update()`, `delete()`.
- **Rule**: Isolates Mongoose queries and ensures all organization queries are scoped by `organizationId`.

### 5. `validator` (`moduleName.validator.js`)
- **Responsibility**: Request payload and parameter validation.
- **Example**: `createAssessmentSchema`, `updateAssessmentSchema`, `publishAssessmentSchema`.
- **Rule**: Returns validation errors before requests reach the controller/service logic.

### 6. `routes` (`moduleName.routes.js`)
- **Responsibility**: Express endpoint definitions and middleware binding.
- **Example**:
  - `POST /assessments`
  - `GET /assessments`
  - `GET /assessments/:id`
  - `PATCH /assessments/:id`
  - `DELETE /assessments/:id`
- **Rule**: Connects paths to authentication, role guards, validation, and controllers.

### 7. `mapper` (`moduleName.mapper.js`)
- **Responsibility**: Transforms raw database models into safe API responses (DTOs).
- **Rule**: Guarantees that internal fields, password hashes, and security tokens are stripped before leaving the server.

### 8. `constants` (`moduleName.constants.js`)
- **Responsibility**: Module-specific constants and defaults.
- **Example**: `ASSESSMENT_STATUS`, `ASSESSMENT_DEFAULTS`.
- **Note**: Global system constants stay in `src/constants/`.

### 9. `index.js`
- **Responsibility**: Public module interface and entry point.
- **Exports**: Routes router, service, model, and repository for use by the application.

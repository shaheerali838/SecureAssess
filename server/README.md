# SecureAssess Backend

Enterprise modular REST API and WebRTC/Proctoring signaling backend service.

## Architecture

```
Backend/ (server/)
│
├── src/
│   ├── app.js                   # Express application and middleware pipeline
│   ├── server.js                # HTTP + Socket.io server entry point
│   ├── config/                  # DB, CORS, Env, Logger, Cloudinary, Email, Redis, Storage
│   ├── constants/               # Roles, Permissions, Assessment/Question/User types
│   ├── middleware/              # Auth, Roles, Permissions, Tenant, RateLimit, Error
│   ├── utils/                   # ApiError, ApiResponse, asyncHandler, pagination, token, etc.
│   ├── services/                # Email, Storage, Notification, PDF, Export
│   ├── modules/                 # Modular domain features (Auth, Assessments, Proctoring, etc.)
│   ├── routes/                  # API routing (v1 aggregator)
│   ├── jobs/                    # Scheduled background jobs
│   ├── events/                  # EventEmitter event bus and domain events
│   ├── database/                # Seeders & migrations
│   └── docs/                    # OpenAPI 3.0 specs
├── tests/                       # Unit, integration, e2e tests & fixtures
├── uploads/                     # Local file uploads
├── logs/                        # System logs
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

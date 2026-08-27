# SecureAssess — Local Environment & Setup Guide

This guide walks through setting up, configuring, seeding, and running the SecureAssess application for local development.

---

## 1. Prerequisites

Ensure the following tools are installed on your machine:
- **Node.js**: v18.0.0+ LTS
- **npm**: v9.0.0+ (or Yarn / pnpm)
- **MongoDB**: v6.0+ (Local MongoDB Community Server running at `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection string)
- **Git**: For version control

---

## 2. Step-by-Step Installation

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-username/secureassess.git
cd secureassess
```

### Step 2: Install Dependencies
Install all required packages for both the root workspace, server, and client:
```bash
# Using the root npm script
npm run install:all
```
*Alternatively, install individually:*
```bash
# Server dependencies
npm install --prefix server

# Client dependencies
npm install --prefix client
```

---

## 3. Environment Variable Configuration

Create a `.env` file in the `server/` directory:
```bash
# On Linux/macOS
cp server/.env.example server/.env

# On Windows PowerShell
Copy-Item server/.env.example server/.env
```

### Server Environment Variables Specification

The following variables are read via [`server/src/config/env.js`](file:///c:/Users/theun/OneDrive/Desktop/FYP/SecureAssess/server/src/config/env.js):

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | No | `development` | Application runtime environment (`development` / `production` / `test`). |
| `PORT` | No | `7000` | HTTP port on which the Express and Socket.io server listens. |
| `MONGODB_URI` / `MONGO_URI` | Yes | `mongodb://127.0.0.1:27017/secureassess` | MongoDB connection URI string. |
| `MONGODB_DB_NAME` | No | `secureassess` | Name of the MongoDB database. |
| `JWT_SECRET` | Yes | `default_jwt_secret_change_in_production` | Secret cryptographic key used to sign JWT access tokens. |
| `JWT_EXPIRES_IN` | No | `1d` | Lifetime duration of JWT access tokens (e.g. `15m`, `1d`). |
| `REFRESH_TOKEN_SECRET` | Yes | `default_refresh_secret` | Secret key used to sign JWT refresh tokens. |
| `REFRESH_TOKEN_EXPIRES_IN` | No | `7d` | Lifetime duration of JWT refresh tokens (e.g. `7d`, `30d`). |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin URL for client requests (supports comma-separated list or `*`). |
| `STORAGE_PROVIDER` | No | `local` | Media storage provider engine (`local`, `s3`, `cloudinary`). |
| `CLOUDINARY_CLOUD_NAME`| Conditional | `""` | Cloudinary cloud identifier (if using Cloudinary). |
| `CLOUDINARY_API_KEY` | Conditional | `""` | Cloudinary API Key. |
| `CLOUDINARY_API_SECRET`| Conditional | `""` | Cloudinary API Secret. |
| `SMTP_HOST` | No | `smtp.mailtrap.io` | SMTP mail server hostname for transactional notifications. |
| `SMTP_PORT` | No | `587` | SMTP mail server port (e.g. `587`, `465`, `25`). |
| `SMTP_USER` | No | `""` | SMTP authentication username. |
| `SMTP_PASS` / `SMTP_PASSWORD` | No | `""` | SMTP authentication password. |
| `EMAIL_FROM` | No | `noreply@secureassess.com` | Default "From" email address for outbound emails. |
| `ADMIN_FIRST_NAME` | No | `Platform` | First name assigned to the initial root Platform Owner during database seeding. |
| `ADMIN_LAST_NAME` | No | `Owner` | Last name assigned to the initial root Platform Owner. |
| `ADMIN_EMAIL` | No | `owner@secureassess.com` | Email address for the root Platform Owner account created by seeder. |
| `ADMIN_PASSWORD` | No | `AdminSecure#2026` | Initial password assigned to the root Platform Owner. |
| `ADMIN_PHONE` | No | `""` | Contact phone number for the root Platform Owner. |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL for caching and distributed locks. |

---

## 4. Database Seeding & Initialization

Before starting the server for the first time, run the database seeders to populate permissions, system roles, and the root platform administrator.

```bash
cd server
npm run db:seed
```

### What the Seeder Does:
1. **`rbac.seeder.js`**:
   - Upserts all **113 granular permissions** into the `permissions` collection.
   - Upserts **7 built-in system roles** (`PLATFORM_OWNER`, `PLATFORM_ADMIN`, `ORGANIZATION_OWNER`, `ORGANIZATION_ADMIN`, `EXAMINER`, `PROCTOR`, `CANDIDATE`).
   - Maps and binds permission ObjectIds into each role's `permissions` array.
2. **`admin.seeder.js`**:
   - Checks for the existence of `ADMIN_EMAIL` (`owner@secureassess.com`).
   - If not found, creates the user with `platformRole: "PLATFORM_OWNER"` and hashes `ADMIN_PASSWORD`.
   - If already existing, synchronizes the credentials and verifies account status.

---

## 5. Running the Application

### Development Mode

Run both the frontend and backend servers concurrently or in separate terminals:

```bash
# Option A: Start from root
npm run dev:server    # Runs server with nodemon on http://localhost:7000
npm run dev:client    # Runs client with Vite on http://localhost:5173

# Option B: Run directly in subdirectories
# Terminal 1 (Backend)
cd server
npm run dev

# Terminal 2 (Frontend)
cd client
npm run dev
```

### Production Mode

```bash
# 1. Build client bundle
npm run build:client

# 2. Start server in production mode
cd server
NODE_ENV=production npm start
```

---

## 6. Verification & Health Check

1. Verify server health by navigating to:
   ```
   GET http://localhost:7000/api/v1/health
   ```
   **Expected Response**:
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

2. Test root admin login:
   ```bash
   curl -X POST http://localhost:7000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"owner@secureassess.com","password":"AdminSecure#2026"}'
   ```

---

## 7. Troubleshooting

- **Database Connection Error (`MongooseServerSelectionError`)**:
  - Verify MongoDB is running locally: `mongosh` or `service mongod status`.
  - Check `MONGODB_URI` in `server/.env`.
- **CORS Error on Frontend**:
  - Verify `CORS_ORIGIN` in `server/.env` matches the frontend Vite URL (`http://localhost:5173`).
- **Fail-Fast Server Abort**:
  - The server explicitly aborts execution if MongoDB fails to connect (`server/src/server.js: startServer()`). Fix the database connection before re-running.

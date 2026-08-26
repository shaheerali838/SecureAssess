# SecureAssess

An all-in-one platform for live video interviews and online assessments, built to reduce AI-assisted cheating in remote hiring and testing. SecureAssess combines real-time video calling, quiz/assessment hosting, and integrity monitoring into a single MERN-stack application — no more juggling separate tools for interviews, quizzes, and proctoring.

## Why SecureAssess

Remote assessments and interviews are increasingly undermined by AI tools — invisible screen overlays that feed candidates live answers, browser extensions that auto-solve MCQs, and other forms of undetected assistance. SecureAssess is built to close that gap by combining the interview/assessment experience with real-time integrity signals, so recruiters get a single, trustworthy picture of a candidate's performance.

## Features

- **Live video interviews** — peer-to-peer WebRTC video calls, no third-party conferencing tool required
- **Built-in assessments** — recruiters build MCQ (and future coding/short-answer) quizzes directly in the platform
- **Timed sessions** — configurable time limits with auto-submit
- **Integrity monitoring** — real-time detection of tab switches, fullscreen exits, copy/paste attempts, and other flagged behaviors during a session
- **Recruiter dashboard** — view candidate sessions, scores, and integrity flags in one place
- **Session recording** _(optional)_ — webcam snapshots and call recordings stored securely for later review
- **Role-based access** — separate recruiter/admin and candidate experiences

> **Current status:** in active development. See [Roadmap](#roadmap) for what's built and what's planned.

## Tech stack

| Layer           | Technology                                               |
| --------------- | -------------------------------------------------------- |
| Frontend        | React (Vite), React Router, Zustand                      |
| Backend         | Node.js, Express, Socket.io                              |
| Database        | MongoDB (Mongoose)                                       |
| Real-time video | WebRTC (`simple-peer`/`PeerJS`), `coturn` for TURN relay |
| Auth            | JWT (access + refresh tokens)                            |
| File storage    | AWS S3 or S3-compatible (Cloudflare R2 / Backblaze B2)   |
| Email           | SendGrid / Resend                                        |

## Architecture overview

- The **client** (React) handles the interview room UI, quiz-taking UI, and recruiter dashboard.
- The **server** (Express + Socket.io) handles REST API calls (auth, assessments, results) and WebRTC signaling (offer/answer/ICE candidate exchange between peers).
- Video/audio streams flow **directly between browsers** via WebRTC — the server never proxies media, only signaling. A TURN server is used as a fallback relay when direct peer connections fail due to NAT/firewall restrictions.
- **MongoDB** stores users, assessments, questions, session data, and integrity event logs.
- **Cloud storage** holds session recordings and webcam snapshots, accessed via signed, expiring URLs.

## Prerequisites

- Node.js LTS (v18+)
- npm or yarn
- A MongoDB Atlas account (or local MongoDB instance)
- (For production) a TURN server and an S3-compatible storage bucket

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/secureassess.git
cd secureassess
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file in `/server`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
S3_BUCKET=your_bucket_name
S3_ACCESS_KEY=your_access_key
S3_SECRET_KEY=your_secret_key
TURN_SERVER_URL=turn:your-turn-server:3478
TURN_USERNAME=your_turn_username
TURN_CREDENTIAL=your_turn_credential
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the frontend

```bash
cd ../client
npm install
```

Create a `.env` file in `/client`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

The app should now be running at `http://localhost:5173`, connected to the API at `http://localhost:5000`.

## Project structure

```
secureassess/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/          # Zustand state
│   │   └── App.jsx
│   └── package.json
├── server/                # Express backend
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── sockets/            # Socket.io signaling logic
│   └── index.js
└── README.md
```

## Core data models

- **User** — recruiter/candidate accounts, role-based
- **Assessment** — quiz metadata, question references, time limits
- **Question** — MCQ (and future question types), options, correct answers, point values
- **AssessmentSession** — a candidate's attempt: answers, score, timestamps, status
- **ProctoringEvent** — timestamped integrity flags tied to a session (tab switch, fullscreen exit, etc.)

## Roadmap

SecureAssess is being built in phases:

1. ✅ Project setup and authentication
2. 🔲 Assessment engine (quiz builder, taking, scoring)
3. 🔲 Live video interviews (WebRTC + signaling)
4. 🔲 Integrity/anti-cheat layer
5. 🔲 Recruiter dashboards and reporting
6. 🔲 Security hardening, compliance, and deployment
7. 🔲 Panel interview support (SFU-based, multi-participant calls)

_(Check off items as they're completed — this list should stay in sync with actual progress.)_

## Security and privacy notes

- Candidates must be clearly informed before any webcam access, recording, or activity monitoring begins — this is a legal requirement in most jurisdictions, not just good practice.
- Recordings and snapshots are stored with signed, expiring URLs — never public buckets.
- Passwords are hashed with bcrypt; JWTs are short-lived with refresh token rotation.
- A privacy policy and terms of service reviewed by a legal professional are strongly recommended before onboarding real candidates.

## Contributing

This project is currently in early solo development. Contribution guidelines will be added once the core MVP is stable.

## License

_(Add your chosen license here — e.g., MIT, Apache 2.0, or "All rights reserved" if proprietary.)_

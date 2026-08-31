# SecureAssess — Production Deployment & Infrastructure Guide

## 1. Production Topology & Architecture

```
                         INTERNET
                            │
                       HTTPS / TLS
                            │
                     REVERSE PROXY / ALB
                            │
             ┌──────────────┴──────────────┐
             ↓                             ↓
        React SPA                    API Cluster
       (Vite Build)                 (Node.js Cluster)
                                           │
                   ┌───────────────────────┼────────────────────────┐
                   ↓                       ↓                        ↓
            MongoDB Atlas             Redis Cluster            Private Storage
           (Replica Set)              (Distributed Lock)      (Signed URLs / S3)
                   │                       │                        │
                   └───────────────────────┼────────────────────────┘
                                           ↓
                                  Background Workers
                                           │
                                   External Gateways
                                  ├── SMTP / Email
                                  ├── Billing Provider
                                  └── WebRTC / TURN
```

## 2. Environment Variables & Secret Configuration

Production secrets must be provided via secure environment managers (e.g. AWS Secrets Manager, HashiCorp Vault, Kubernetes Secrets).

| Variable | Description | Example / Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Target Runtime Environment | `production` |
| `PORT` | API Server Listen Port | `7000` |
| `MONGODB_URI` | Authenticated Replica Set URI | `mongodb+srv://user:pass@cluster.mongodb.net/secureassess?retryWrites=true&w=majority` |
| `JWT_SECRET` | HS256 High-Entropy Secret Key | Min 64 characters random string |
| `REFRESH_TOKEN_SECRET` | Token Rotation Secret Key | Min 64 characters random string |
| `CORS_ORIGIN` | Strict Frontend Origin Allowlist | `https://app.secureassess.com,https://admin.secureassess.com` |
| `STORAGE_PROVIDER` | Private Object Storage Engine | `s3` or `local` |
| `BILLING_PROVIDER` | Payment Gateway Provider | `STRIPE` or `MOCK` |
| `BILLING_SECRET_KEY` | Payment API Secret Key | Server-only secret |
| `BILLING_WEBHOOK_SECRET` | Webhook Signature Verification | Server-only secret |

## 3. Zero-Downtime Deployment & Rollback Strategy

1. **Pre-Deployment**: Run automated test suite (`npm run test`) and compile SPA bundle (`npm run build`).
2. **Rolling Update**: Deploy API container instances gradually behind the load balancer with readiness probe verification (`GET /health/ready`).
3. **Graceful Termination**: In-flight HTTP requests complete before existing instances are stopped.
4. **Rollback**: If health checks fail or error rates spike > 1%, revert traffic immediately to the previous container image version ($N-1$).

# SecureAssess — Operations & Disaster Recovery Manual

## 1. Observability & Health Probes

- **Liveness Probe**: `GET /health/live` (or `GET /api/v1/health/live`)
  - Validates process responsiveness and uptime.
- **Readiness Probe**: `GET /health/ready` (or `GET /api/v1/health/ready`)
  - Validates MongoDB connection and internal subsystems before receiving traffic.

## 2. Background Workers & Distributed Locks

- **Distributed Locks**: Uses MongoDB `DistributedLock` collection with TTL indexing to coordinate scheduled jobs across multi-instance clusters.
- **Attempt Expiry Worker**: Scans and safely transitions overdue `IN_PROGRESS` attempts to `EXPIRED`.
- **Subscription Reconciliation**: Synchronizes provider billing states without duplicating subscriptions.

## 3. Disaster Recovery Objectives

- **Recovery Point Objective (RPO)**: < 15 minutes (via automated MongoDB continuous snapshots).
- **Recovery Time Objective (RTO)**: < 30 minutes (via multi-region replica failover and container redeployment).
- **Automated Backups**: Continuous point-in-time recovery (PITR) enabled on primary database clusters with automated daily offsite cold-storage replication.

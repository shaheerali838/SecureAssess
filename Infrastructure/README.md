# Infrastructure

This directory contains configuration files for containerization, cloud deployment, and network relays.

## Suggested Contents
- `docker-compose.yml`: Multi-container setup for local development (MongoDB, coturn TURN server, app services).
- `Dockerfile.server` & `Dockerfile.client`: Production container definitions.
- `turnserver.conf`: Configuration for WebRTC coturn relay server.

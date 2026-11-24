Nexus — Real-Time Collaborative Project & Incident Management SaaS

Nexus is a multi-tenant project and incident management platform designed to help teams organize projects, manage issues, collaborate in real time, and monitor Service Level Agreement (SLA) deadlines.

Key Features

- Authentication: User registration and login using JWT authentication.
- Multi-Tenancy: Organizations with separate memberships and data.
- Role-Based Access Control (RBAC): ADMIN, MANAGER, and MEMBER roles.
- Project Management: Create and manage projects within organizations.
- Issue Management: Create, update, and track issues with different priorities and statuses.
- Real-Time Issue Updates: Socket.IO broadcasts issue updates to connected members of an organization.
- Background Processing: Redis and BullMQ process delayed background jobs.
- Basic SLA Processing: BullMQ schedules priority-based SLA checks, and the worker logs alerts for unfinished issues.
- Database: PostgreSQL with Prisma ORM.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL |
| ORM | Prisma |
| Real-Time Communication | Socket.IO |
| Background Jobs | BullMQ |
| Job Queue Storage | Redis |
| Validation | Zod |
| Authentication | JWT |
| Containers | Docker Compose |
| Shared Package | TypeScript shared types |

Project Structure

nexus-saas/
├── apps/
│   ├── api/             # Express backend
│   ├── web/             # Next.js frontend
│   └── worker/          # Background job worker
├── packages/
│   └── shared/          # Shared code
├── docker-compose.yml
├── package.json
├── package-lock.json
├── .gitignore
└── README.md

Architecture Overview

Nexus uses a modular application architecture.

1. The Next.js frontend communicates with the Express API.
2. The API authenticates users and applies organization-level authorization.
3. Prisma communicates with PostgreSQL.
4. Socket.IO broadcasts issue updates to authorized organization members.
5. BullMQ schedules delayed SLA jobs in Redis.
6. The background worker processes SLA jobs and checks issue status in PostgreSQL.

Installation and Setup

Prerequisites

- Node.js and npm
- Docker Desktop
- Git

1. Clone the repository

git clone YOUR_GITHUB_REPOSITORY_URL
cd nexus-saas

2. Install dependencies

npm install

3. Configure environment variables


Create the required environment files:

- .env (project root)
- apps/api/.env
- apps/worker/.env

Configure the following variables:

Root .env:
- POSTGRES_PASSWORD

API (.env):
- DATABASE_URL
- JWT_SECRET

Worker (.env):
- DATABASE_URL

Never commit environment files or credentials to GitHub

4. Start PostgreSQL and Redis

docker compose up -d

The provided Docker Compose configuration starts PostgreSQL and Redis.

5. Start the applications.

Run each application in a separate terminal from the project root.

Terminal 1 — Backend API

npm.cmd run dev --workspace=api

Terminal 2 — Frontend

npm.cmd run dev --workspace=web

Terminal 3 — Background Worker

npm.cmd run dev --workspace=worker

The frontend runs on "http://localhost:3000" and the API runs on "http://localhost:5000".

Ensure the PostgreSQL database and Prisma migrations are configured before starting the application.

Real-Time Collaboration

Nexus uses Socket.IO for real-time communication.

- Authenticated users connect to the real-time server.
- Organization membership is verified before joining an organization room.
- Issue updates are broadcast to connected members of that organization.
- Connected dashboards update without requiring a page refresh.

SLA Monitoring

Nexus uses BullMQ and Redis to schedule delayed SLA checks.

Demonstration SLA thresholds:

Priority| SLA Threshold
URGENT| 1 minute
HIGH| 5 minutes
MEDIUM| 30 minutes
LOW| 60 minutes

When a scheduled job runs, the worker checks the issue in PostgreSQL.

- Unfinished issues generate an SLA alert in the worker logs.
- Issues already marked DONE are skipped.

These thresholds are demonstration settings, not production SLA commitments.

Issue Statuses

- BACKLOG
- TODO
- IN_PROGRESS
- IN_REVIEW
- DONE

Issue Priorities

- LOW
- MEDIUM
- HIGH
- URGENT

Security

- JWT-based authentication.
- Organization membership verification.
- Role-based route authorization.
- Environment variables excluded from version control.
- Never commit environment files or credentials to GitHub.

Project Status

Core authentication, organization management, project and issue management, role enforcement, real-time issue update handling, and basic SLA background processing have been implemented.

Real-time synchronization across multiple browser sessions and complete application workflows are pending end-to-end verification.

Future Improvements

- Persistent SLA breach records and notification history.
- Real-time synchronization testing across multiple browser sessions.
- Automated token refresh.
- Advanced analytics and reporting.
- Production deployment and monitoring.
- Automated testing.

License

This project was developed as a software engineering project.
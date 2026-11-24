Nexus SaaS – System Architecture

1. Overview

Nexus is a multi-tenant SaaS project management platform designed to help organizations manage projects, team members, issues, and collaboration.

2. Technology Stack

- Frontend: Next.js, React, TypeScript
- Backend: Node.js, Express.js
- Database: PostgreSQL
- ORM: Prisma
- Background Job Queue: BullMQ with Redis
- Authentication: JWT
- Containerization: Docker Compose for PostgreSQL and Redis services

3. System Components

| Component | Responsibility |
| Frontend | Next.js user interface and client-side interactions |
| Backend API | Express.js REST APIs, authentication, validation, and business logic |
| Worker | Processes delayed SLA-check jobs using BullMQ |
| PostgreSQL | Persistent storage for users, organizations, projects, issues, and comments |
| Redis | Stores and manages BullMQ background jobs |

4. Database Architecture

The database currently contains six primary models:

1. User
2. Organization
3. Membership
4. Project
5. Issue
6. Comment

Entity Relationships
The database relationships are illustrated in `er-diagram.png`.

erDiagram
    User ||--o{ Membership : joins
    Organization ||--o{ Membership : contains
    Organization ||--o{ Project : owns
    Project ||--o{ Issue : contains
    User o|--o{ Issue : assigned
    User ||--o{ Comment : writes
    Issue ||--o{ Comment : receives

    User {
        uuid id PK
        string name
        string email UK
        string passwordHash
    }

    Organization {
        uuid id PK
        string name
        string slug UK
    }

    Membership {
        uuid id PK
        uuid userId FK
        uuid organizationId FK
        OrganizationRole role
    }

    Project {
        uuid id PK
        string name
        uuid organizationId FK
    }

    Issue {
        uuid id PK
        string title
        IssueStatus status
        IssuePriority priority
        uuid projectId FK
        uuid assigneeId FK
    }

    Comment {
        uuid id PK
        string content
        uuid issueId FK
        uuid userId FK
    }

5. Multi-Tenant Architecture

Each organization has its own membership records and projects.

Users can belong to multiple organizations with different roles in each organization.

Organization-specific access is enforced through backend membership checks and role-based authorization middleware.

Projects belong to organizations, and issues belong to projects. Access to these resources is validated against the organization associated with the request.

6. Authentication and Authorization

JWT-based authentication identifies users.

Organization membership determines the user's organizational role:

- ADMIN
- MANAGER
- MEMBER

Role-based permissions are enforced through backend authorization middleware.

7. Real-Time Communication

The platform uses Socket.IO for real-time issue updates.

Communication flow:

1. The frontend connects to the backend Socket.IO server.
2. The client sends an organization join request with its JWT token.
3. The backend verifies the JWT and checks organization membership.
4. Authorized clients join the corresponding organization room.
5. When an issue is updated, the backend broadcasts an `issue:updated` event to that organization's room.
6. Connected frontend clients receive the event and update the corresponding issue in their interface.

The WebSocket connection and event flow are illustrated in `websocket-flow.png`.

Note: Real-time synchronization across multiple browser sessions still requires end-to-end testing.

8. Background Processing

The platform uses BullMQ and Redis to schedule delayed SLA-check jobs when new issues are created.

Configured SLA delays depend on issue priority:

- URGENT: 1 minute
- HIGH: 5 minutes
- MEDIUM: 30 minutes
- LOW: 60 minutes

The worker retrieves the issue from PostgreSQL when a job is processed.

- If the issue does not exist, the job is skipped.
- If the issue status is DONE, the SLA check is skipped.
- Otherwise, the worker logs an SLA alert to the console.

Note: Email notifications, in-app alerts, and persistent SLA breach history are not currently implemented.
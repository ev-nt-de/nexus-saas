Nexus SaaS – Role-Based Access Control (RBAC)

1. Overview

Nexus implements Role-Based Access Control (RBAC) to manage permissions within organizations.

Each user receives an organizational role through the Membership model.

2. Available Roles

Role| Description
ADMIN| Organization administrator
MANAGER| Project and team management
MEMBER| General organization member

3. Permission Matrix

| Action | ADMIN | MANAGER | MEMBER |
|---|---|---|---|
| Create Project | YES | YES | NO |
| View Projects | YES | YES | YES |
| Update Project | YES | YES | NO |
| Delete Project | YES | YES | NO |
| Create Issue | YES | YES | NO |
| View Issues | YES | YES | YES |
| Update Issue | YES | YES | YES |
| Delete Issue | YES | YES | NO |
| Create Comment | YES | YES | YES |
| View Comments | YES | YES | YES |
| Delete Own Comment | YES | YES | YES |
| Delete Others' Comments | YES | YES | NO |
| Add Organization Member | YES | NO | NO |

4. Authorization Implementation

The backend uses authentication middleware and role-based authorization middleware.

Authentication

The authenticate middleware validates the user's JWT.

Role Authorization

The requireRole middleware:

1. Retrieves the authenticated user's ID.
2. Reads the organization ID from the request parameters.
3. Checks the user's organization membership.
4. Checks whether the user's role is permitted.
5. Allows or rejects the request.

5. Authorization Responses

| HTTP Status | Meaning |
|---|---|
| 400 | Missing or invalid organization ID |
| 401 | Missing, invalid, or expired authentication token |
| 403 | User is not a member of the organization or lacks the required role |

6. Implemented Authorization Examples

Project Creation

Endpoint:

POST /api/organizations/:organizationId/projects

Allowed roles:

- ADMIN
- MANAGER

Issue Update

Endpoint:

PUT /api/organizations/:organizationId/projects/:projectId/issues/:issueId

Allowed roles:

- ADMIN
- MANAGER
- MEMBER

7. Security Principles

- JWT-based authentication for protected API endpoints.
- Organization-level membership verification.
- Role-based authorization for restricted operations.
- Resource ownership validation for projects and issues.
- Comment deletion restricted to the author or authorized organization roles.
- Request validation using Zod schemas.

8. Future Improvements

- Fine-grained permissions.
- Organization member removal and role updates.
- Invitation workflows for new members.
- Audit logs for administrative actions.
- Configurable organization roles.
# Nexus API Documentation

## 1. Authentication APIs

Local development, Base URL: `http://localhost:5000`

### 1.1 Register User

- Method: POST
- Endpoint: `/api/auth/register`
- Authentication: Not required

Request body:

```json
{
  "name": "John",
  "email": "john@example.com",
  "password": "password123"
}
```

Success response: HTTP 201

### 1.2 Login User

- Method: POST
- Endpoint: `/api/auth/login`
- Authentication: Not required

Request body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

Success response: HTTP 200

Returns an access token and user details.

The JWT access token expires after 15 minutes.

### 1.3 Get Current User

- Method: GET
- Endpoint: `/api/auth/me`
- Authentication: Required (JWT)

Success response: HTTP 200

Returns the authenticated user's ID, name, and email.

## Security

- Password hashing with bcryptjs.
- JWT-based authentication.
- Zod request validation.
- Protected profile endpoint.

## 2. Comments APIs

All endpoints require JWT authentication.

```md
### Authentication Header

Protected endpoints require a valid JWT access token in the Authorization header.

```http
Authorization: Bearer <accessToken>

'### 2.1 Create Comment'

- Method: POST
- Endpoint: `/api/organizations/:organizationId/issues/:issueId/comments`
- Permission: Organization member

Request body:

```json
{
  "content": "This issue needs further review."
}
```

Success response: HTTP 201

### 2.2 Get Comments

- Method: GET
- Endpoint: `/api/organizations/:organizationId/issues/:issueId/comments`
- Permission: Organization member

Success response: HTTP 200

Returns comments with their authors, ordered by creation date.

### 2.3 Delete Comment

- Method: DELETE
- Endpoint: `/api/organizations/:organizationId/issues/:issueId/comments/:commentId`
- Permission: Comment author, ADMIN, or MANAGER

Success response: HTTP 200

### Comments Security

- JWT authentication.
- Organization membership verification.
- Issue-to-organization ownership verification.
- Comment deletion authorization.
- Zod content validation.

## 3. Projects APIs

All endpoints require JWT authentication.

### 3.1 Create Project

- Method: POST
- Endpoint: `/api/organizations/:organizationId/projects`
- Permission: ADMIN, MANAGER

Request body:

```json
{
  "name": "Website Development",
  "description": "Development of the company website"
}
```

Success response: HTTP 201

### 3.2 Get Organization Projects

- Method: GET
- Endpoint: `/api/organizations/:organizationId/projects`
- Permission: Organization members

Success response: HTTP 200

Returns projects ordered by creation date, newest first.

### 3.3 Update Project

- Method: PUT
- Endpoint: `/api/organizations/:organizationId/projects/:projectId`
- Permission: ADMIN, MANAGER

Request body example:

```json
{
  "name": "Updated Project Name"
}
```

Success response: HTTP 200

### 3.4 Delete Project

- Method: DELETE
- Endpoint: `/api/organizations/:organizationId/projects/:projectId`
- Permission: ADMIN, MANAGER

Success response: HTTP 200

### Projects Security

- JWT authentication.
- Role-based authorization.
- Organization membership verification for project listing.
- Project ownership verification for updates and deletion.
- Zod request validation.

## 4. Issues APIs

All endpoints require JWT authentication.

### 4.1 Create Issue

- Method: POST
- Endpoint: `/api/organizations/:organizationId/projects/:projectId/issues`
- Permission: ADMIN, MANAGER

Request body:

```json
{
  "title": "Fix login issue",
  "description": "Investigate login failure",
  "priority": "HIGH",
  "assigneeId": "USER_UUID"
}
```

Success response: HTTP 201

Creates an issue and schedules an SLA-check background job.

### 4.2 Get Project Issues

- Method: GET
- Endpoint: `/api/organizations/:organizationId/projects/:projectId/issues`
- Permission: Organization members

Success response: HTTP 200

Returns project issues with assignee details, newest first.

### 4.3 Update Issue

- Method: PUT
- Endpoint: `/api/organizations/:organizationId/projects/:projectId/issues/:issueId`
- Permission: ADMIN, MANAGER, MEMBER

At least one update field is required.

Supported fields:
- title
- description
- status
- priority

Success response: HTTP 200

Broadcasts the `issue:updated` Socket.IO event to the organization room.

### 4.4 Delete Issue

- Method: DELETE
- Endpoint: `/api/organizations/:organizationId/projects/:projectId/issues/:issueId`
- Permission: ADMIN, MANAGER

Success response: HTTP 200

### Issues Background Processing

Issue creation schedules an `sla-check` job through the Nexus queue.

Configured delays:
- URGENT: 1 minute
- HIGH: 5 minutes
- MEDIUM: 30 minutes
- LOW: 60 minutes

The worker's actual processing and alert behavior must be verified separately.

## 5. Organizations APIs

All endpoints require JWT authentication.

### 5.1 Create Organization

- Method: POST
- Endpoint: `/api/organizations`
- Permission: Authenticated user

Request body:

```json
{
  "name": "My Organization"
}
```

Success response: HTTP 201

The creator automatically receives the ADMIN role.

### 5.2 Get User Organizations

- Method: GET
- Endpoint: `/api/organizations`
- Permission: Authenticated user

Success response: HTTP 200

Returns organizations where the authenticated user has membership.

### 5.3 Add Organization Member

- Method: POST
- Endpoint: `/api/organizations/:organizationId/members`
- Permission: ADMIN

Request body:

```json
{
  "email": "member@example.com"
}
```

Success response: HTTP 201

Adds an existing registered user with the MEMBER role.

### 5.4 Admin Access Test

- Method: GET
- Endpoint: `/api/organizations/:organizationId/admin-test`
- Permission: ADMIN

Success response: HTTP 200

Used to verify administrative access.

### Organization Security

- JWT authentication.
- Role-based access control.
- Membership creation and duplicate-membership validation.
- Organization-specific data retrieval.

## 6. Common HTTP Error Responses

The API uses HTTP status codes to indicate request failures.

| Status Code | Meaning |
|---|---|
| 400 | Bad Request – Invalid input or request parameters |
| 401 | Unauthorized – Missing, invalid, or expired JWT token |
| 403 | Forbidden – Insufficient permissions |
| 404 | Not Found – Requested resource does not exist |
| 409 | Conflict – Duplicate email or organization membership |

Error responses include a message describing the problem.
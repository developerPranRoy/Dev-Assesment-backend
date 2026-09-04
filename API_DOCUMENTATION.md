# Developer Assessment & Coding Platform — API Documentation

Base URL: `http://localhost:5000/api/v1` (replace with your deployed URL in production)

## Response format

Every endpoint returns one of these two shapes.

**Success**
```json
{ "success": true, "message": "Operation successful", "data": {}, "meta": {} }
```
`meta` (pagination info) only appears on list endpoints that support it.

**Error**
```json
{ "success": false, "message": "Something went wrong", "errors": [] }
```

## Authentication

Protected routes require `Authorization: Bearer <accessToken>`. Access tokens expire in 15 minutes by default; use `/auth/refresh-token` to get a new one without logging in again.

## Roles

| Role | Description |
|---|---|
| `CANDIDATE` | Takes assessments |
| `COMPANY` | Owns or belongs to a company — see permission levels below |
| `ADMIN` | Platform-wide administration |

`COMPANY` users have a `permissionLevel` on their company membership, not a separate top-level role:

| Level | Can manage problems/assessments | Can evaluate submissions | Can add members / buy credits |
|---|---|---|---|
| `OWNER` | Yes | Yes | Yes |
| `CREATOR` | Yes | Yes | No |
| `EVALUATOR` | No | Yes | No |

---

## Auth

### Register
`POST /auth/register` — no auth

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "min6chars",
  "role": "CANDIDATE"
}
```
`role` is `CANDIDATE` or `COMPANY` — `ADMIN` is never self-registered.

**201** → `{ user, accessToken, refreshToken }`
**409** if the email is already registered.

### Login
`POST /auth/login` — no auth

```json
{ "email": "jane@example.com", "password": "min6chars" }
```

**200** → `{ user, accessToken, refreshToken }`
**401** on invalid credentials.

### Refresh Token
`POST /auth/refresh-token` — no auth

```json
{ "refreshToken": "<token>" }
```

**200** → `{ accessToken }`
**401** if the refresh token is invalid, expired, or the user no longer exists.

### Google Login
`POST /auth/google` — no auth

```json
{ "idToken": "<google-id-token>" }
```

**501** currently — scaffolded but not wired up until `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are configured.

### Logout
`POST /auth/logout` — auth required (any role)

No body. Stateless JWT — this just confirms; the client discards both tokens. **200** → `data: null`.

### Get Profile
`GET /auth/me` — auth required

**200** → the current user's public profile.

### Update Profile
`PATCH /auth/me` — auth required

```json
{ "name": "New Name", "avatarUrl": "https://..." }
```
Both fields optional. **200** → updated user.

---

## Companies

### Create Company
`POST /companies` — auth: `COMPANY`

```json
{ "name": "Acme Inc" }
```
Creates the company and makes the caller its `OWNER`. **201**. **409** if the user already owns a company.

### Get Company
`GET /companies/:id` — no auth

**200** → company details plus member list (`userId`, `permissionLevel` per member).

### Add Member
`POST /companies/:id/members` — auth: `COMPANY`, must be `OWNER` of that company

```json
{ "email": "teammate@acme.dev", "permissionLevel": "EVALUATOR" }
```
`permissionLevel` is `CREATOR` or `EVALUATOR` (owners aren't added this way). **404** if no user exists with that email. **409** if already a member. **403** if the requester isn't the owner.

---

## Problems

All routes below: auth `COMPANY`, scoped to the caller's own company automatically (no company ID in the URL). Create/update/delete require `OWNER` or `CREATOR` — `EVALUATOR` gets `403`.

### Create Problem
`POST /problems`

```json
{
  "type": "MCQ",
  "title": "What is a closure?",
  "statement": "...",
  "difficulty": "MEDIUM",
  "tags": ["javascript"],
  "points": 10,
  "options": ["A", "B", "C"],
  "correctAnswer": "A"
}
```
`type` is `CODING`, `MCQ`, or `WRITTEN`. `testCases` (for `CODING`) and `options`/`correctAnswer` (for `MCQ`) are optional and type-dependent. **201**.

### List Problems
`GET /problems?page=1&limit=10&type=MCQ&difficulty=EASY`

All query params optional. **200** → `data: Problem[]`, `meta: { page, limit, total, totalPages }`.

### Search Problems
`GET /problems/search?q=keyword`

Matches against `title` (case-insensitive). Same response shape as List.

### Get Problem
`GET /problems/:id` — **200** or **404**.

### Update Problem
`PATCH /problems/:id` — any subset of the create fields. **403** if it belongs to a different company.

### Delete Problem
`DELETE /problems/:id` — soft delete (`deletedAt` set, not removed from the database).

---

## Assessments

Auth `COMPANY` for all writes; `GET /:id` allows any authenticated role (candidates need to view assessment details).

### Create Assessment
`POST /assessments`

```json
{
  "title": "Backend Engineer Screen",
  "description": "30-minute screen",
  "durationMinutes": 30,
  "passingScore": 60
}
```
Starts in `DRAFT`. **201**.

### List Assessments
`GET /assessments?page=1&limit=10&status=DRAFT` — same pagination shape as Problems.

### Get Assessment
`GET /assessments/:id` — includes attached problems.

### Update Assessment
`PATCH /assessments/:id` — any subset of the create fields.

### Delete Assessment
`DELETE /assessments/:id` — soft delete.

### Add Problem to Assessment
`POST /assessments/:id/problems`

```json
{ "problemId": "<id>", "order": 1, "points": 10 }
```
**404** if the problem doesn't belong to the same company.

### Change Status
`PATCH /assessments/:id/status`

```json
{ "status": "PUBLISHED" }
```
`status` is `DRAFT`, `PUBLISHED`, or `ARCHIVED`. **400** if publishing an assessment with zero problems attached. Every status change writes an audit log entry.

---

## Invitations

### Invite Candidates
`POST /assessments/:assessmentId/invitations` — auth `COMPANY`

```json
{ "emails": ["candidate1@x.com", "candidate2@x.com"] }
```
Assessment must be `PUBLISHED`. Each invitation gets a random token and a 7-day expiry. **201** → array of invitations (the token is only ever returned here — there's no email dispatch yet, so share it with the candidate manually or wire up Resend/Nodemailer).

### List Invitations
`GET /assessments/:assessmentId/invitations` — auth `COMPANY`

### Accept Invitation
`POST /invitations/:token/accept` — auth `CANDIDATE`

**400** if already accepted or expired. **404** if the token doesn't exist. Note: starting an attempt (below) auto-accepts a `PENDING` invitation, so calling this explicitly first is optional.

---

## Attempts

### Start Attempt
`POST /assessments/:assessmentId/attempts/start` — auth `CANDIDATE`

No body. Requires a non-expired invitation for the candidate's email on this assessment. **201** → the new attempt (`status: IN_PROGRESS`, `startedAt` set).

- **400** if the assessment isn't `PUBLISHED`.
- **403** if the candidate wasn't invited.
- **409** if they already have an attempt on this assessment (the `@@unique([assessmentId, candidateId])` constraint is the real guard; this is just the friendly error).

### Get Attempt
`GET /attempts/:id` — auth required

Recomputes expiry on read — if `now > startedAt + durationMinutes`, the response reflects `EXPIRED` even if no one explicitly closed it out.

### Heartbeat
`PATCH /attempts/:id/heartbeat` — auth `CANDIDATE`

```json
{ "event": "tab_blur" }
```
Appends a timestamped event to the attempt's flagged-events log. No-ops silently if the attempt isn't `IN_PROGRESS`.

### Submit Attempt
`POST /attempts/:id/submit` — auth `CANDIDATE`

No body. Locks the attempt, sums all submission scores, and sets status to `EVALUATED` if every submission is already graded, or `SUBMITTED` if any are still pending manual evaluation. **400** if the attempt isn't `IN_PROGRESS`.

### My Attempt History
`GET /attempts/my-history` — auth `CANDIDATE`

---

## Submissions

### Submit Answer
`POST /attempts/:attemptId/submissions` — auth `CANDIDATE`

```json
{ "problemId": "<id>", "answer": "some answer", "languageId": 63 }
```
`languageId` only applies to `CODING` problems (Judge0 language ID). Auto-grading behavior:
- `MCQ` → graded immediately against `correctAnswer`.
- `CODING` → graded via Judge0 if `JUDGE0_API_URL` is set and `languageId`/`testCases` are present; otherwise left ungraded.
- `WRITTEN` → always stays `PENDING` for manual evaluation.

**409** if this problem was already answered on this attempt. **400** if the attempt isn't `IN_PROGRESS`.

### Get Attempt Score
`GET /attempts/:attemptId/score` — auth required

**200** → `{ status, score }`.

### Evaluate Submission
`PATCH /submissions/:id/evaluate` — auth `COMPANY` (any permission level, including `EVALUATOR`)

```json
{ "manualScore": 8 }
```
Recomputes the parent attempt's total score in the same transaction, and flips the attempt to `EVALUATED` once every submission on it is graded. Writes an audit log entry. **403** if the evaluator isn't a member of the problem's company.

---

## Payments

Credit-based model via Stripe Checkout, priced flat at $0.50/credit (USD).

### Initiate Payment
`POST /payments/initiate` — auth `COMPANY`, must be `OWNER`

```json
{ "credits": 10 }
```

**201** → `{ payment, checkoutUrl }`. `checkoutUrl` is a real Stripe-hosted payment page — open it in a browser to pay. A `Payment` row is created with `status: PENDING` before the checkout URL is returned.

### Payment Webhook
`POST /payments/webhook` — no auth, but requires a valid `Stripe-Signature` header

Called by Stripe directly, not something you hand-craft in Postman — the body must be the exact raw bytes Stripe signed. Test it with the Stripe CLI: `stripe listen --forward-to localhost:5000/api/v1/payments/webhook`.

Handles two event types:
- `checkout.session.completed` → marks the payment `COMPLETED`, grants credits to the company, and writes an audit log entry, all in one transaction.
- `checkout.session.expired` → marks the payment `FAILED`.

Idempotent — a retried delivery for an already-processed session is a no-op. **400** if the signature doesn't verify.

### Get Payment
`GET /payments/:id` — auth `COMPANY`

---

## Admin

Every route below requires the `ADMIN` role.

### List Users
`GET /admin/users?page=1&limit=10&role=CANDIDATE` — `role` filter optional.

### Change User Role
`PATCH /admin/users/:id/role`

```json
{ "role": "COMPANY" }
```
`role` is `CANDIDATE`, `COMPANY`, or `ADMIN`. Writes an audit log entry.

### Dashboard Stats
`GET /admin/dashboard-stats`

**200** → `{ totalUsers, totalCompanies, totalAssessments, totalAttempts, completedPayments }`.

### Audit Logs
`GET /admin/audit-logs?page=1&limit=10`

Returns the raw audit trail (`action`, `entityType`, `entityId`, `actorId`, `metadata`, `createdAt`), paginated, most recent first.

---

## Common error cases

| Status | Meaning |
|---|---|
| 400 | Validation failure or invalid business state (e.g. publishing with no problems) |
| 401 | Missing/invalid/expired token, or bad credentials |
| 403 | Authenticated but not permitted (wrong role or permission level) |
| 404 | Resource not found (or soft-deleted) |
| 409 | Conflict — duplicate email, already-answered problem, already-owns-a-company, etc. |
| 429 | Rate limited (auth endpoints: 10 requests per 15 min; general API: 100 requests per 15 min) |
| 500 | Unexpected server error |
# Developer Assessment & Coding Platform

A backend platform for running technical assessments end to end: a company creates an assessment, attaches coding/MCQ/written problems, invites candidates, candidates take timed attempts, submissions are auto-graded where possible and manually evaluated otherwise, and the company gets a score report.

## Tech Stack

- **Runtime**: Node.js, TypeScript, Express.js
- **Database**: PostgreSQL + Prisma, PgBouncer in Docker
- **Cache / queue**: Redis (rate limits, token blacklist, OAuth state, hot memberships) + BullMQ grading worker
- **Gateway**: Nginx (gzip, per-route rate limits, service routing)
- **Auth**: JWT (access + refresh), bcryptjs, Google OAuth, Redis-backed logout blacklist
- **Uploads**: Cloudinary (avatar + resume)
- **Code execution**: Judge0 via async worker (`JUDGE0_API_URL`)
- **Payments**: Stripe (Checkout Sessions + signature-verified webhooks), credit-based model

## Roles

| Role | Notes |
|---|---|
| `CANDIDATE` | Takes assessments |
| `COMPANY` | Owns or belongs to a company; permission level (`OWNER` / `CREATOR` / `EVALUATOR`) controls what they can do within it |
| `ADMIN` | Platform-wide oversight — seeded only, no self-registration |

## Features

- Email/password auth with access + refresh tokens; role- and permission-based authorization throughout
- Company workspaces with owner-managed team members
- Problem bank (coding, MCQ, written) with pagination, filtering, and search
- Assessment lifecycle with an enforced state machine (`DRAFT` → `PUBLISHED` → `ARCHIVED`, publish blocked with zero problems attached)
- Invite-gated, timed candidate attempts with server-side expiry and a heartbeat/flagged-events log
- Auto-grading for MCQ and (optionally) coding submissions; manual evaluation workflow for written answers, with transaction-safe score rollups
- Credit-based payment flow with idempotent webhook handling
- Soft deletes, audit logging on critical actions, and rate limiting throughout

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL and Redis (or Docker)

### Installation
```bash
npm install
cp .env.example .env
# fill in DATABASE_URL, DIRECT_DATABASE_URL, Redis, and both JWT secrets
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

Local Redis is required (`REDIS_URL`). For production-shaped services:

```bash
docker compose up --build
```

This starts Postgres, Redis, PgBouncer, migrate, **auth / core / exam / payment** APIs, a grading **worker**, and **Nginx on port 80**. Scale a service with `docker compose up --scale exam=3`.

Server runs on `http://localhost:5000` in monolith mode (`SERVICE_NAME=all`); health check at `GET /health`, readiness at `GET /ready`.

### Testing Stripe webhooks locally

The webhook route verifies a real Stripe signature, so a hand-crafted Postman request won't pass — use the [Stripe CLI](https://docs.stripe.com/stripe-cli) instead:

```bash
stripe listen --forward-to localhost:5000/api/v1/payments/webhook
```

This prints a `whsec_...` value — put that in `STRIPE_WEBHOOK_SECRET`. Then call `POST /payments/initiate`, open the returned `checkoutUrl` in a browser, and pay with Stripe's test card `4242 4242 4242 4242` (any future expiry, any CVC). The CLI forwards the real webhook event to your local server.

## Environment Variables

See `.env.example` for the full list. The ones you must set yourself:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Any long random strings |
| `STRIPE_SECRET_KEY` | From your Stripe dashboard — required for `/payments/initiate` to work |
| `STRIPE_WEBHOOK_SECRET` | From `stripe listen` (local testing) or your webhook endpoint's settings (production) — required for `/payments/webhook` to verify signatures |

Everything else has a working default or is optional (`JUDGE0_API_URL`, `GOOGLE_CLIENT_ID`/`SECRET` — see Known Simplifications below).

## Demo Credentials

Password for all seeded accounts: `Password123!`

| Email | Role |
|---|---|
| `admin@platform.dev` | Admin |
| `owner@acme.dev` | Company (Owner) |
| `evaluator@acme.dev` | Company (Evaluator) |
| `candidate@example.dev` | Candidate |

## API Documentation

- **Postman collection**: `dev-assessment-platform.postman_collection.json` — import into Postman, run a Login request to populate the auth token, everything else chains automatically.
- **Full reference**: `API_DOCUMENTATION.md` — every endpoint with auth requirements, request/response shapes, and error cases.

## Project Structure

```
src/
  config/           env, database, and third-party config
  lib/              external service clients (Judge0)
  middlewares/      auth, RBAC, validation, rate limiting, error handling
  modules/
    Auth/ Company/ Problem/ Assessment/ Invitation/
    Attempt/ Submission/ Payment/ Admin/
  routes/           v1 router aggregation
  shared/           catchAsync, ApiError, sendResponse, pagination, audit log
  app.ts
  server.ts
prisma/
  schema.prisma
  seed.ts
```

Each module follows the same pattern: `repository` (Prisma access) → `service` (business logic) → `validation` (Zod schemas) → `controller` → `route`.

## Deployment

Live URL: `[add after deploying to Vercel/Render]`
Repository: `[add your GitHub repo URL]`

## Known Simplifications

Documented here rather than discovered mid-review:

- **Services share one PostgreSQL schema** — split behind Nginx by bounded context (auth, core, exam, payment, worker), not separate databases. That is the usual first production step; per-service databases come later if a team owns each domain.
- **Coding submissions** auto-grade asynchronously when `JUDGE0_API_URL` is set; otherwise they stay `PENDING` for manual grading.
- **Payments** are real Stripe Checkout Sessions at $0.50/credit (USD). `success_url`/`cancel_url` default to placeholder pages until a frontend exists.
- **Invitations** return the token in the API response rather than emailing it — no Nodemailer/Resend integration yet.

## License

ISC (or update to match your submission requirements).
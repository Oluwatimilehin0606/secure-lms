# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Secure LMS is a security-first Learning Management System: React (client) + Node.js/Express (server) + PostgreSQL (database). The backend API (auth, courses, enrollments, admin role management, simulated payments) and a matching React client are both built out. `docs/api`, `docs/architecture`, `docs/security`, and `docs/testing` are present but still empty.

Known deferred scope (not yet built, intentionally): email verification (`users.email_verified` exists but nothing sets it true), and admin-only user role-promotion has no client-driven bootstrap — the very first admin/instructor account has to be promoted via direct SQL (`UPDATE users SET role_id = (SELECT id FROM roles WHERE name='admin') WHERE email = '...'`) since registration always creates `student` accounts.

## Commands

Server (from `server/`):
- `npm run dev` — start the API with nodemon on port 5000 (from `PORT` in `server/.env`)
- `npm start` — start the API with plain node

Client (from `client/`):
- `npm run dev` — start the Vite dev server on port 5173
- `npm run build` — typecheck (`tsc -b`) then production build
- `npm run lint` — oxlint
- `npm run preview` — preview the production build

No automated test suite exists in either package yet.

## Architecture

### Server (`server/src`)

Layering is strict and consistent across every feature: `routes` (wiring + middleware order) → `validators` (express-validator chains) → `controllers` (thin: call service, shape response) → `services` (business rules, authorization decisions, orchestration) → `models` (raw `pg` queries, one file per table/concern). Follow this shape for new features rather than putting logic in controllers.

- Entry point: `server/src/server.js`. App setup: `server/src/app.js` — mounts `helmet()`, scoped `cors()` (credentials + `CLIENT_ORIGIN` only), `express.json()`, `cookie-parser`, global CSRF check, then `/api/auth`, `/api/courses`, `/api/enrollments`, `/api/admin`, `/api/payments`, then 404 + error handlers last.
- Config: `server/src/config/env.js` is the single source of truth for env vars (validates required ones at startup, throws if missing) — read from here, not `process.env`, in new code. `server/src/config/database.js` exports the shared `pg` `Pool`.
- Auth: httpOnly JWT `accessToken` cookie (15 min, `server/src/utils/jwt.js`) + opaque `refreshToken` cookie (7 days, hashed at rest in `refresh_tokens`, rotated on every refresh with reuse-detection that revokes the whole token family). Passwords hashed with argon2id (`server/src/utils/password.js`). `middleware/auth.middleware.js` exports `authenticate`, `authorize(...roles)`, and `optionalAuthenticate` (attaches `req.user` if a valid cookie is present but never blocks — used where visibility depends on identity, e.g. draft vs published courses).
- CSRF: double-submit cookie (`middleware/csrf.middleware.js`), applied globally to every non-GET request. Non-httpOnly `csrfToken` cookie, must be echoed back as `X-CSRF-Token`. Rotates on login/refresh; cleared on logout. `GET /api/auth/csrf-token` issues one for pre-login use (registration/login are CSRF-protected too).
- Transactions: two places do explicit row-locking transactions instead of plain queries, both documented in-line with why — `user.model.js#changeRole` (locks the target row + full active-admin set in one identically-ordered query to avoid a last-admin-demotion race without deadlocking) and `payment.model.js#markSuccessfulAndEnroll` (atomically flips a payment to `successful` and creates/reactivates the enrollment so one can't exist without the other).
- Payments are two-phase and simulated (no real gateway): `POST /api/payments` initiates (idempotently resumes an existing pending payment), `POST /api/payments/:reference/confirm` stands in for the gateway callback and is authenticated as the paying student (or admin) rather than a signed webhook, since there's nothing real behind it. Paid-course enrollment (`enrollment.service.js#enroll`) is gated on `payment.model.js#hasSuccessfulPayment`; free courses skip payment entirely.
- Every mutating action writes to `audit_logs` (`models/auditLog.model.js`) and security-relevant events (login, lockout, role change, refresh-token reuse) additionally write to `security_logs` (`models/securityLog.model.js`).

### Client (`client/src`)

Vite + React + TypeScript + Tailwind v4 + React Router + TanStack Query.

- `api/client.ts` is the only place that calls `fetch` directly — `apiRequest<T>(path, opts)` handles `credentials: 'include'`, reads the `csrfToken` cookie and attaches `X-CSRF-Token` on mutating requests (fetching one via `/auth/csrf-token` first if missing), and on a 401 does a single transparent refresh-then-retry (via `/auth/refresh`) before surfacing the error. Domain modules (`api/auth.ts`, `courses.ts`, `enrollments.ts`, `payments.ts`, `admin.ts`) wrap this with typed, unwrapped-`data` functions — add new endpoints there, not ad hoc fetches in components.
- `context/AuthContext.tsx` wraps the `GET /auth/me` query (`['auth','me']`) plus login/register/logout mutations; `useAuth()` is the way components read the current user/role.
- `components/ProtectedRoute.tsx` gates routes by auth + optional `roles` array; role-conditional nav lives in `components/Layout.tsx`.
- Route → page mapping is centralized in `App.tsx`. Course price / payment `amount` come back from Postgres as strings (e.g. `"49.99"`) — always `Number(...)` before formatting or comparing.
- The payment UX (`components/PaymentModal.tsx`) mirrors the server's simulated two-phase flow: a course's "Enroll" button always tries a direct enroll first; a 402 response is what triggers `paymentsApi.initiate` and opens the modal (rather than branching on price client-side) so the server stays the single source of truth for "does this need payment."

### Database

- `database/schema.sql` is the current schema (source of truth); `database/schema_v1.sql` is the prior version kept for reference. The running dev database has one extra table (`refresh_tokens`) and column-level tweaks applied ad hoc during development — if schema drift ever matters, diff the live DB against `schema.sql` rather than assuming they're identical.
- All primary keys are `UUID DEFAULT gen_random_uuid()` (needs the `pgcrypto` extension).
- Core tables: `roles` (seeded `admin`/`instructor`/`student`), `users`, `courses`, `enrollments`, `payments` (simulated), `refresh_tokens`, `security_logs`, `audit_logs`.
- Status/enum-like fields use `CHECK` constraints, not native enum types (e.g. `courses.status`, `payments.status`, `enrollments.status`, `security_logs.severity`).
- Soft deletes (`deleted_at`) on `users` and `courses` — always filter `deleted_at IS NULL` in new queries against those tables.
- `users.failed_login_attempts` / `locked_until` back the login lockout mechanism (5 attempts → 15 min lock, see `auth.service.js`).

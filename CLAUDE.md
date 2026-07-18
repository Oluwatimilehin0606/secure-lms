# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Secure LMS is a security-first Learning Management System: React (client) + Node.js/Express (server) + PostgreSQL (database). The project is in early scaffolding stages — the client app, and the server's `controllers/`, `middleware/`, `models/`, `routes/`, `services/`, `validators/`, and `utils/` directories exist but are currently empty. `docs/api`, `docs/architecture`, `docs/security`, and `docs/testing` are also present but empty. When implementing new features, this is the intended structure to build into rather than inventing a different layout.

## Commands

All server commands run from `server/`:

- `npm run dev` — start the API with nodemon (auto-restart on changes)
- `npm start` — start the API with plain node

There is no client app, test runner, lint config, or build tooling set up yet in either `client/` or `server/`.

## Architecture

### Server

- Entry point: `server/src/server.js` — reads `PORT` from env (default 5000) and starts the Express app.
- App setup: `server/src/app.js` — applies `helmet()`, `cors()`, `express.json()`, and `morgan("dev")` logging, and exposes `GET /api/health`. New routes should be mounted here.
- Database: `server/src/config/database.js` exports a `pg` `Pool` configured from env vars (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`), loaded via `dotenv` from `server/.env`.

### Database

- `database/schema.sql` is the current (v2) schema; `database/schema_v1.sql` is the prior version, kept for reference/diffing. Treat `schema.sql` as the source of truth for new work.
- All primary keys are `UUID DEFAULT gen_random_uuid()` (requires the `pgcrypto` extension, created at the top of the schema) — this was a deliberate migration away from `SERIAL` integer IDs in v1.
- Core tables: `roles`, `users`, `courses`, `enrollments`, `payments` (simulated, not a real payment gateway), `security_logs`, `audit_logs`.
- `roles` is seeded with `admin`, `instructor`, `student`.
- Status/enum-like fields are enforced via `CHECK` constraints rather than native enum types (e.g. `courses.status IN ('draft','published','archived')`, `payments.status IN ('pending','successful','failed')`, `security_logs.severity IN ('info','warning','critical')`).
- Soft deletes: `users`, `courses` use a nullable `deleted_at` column instead of hard deletes.
- `security_logs` (auth/security events like failed logins, lockouts) and `audit_logs` (admin/actor actions with a JSONB `details` column) are separate tables — security-relevant application events should be written to `security_logs`, and administrative/state-changing actions to `audit_logs`.
- `users` has built-in brute-force protection fields: `failed_login_attempts` (non-negative, enforced by a `CHECK`) and `locked_until`.

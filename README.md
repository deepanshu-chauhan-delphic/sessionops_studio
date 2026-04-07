# SessionOps Studio

> **Staff-facing control panel for managing healthcare voice assistants and reviewing patient intake sessions.**

SessionOps Studio is the operator console for MiiHealth's voice intake platform. Before a patient speaks with a clinician, a voice assistant conducts a structured intake conversation — collecting symptoms, medications, allergies, and escalation signals. SessionOps Studio is where staff create those assistants, publish them for use, launch live sessions, and review everything that happened afterward.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Quick Start](#quick-start)
- [Docker Setup](#docker-setup)
- [Ubuntu VM Deployment](#ubuntu-vm-deployment)
- [Demo Accounts](#demo-accounts)
- [Environment Variables](#environment-variables)
- [CI / Quality Checks](#ci--quality-checks)
- [Design Decisions](#design-decisions)
- [Trade-offs](#trade-offs)
- [Known Limitations](#known-limitations)
- [What I Would Do Next](#what-i-would-do-next)
- [AI Usage Note](#ai-usage-note)

---

## Overview

The product scope in this repository is the **staff-facing control panel** — not the clinical AI runtime itself. The voice runtime is intentionally mocked via a custom WebSocket server so the entire operator workflow (assistant authoring, session launching, transcript review, role-based access, audit logging) can be exercised end-to-end without depending on a real voice provider.

A real AI Engineer would swap the mock WebSocket runtime for an OpenAI Realtime API adapter or a Deepgram + LLM + TTS pipeline behind the same contract, with no changes required to the frontend or persistence layer.

---

## Features

### Assistant Management
| Feature | Detail |
|---|---|
| Create / Edit | Form with name, purpose/instructions, voice, language, tools, and status |
| Draft → Published | Publish is a deliberate action; drafts cannot be launched |
| Archive | Soft-delete — archived assistants remain queryable and auditable |
| Duplicate | Clone any assistant into a new draft |
| Version tracking | `version` increments on every edit; `publishedAt` is recorded |
| Role gating | Admin-only mutations; viewers get read-only access |

### Live Voice Session
| Feature | Detail |
|---|---|
| Launch gate | Only published assistants can start a session |
| Mic permission | Handled explicitly — clear error message if denied |
| Runtime states | Connecting → Active → Ended / Error |
| Live transcript | Speaker-labelled lines with timestamps, streamed via WebSocket |
| Typing indicator | Streaming delta tokens show the assistant "typing" in real time |
| End session | Saves transcript, duration, turn count, and generated summary to DB |
| Runtime errors | WebSocket failures are caught, surfaced, and the session is marked failed |

### Session History & Review
| Feature | Detail |
|---|---|
| Session list | Filterable by assistant, status, date range; sortable by duration and turns |
| Session detail | Full transcript, metadata, generated summary |
| DRAFT labelling | All AI-generated summaries are marked "DRAFT — For Staff Review" |
| Flag for review | Admin can flag completed sessions as `needs_review` |
| Approve | Admin can approve a flagged session |
| Summary editing | Admin can edit and finalize the summary inline |

### Access Control & Audit
| Feature | Detail |
|---|---|
| Two roles | `admin` (full access) and `viewer` (read-only) |
| API enforcement | Every mutation route checks role via `requireAdmin()` |
| Audit log | Every create / edit / publish / archive / duplicate / session event is logged with actor, entity, and diff |
| Audit UI | `/audit` page shows the full log with entity filtering |

---

## Architecture

```mermaid
flowchart LR
  Browser["Next.js App Router\n(UI + Client Components)"]
  API["Next.js Route Handlers\n(/api/**)"]
  WS["Custom WS Server\n(server.mjs — mock runtime)"]
  DB[(PostgreSQL\nvia Prisma)]
  Auth["NextAuth\nCredentials + JWT"]

  Browser -->|HTTP fetch| API
  Browser -->|WebSocket| WS
  API --> DB
  API --> Auth
  WS --> Browser
```

**Request flow for a live session:**
1. Browser fetches `POST /api/sessions` — creates a session record in DB, status `active`
2. Browser opens `ws://.../api/runtime/mock-socket?sessionId=...` — handled by `server.mjs` upgrade listener
3. Mock runtime streams `session_state`, `assistant_text_delta`, and `assistant_text` messages
4. Browser sends `user_text` messages; runtime replies with contextual assistant responses
5. Each transcript line is persisted via `POST /api/sessions/:id { action: "append_transcript" }`
6. On end: `POST /api/sessions/:id { action: "end" }` — computes duration, turn count, generates summary, updates DB

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 App Router | Collocates frontend and backend in one repo; RSC for data-heavy pages, client components for interactive UI |
| Language | TypeScript | End-to-end type safety across API handlers, Prisma queries, and UI |
| ORM | Prisma 5 | Type-safe DB access, migration tracking, and JSONB support for tools/summaries |
| Database | PostgreSQL 15 | JSONB for flexible tool configs and session summaries; reliable for relational session data |
| Auth | NextAuth v4 (credentials) | Simple to set up, supports JWT strategy and role injection into session tokens |
| Styling | Tailwind CSS 4 + custom tokens | Fast layout; design tokens enforced via CSS variables and Tailwind config overrides |
| Components | shadcn/ui + Radix UI | Accessible, unstyled primitives that respect the design system |
| WebSocket | `ws` library + custom HTTP server | Lightweight; Next.js does not support WebSocket upgrades natively so `server.mjs` wraps the HTTP server |
| Icons | Lucide React | Consistent icon set, tree-shakeable |
| Container | Docker + docker-compose | Single-command local and production setup |
| CI | GitHub Actions | Lint → test → build pipeline on every push and PR |

---

## Data Model

```
users
  id · email · passwordHash · name · role(admin|viewer) · createdAt

assistants
  id · name · purpose · voice · language · status(draft|published|archived)
  tools(JSONB) · version · createdBy(→users) · publishedAt · createdAt · updatedAt

sessions
  id · assistantId(→assistants) · operatorId(→users)
  status(active|completed|failed|needs_review)
  startedAt · endedAt · durationSecs · turnCount
  summary(JSONB) · metadata(JSONB)

transcript_entries
  id · sessionId(→sessions) · speaker(user|assistant)
  content · timestamp · sequence

audit_logs
  id · userId(→users) · action · entityType · entityId · entityName
  changes(JSONB) · createdAt
```

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ running locally **or** Docker (recommended)

### 1. Clone and install

```bash
git clone <repo-url>
cd sessionops-studio
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://sessionops:sessionops@localhost:5432/sessionops_studio"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
npx prisma migrate deploy
npm run db:seed
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** `npm run dev` uses `server.mjs` (not `next dev` directly) so the custom WebSocket server is active in development.

---

## Docker Setup

The fastest way to run the full stack — no local PostgreSQL needed.

```bash
docker compose up --build
```

This starts three services in order:

| Service | Role |
|---|---|
| `postgres` | PostgreSQL 15-alpine, data persisted to a named volume, exposed on host port `5433` |
| `migrate` | One-off container: runs `prisma migrate deploy` then seeds demo data |
| `app` | Production Next.js build on port `3000`, depends on migrate completing |

Open [http://localhost:3000](http://localhost:3000).

### Manual image build

```bash
docker build -t sessionops-studio .

docker run --rm -p 3000:3000 \
  -e DATABASE_URL="postgresql://sessionops:sessionops@host.docker.internal:5432/sessionops_studio" \
  -e NEXTAUTH_SECRET="change-me" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  sessionops-studio
```

---

## Ubuntu VM Deployment

Target: fresh **Ubuntu 22.04 LTS**.

### 1. Install system packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # re-login after this
```

### 2. (Optional) Install Node.js 20 for non-Docker runs

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Clone and configure

```bash
git clone <repo-url> sessionops-studio
cd sessionops-studio
cp .env.example .env
nano .env   # set DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 4. Start the stack

```bash
docker compose up --build -d
```

### 5. Verify

```bash
docker compose ps
docker compose logs app --tail 50
```

App should be reachable at `http://<vm-ip>:3000`.

### 6. Optional: reverse proxy + TLS

Install Nginx or Caddy and proxy port `3000`. Set `NEXTAUTH_URL` to your public HTTPS origin (e.g. `https://sessionops.example.com`).

```nginx
server {
    listen 80;
    server_name sessionops.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

> The `Upgrade`/`Connection` headers are required for WebSocket sessions to work through Nginx.

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@test.com` | `admin123` |
| Viewer | `viewer@test.com` | `viewer123` |

Seed data includes:
- 3 assistants (2 published, 1 draft)
- 3 sessions (completed, needs_review, failed)
- 6 audit log entries

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | JWT signing secret — use `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full public URL of the app (e.g. `http://localhost:3000`) |
| `PORT` | No | HTTP port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` |

---

## CI / Quality Checks

GitHub Actions runs on every push to `main` and on all pull requests:

```
Install deps → Lint (ESLint) → Test (project config validation) → Build (next build)
```

Run locally:

```bash
npm run lint
npm run test
npm run build
```

---

## Design Decisions

### 1. Mock runtime over real voice provider
The AI voice runtime (speech-to-text → LLM → TTS) is the AI Engineer's domain. This repo defines the operator-facing control plane and the session persistence contract. The mock WebSocket in `server.mjs` lets the entire session workflow — transcript streaming, state transitions, error handling, persistence — be exercised fully without an API key or external dependency. Swapping in a real provider means replacing `server.mjs`'s reply logic with a real audio pipeline; the frontend and DB layer are unchanged.

### 2. Draft and published as real product states
Publishing is not a checkbox — it is a deliberate promotion that marks an assistant as clinically approved for use. The API blocks session creation against draft assistants even if the frontend is bypassed (`POST /api/sessions` validates `status === "published"`). Archived assistants are never hard-deleted; audit history remains intact.

### 3. `needs_review` baked into the session status enum from day one
The spec mentioned a possible follow-up feature: a human-review-required state. Rather than retrofitting it later, `needs_review` is a first-class `SessionStatus` value. The flag/approve actions are already in the API and UI. A dedicated review inbox page is the natural next step.

### 4. Audit logs as first-class records
Every meaningful mutation — create, edit, publish, archive, duplicate, session start, session end, flag, approve — writes an `AuditLog` row with the actor, entity, and a JSON diff. This supports compliance traceability and is surfaced in the `/audit` page. The audit write is inlined into each route handler rather than middleware so each log entry can carry mutation-specific context.

### 5. JSONB for tools and summaries
Assistant tools and session summaries are stored as JSONB. This keeps the schema stable while allowing the tool definitions and summary structure to evolve without migrations. The trade-off is that JSONB fields are not queryable with full type safety — acceptable at this stage given the small dataset and demo scope.

---

## Trade-offs

| Decision | What was traded off | Reason |
|---|---|---|
| Mock voice runtime | Real end-to-end audio | Scope control — the operator UX, persistence, and workflow are the Full-Stack deliverable |
| Client-side sort/filter on sessions | Server-side pagination | Dataset is small and seeded; server-side pagination would add complexity without visible benefit at demo scale |
| Credentials auth (no OAuth) | SSO / SAML integration | Sufficient to demonstrate RBAC clearly without external identity provider complexity |
| Inline audit writes per route | Centralised audit middleware | Per-route writes carry mutation-specific context (e.g. which fields changed) that generic middleware cannot easily capture |
| No dedicated review inbox page | Separate `/review` route | `needs_review` sessions are filterable on the sessions list; the inbox is the documented next step |

---

## Known Limitations

- The mock runtime does not stream real audio to a speech provider.
- Session history sorting is client-side; large datasets would require server-side pagination.
- Viewer access is enforced at the API level and via UI guards, but does not use a dedicated route-level policy framework.
- The review workflow is lightweight — approve/flag actions exist but there is no dedicated review queue page.
- AI-generated summaries are heuristic mock outputs, not clinical reasoning.

---

## What I Would Do Next

1. **Real runtime adapter** — Wire `server.mjs` to OpenAI Realtime API or a Deepgram + Claude + TTS pipeline behind the same WebSocket message contract.
2. **Server-side pagination** — Add cursor-based pagination to `GET /api/sessions` and `GET /api/assistants` for production data volumes.
3. **Review inbox** — A dedicated `/review` page listing all `needs_review` sessions with bulk approve/escalate actions.
4. **Assistant versioning** — An `assistant_versions` table storing the full config snapshot on each publish, with a "revert to version X" flow.
5. **Stronger form validation** — Zod schemas shared between the API and the frontend form, with field-level error messages.
6. **Real test coverage** — Integration tests for each API route (role guards, business rule enforcement) using a test PostgreSQL database.
7. **Optimistic UI** — React Query mutations with optimistic updates so publish/archive feel instant.

---

## AI Usage Note

### Tools Used
- Claude (Anthropic) for architecture discussion, scaffolding review, and implementation assistance
- GitHub Copilot for inline code completion

### Where AI Helped
- Boilerplate generation: Prisma schema structure, NextAuth config, Docker multi-stage build
- Shadcn/ui component scaffolding and Tailwind token setup
- Documentation drafting and README structure

### Where AI Was Corrected
- Initial schema used `String` for status fields instead of Prisma enums — corrected to typed enums
- Generated WebSocket examples did not handle the `upgrade` event correctly for the custom HTTP server — rewritten manually
- Suggested splitting into microservices — simplified to a monolith appropriate for this scope

### Manual Judgement Calls
- Choosing to mock the voice runtime rather than wire a real provider (scope control)
- Designing `needs_review` as a first-class status from day one for follow-up extensibility
- Inlining audit writes per route for mutation-specific context rather than generic middleware
- Using JSONB for tools and summaries to allow schema evolution without migrations
- Keeping auth as credentials-only to avoid external identity provider complexity

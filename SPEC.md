# SessionOps Studio — Source of Truth Spec

> MiiHealth Full-Stack Engineer Take-Home Assignment
> Last updated: 2026-04-06
> Status: Active

---

## What Is This?

MiiHealth is building a healthcare voice assistant platform. Staff members ("operators") use this web app to:
- Configure voice bots (assistants)
- Launch live voice sessions with clients
- View live transcripts
- Review past sessions and summaries

**You are NOT building the AI brain.** You're building the control panel.

---

## The 5 Core Features

1. **Create/Edit Voice Assistants** — form to set up a bot (name, instructions, voice, language, tools, draft → publish)
2. **Launch a Live Voice Session** — click "Start Session" on a published assistant, mic opens, live transcript appears
3. **Show Live Transcript** — real-time: who's speaking, timestamps, content
4. **Save Everything** — on session end: transcript + summary + metadata (duration, turns, etc.)
5. **Session History & Review** — filter/search past sessions, read transcripts, see summaries

---

## Feature Checklist

### A. Assistant Management

| Feature | Priority | Details |
|---------|----------|---------|
| Create assistant | MUST | Name, purpose/instructions, voice, language, status (draft/published), optional tools |
| Edit assistant | MUST | Update any field |
| Duplicate assistant | MUST | Clone an existing one |
| Archive assistant | MUST | Soft-delete only |
| Draft → Published flow | MUST | Draft assistants CANNOT be launched |
| Audit trail | MUST | Log who edited/published/archived and when |

### B. Live Session Screen

| Feature | Priority | Details |
|---------|----------|---------|
| Show assistant name | MUST | Header area |
| Show session state | MUST | "Connecting", "Active", "Ended", "Error" |
| Show who's speaking | MUST | Label each line as "User" or "Assistant" |
| Live transcript with timestamps | MUST | Real-time updates |
| End session button | MUST | Clear, prominent |
| Save transcript + metadata on end | MUST | Persisted to database |
| Handle mic permission failure | MUST | Clear error if mic blocked |
| Handle runtime unavailable | MUST | Show error, mark session failed |

### C. Session History

| Feature | Priority | Details |
|---------|----------|---------|
| List all sessions | MUST | Sortable/filterable table |
| Per-assistant sessions | MUST | Filter by assistant |
| Show duration | MUST | How long session lasted |
| Show turn count | MUST | Number of exchanges |
| Show date/time | MUST | When session happened |
| Full transcript view | MUST | Click into any session |
| Generated summary | MUST | AI-generated, clearly marked DRAFT |

### D. Product Quality

| Feature | Priority | Details |
|---------|----------|---------|
| Auth with 2 roles | MUST | Admin (full access) and Viewer (read-only) |
| Role-based restrictions | MUST | Viewers can't create/edit/publish/archive |
| Audit trail | MUST | Log edits, publishes, archives |
| Search/filter | MUST | Over assistants and sessions |
| Empty/loading/error states | MUST | No blank screens or silent failures |

### E. Deployment

| Feature | Priority | Details |
|---------|----------|---------|
| Local run instructions | MUST | npm install && npm start simplicity |
| Docker setup | MUST | docker-compose.yml that works |
| Ubuntu VM deploy instructions | MUST | Step-by-step for fresh VM |
| CI steps | MUST | Lint + test + build |

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 14+ (App Router) | SSR, API routes built in |
| Styling | Tailwind CSS | Fast, utility-first |
| Components | shadcn/ui | Accessible, professional |
| Data fetching | TanStack Query | Caching, loading states |
| Backend | Next.js API Routes | Monorepo simplicity |
| ORM | Prisma | Type-safe DB access |
| Database | PostgreSQL | JSONB support for transcripts |
| Voice | Mock (Phase 1) / OpenAI Realtime API (Phase 2) | Scope control |
| Auth | NextAuth.js | Simple, role-based |
| Deploy | Docker + docker-compose | Portable |
| CI | GitHub Actions | Standard |

---

## Data Model

```
users
  id            UUID  PK
  email         VARCHAR
  password_hash VARCHAR
  role          ENUM(admin, viewer)
  created_at    TIMESTAMP

assistants
  id            UUID  PK
  name          VARCHAR
  purpose       TEXT
  voice         VARCHAR
  language      VARCHAR
  status        ENUM(draft, published, archived)
  tools         JSONB
  created_by    UUID  FK → users
  created_at    TIMESTAMP
  updated_at    TIMESTAMP
  published_at  TIMESTAMP (nullable)
  version       INT

sessions
  id            UUID  PK
  assistant_id  UUID  FK → assistants
  operator_id   UUID  FK → users
  status        ENUM(active, completed, failed, needs_review)
  started_at    TIMESTAMP
  ended_at      TIMESTAMP (nullable)
  duration_secs INT
  turn_count    INT
  summary       JSONB
  metadata      JSONB

transcript_entries
  id            UUID  PK
  session_id    UUID  FK → sessions
  speaker       ENUM(user, assistant)
  content       TEXT
  timestamp     TIMESTAMP
  sequence      INT

audit_logs
  id            UUID  PK
  user_id       UUID  FK → users
  action        VARCHAR (created, edited, published, archived, duplicated)
  entity_type   VARCHAR (assistant, session)
  entity_id     UUID
  changes       JSONB
  created_at    TIMESTAMP
```

---

## Build Phases

| Phase | Time | What |
|-------|------|------|
| 1. Foundation | 1h | Next.js + Prisma + NextAuth + Docker |
| 2. Assistant Management | 1.5h | API routes + forms + list + audit |
| 3. Voice Session | 1.5h | WebSocket + mic + transcript + save |
| 4. Session History | 0.5h | List page + detail page |
| 5. Polish + Deploy + Docs | 1.5h | Error states + Docker + CI + README |

---

## Voice Session Strategy

**Phase 1 (Mock):** Full UI + backend, simulated WebSocket conversation. Document AI Engineer integration point.
**Phase 2 (Real):** OpenAI Realtime API or DIY pipeline.

---

## Design System

See `DESIGN_SYSTEM.md` for full theme spec.

### Quick Reference — Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent` | `#00c9af` | Primary buttons, active states, links |
| `--accent-hover` | `#00b39d` | Hover state for accent elements |
| `--bg-primary` | `#ffffff` | Page background |
| `--bg-card` | `#efebe5` | Cards, form sections |
| `--bg-dark` | `#1e2229` | Sidebar, dark sections |
| `--bg-dark-alt` | `#35393f` | Alternate dark sections |
| `--text-primary` | `#1e2229` | Body text on light |
| `--border` | `#e0dcd6` | Borders, dividers |
| `--error` | `#e74c3c` | Error states |
| `--warning` | `#f39c12` | Warning, needs-review |

### Fonts
- **Headings/Page titles:** `Saira Stencil One`
- **All other text:** `Inter`

---

## What Evaluators Care About Most

1. Product judgement — Did you build the RIGHT things?
2. UI clarity for non-technical users
3. Backend/data model quality
4. Version/status handling (Draft → Published → Archived)
5. Deployment realism
6. Access control (Admin vs Viewer)
7. Error handling
8. Explanation of trade-offs

---

## Key Rules

- **ALWAYS** label summaries as "DRAFT — For Staff Review"
- **NEVER** allow draft assistants to be launched
- **ALWAYS** handle mic permission failure explicitly
- **ALWAYS** include audit logs
- **NEVER** store transcripts only in browser memory
- **NEVER** hard-code API keys
- **NEVER** use real patient data

---

## Interview Follow-Up Prep

Design for these now so follow-up extensions are easy:
- `needs_review` already in session status enum
- `version` field on assistants (assistant_versions table later)
- `tools` as JSONB (extensible)
- `summary` as JSONB (flexible schema)
- Separate concerns: assistant config ≠ session data ≠ audit log

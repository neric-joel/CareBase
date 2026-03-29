# CareBase — Nonprofit Client & Case Management Platform

## Project Context
- **Hackathon:** WiCS x Opportunity Hack @ ASU, March 28–29, 2026 (24 hours)
- **What it is:** Open-source, AI-native case management web app for small nonprofits
- **Demo persona:** ICM Food & Clothing Bank (food assistance nonprofit in Phoenix)
- **Judging priority:** AI Usage (1st) > Polish (2nd) > Scope (3rd) > Accessibility (4th) > Security (5th)

## Tech Stack
- **Framework:** Next.js 14+ (App Router, TypeScript, `src/` directory)
- **UI:** shadcn/ui + Tailwind CSS
- **Database:** Supabase (PostgreSQL + Auth + RLS + pgvector)
- **AI:** Anthropic Claude API (claude-sonnet-4-6), Voyage AI voyage-3-lite embeddings
- **Hosting:** Vercel
- **Package manager:** npm

## Code Conventions
- TypeScript strict mode. No `any` types.
- No `console.log` in committed code. Use proper error handling.
- No placeholder or truncated code. Write everything in full.
- Secrets in `.env.local` only — never in source. Verify `.gitignore` before first commit.
- Use `@/` import alias for all project imports.
- React Server Components by default. Use `"use client"` only when needed (interactivity, hooks, browser APIs).
- All API routes: validate input with zod, return typed JSON responses, handle errors with try/catch.
- Prefer named exports over default exports for components.

## Database Schema

### Tables

**users** (extends Supabase auth.users)
```sql
id          uuid PRIMARY KEY REFERENCES auth.users
role        text NOT NULL CHECK (role IN ('admin', 'staff')) DEFAULT 'staff'
full_name   text NOT NULL
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()
```

**clients**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id       text UNIQUE NOT NULL  -- human-readable like "CB-0001"
first_name      text NOT NULL
last_name       text NOT NULL
date_of_birth   date
phone           text
email           text
address         text
custom_fields   jsonb DEFAULT '{}'  -- configurable: household_size, dietary_restrictions, etc.
created_by      uuid REFERENCES users(id)
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**service_entries**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE
service_date    date NOT NULL
service_type    text NOT NULL  -- 'Food Box Pickup', 'Clothing Assistance', etc.
staff_id        uuid REFERENCES users(id)
notes           text
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**prompts**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text UNIQUE NOT NULL  -- 'photo-intake', 'handoff-summary'
system_prompt   text NOT NULL
version         integer DEFAULT 1
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

**note_embeddings**
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
service_entry_id    uuid UNIQUE REFERENCES service_entries(id) ON DELETE CASCADE
embedding           vector(512)  -- voyage-3-lite dimension
content             text NOT NULL  -- denormalized text that was embedded
created_at          timestamptz DEFAULT now()
```

### Extensions Required
- `pgvector` — for semantic search embeddings
- `pg_trgm` — for fuzzy text search on client names

### RLS Rules
- All tables have RLS enabled
- Admin: full CRUD on all tables
- Staff: SELECT + INSERT on clients and service_entries, SELECT on prompts
- No public access without auth
- note_embeddings follows service_entries policy

### RPC Functions
- `match_notes(query_embedding vector, match_threshold float, match_count int)` — cosine similarity search

## File Ownership Map (for parallel agents)

```
BACKEND AGENT owns:
├── supabase/                    # migrations, seed, config
├── src/lib/supabase/            # client.ts, server.ts, types.ts
├── src/app/api/                 # all API routes EXCEPT /api/ai/
│   ├── clients/
│   ├── service-entries/
│   └── prompts/
└── src/types/                   # shared TypeScript types/interfaces

FRONTEND AGENT owns:
├── src/app/(auth)/              # login, signup pages
├── src/app/(dashboard)/         # all dashboard pages
│   ├── clients/
│   ├── service/
│   ├── search/
│   └── page.tsx                 # dashboard home
├── src/components/ui/           # shadcn components
├── src/components/layout/       # sidebar, header, nav
├── src/components/forms/        # client form, service form
├── src/app/layout.tsx
├── src/app/globals.css
└── public/

AI FEATURES AGENT owns:
├── src/app/api/ai/              # all AI API routes
│   ├── photo-intake/route.ts
│   ├── embed/route.ts
│   ├── search/route.ts
│   └── handoff-summary/route.ts
├── src/lib/ai/                  # AI utilities
│   ├── anthropic.ts             # Claude client setup
│   ├── embeddings.ts            # Voyage AI embedding helper
│   └── prompts.ts               # prompt loading from DB
└── src/components/ai/           # AI-specific UI components
    ├── photo-intake-button.tsx
    ├── semantic-search.tsx
    └── handoff-summary-card.tsx

SHARED (coordinate before editing):
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── .env.local
└── middleware.ts                # auth middleware
```

## API Route Structure

```
/api/
├── clients/
│   ├── route.ts                 # GET (list+search), POST (create)
│   └── [id]/route.ts            # GET, PATCH, DELETE (admin only)
├── service-entries/
│   ├── route.ts                 # GET (by client_id), POST (create)
│   └── [id]/route.ts            # GET, PATCH, DELETE
├── ai/
│   ├── photo-intake/route.ts    # POST: image → Claude Vision → JSON fields
│   ├── embed/route.ts           # POST: text → embedding → store in DB
│   ├── search/route.ts          # POST: query → embed → pgvector cosine search
│   └── handoff-summary/route.ts # POST: client_id → all notes → Claude → summary
└── prompts/route.ts             # GET, POST/PATCH (admin only)
```

## AI Architecture Rules
- ALL LLM calls go through `/api/ai/[action]` server routes. Never call AI client-side.
- Every AI output is a **draft**. User reviews before saving. Nothing auto-saves.
- Never put one client's PII in a context window with another client's data.
- All LLM calls: try/catch, 30-second timeout, JSON response validation, user-facing error on failure.
- System prompts loaded from DB `prompts` table (not hardcoded).
- Audio is ephemeral — never stored, only transcript + structured output.

## Auth
- Supabase Auth with BOTH email/password and Google SSO
- Two roles: `admin` (full CRUD) and `staff` (read + create)
- Pre-seeded demo accounts: admin@carebase.demo / Demo1234!, staff@carebase.demo / Demo1234!
- Auth middleware protects all routes except login page

## Seed Data Plan
- **12 clients** with diverse Phoenix-area demographics
- **35+ service entries** spanning Jan–Mar 2026
- **5 service types:** Food Box Pickup, Clothing Assistance, Emergency Grocery, Holiday Meal Kit, Benefits Referral
- **Star client (Maria Garcia):** 20+ case notes with a full 6-month arc for AI Handoff Summary demo
- Case notes use **varied natural language** for Semantic Search demos (housing = "Habitat", "Section 8", "eviction", "shelter")

## UI Checklist (verify before calling any feature done)
- [ ] Color contrast 4.5:1
- [ ] All inputs have visible labels
- [ ] Icon-only buttons have aria-label
- [ ] Focus rings visible
- [ ] Loading state handled (spinner or skeleton)
- [ ] Error state shown near problem field
- [ ] Mobile works at 375px (no horizontal scroll)

## Security Rules
- `.env.local` in `.gitignore` from day one
- Auth boundary is Supabase RLS — never rely on client-side checks alone
- Input validation (zod) on all API routes
- No hardcoded keys anywhere
- Sanitize all user input before rendering

## Sub-Agent Routing Rules

### Parallel dispatch (ALL conditions must be met):
- Tasks span different file ownership domains (see File Ownership Map)
- No shared state or file overlap between tasks
- Each task has clear, independent acceptance criteria

### Sequential dispatch (ANY condition triggers):
- Task B depends on output from Task A (e.g., DB schema before API routes)
- Tasks touch the same files (e.g., both need package.json)
- Unclear scope that needs exploration first

### Recommended parallel patterns for CareBase:
```
PARALLEL OK:
├── Backend: Write migration SQL + seed script
├── Frontend: Scaffold pages + layout + shadcn components
└── AI: Design system prompts + write AI utility functions

MUST BE SEQUENTIAL:
1. Backend: Create DB schema + types → THEN
2. Frontend: Build forms using those types → THEN  
3. AI: Build AI routes that query those tables
```

## Build Order (P0 → P1 → P2)

### P0 — Foundation (do first, sequential):
1. Scaffold Next.js app, install deps, configure .env
2. DB migration SQL (all tables + extensions + RLS + RPC)
3. Supabase client setup (browser + server)
4. Auth middleware + login page
5. TypeScript types for all tables

### P0 — Features (can parallelize after foundation):
6. Client list page (search, paginated)
7. Client registration form
8. Client profile view (demographics + service history)
9. Service/visit log form
10. Seed script
11. Deploy to Vercel

### P1 — AI Features (sequential, each builds on previous):
12. Photo-to-Intake
13. Semantic Search (embed on save + search page)
14. AI Handoff Summary

### P2 — Polish:
15. CSV export
16. Dashboard stats
17. WCAG audit
18. README + deploy button

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=
```

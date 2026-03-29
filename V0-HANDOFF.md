# ---HANDOFF---

## Version: v0.1 — Brainstorm & Architecture Complete (Updated)

## Built:
- Full brainstorm session completed
- Researched OHack DevPost judging rubric (5 criteria: AI Usage > Polish > Scope > Accessibility > Security)
- Researched competitor landscape (Bonterra Apricot $50–150/user/mo, CharityTracker $20/user/mo)
- Product name: **CareBase** (working title — can rename later, it's just a string)
- Demo persona locked: **ICM Food & Clothing Bank** with realistic seed data
- All 3 AI features and build order confirmed
- Tech stack and all architectural decisions locked
- Auth approach decided: **both email/password AND Google SSO**
- Sprint timeline defined (24hr plan)
- Complete system architecture defined (DB + AI API layer + UI)

## File tree:
(no code written yet — this is pre-build planning only)

## Context:
- **Hackathon:** WiCS x Opportunity Hack @ ASU, March 28–29, 2026, 24 hours
- **Team:** Solo or duo, strong full-stack JS/React
- **Judging priority:** AI Usage (1st) → Polish (2nd) → Scope (3rd) → Accessibility (4th) → Security (5th)
- **User has:** Anthropic API key ready, needs to create Supabase project
- **No code written yet** — v1 starts from zero

---

## Key Decisions (ALL LOCKED):

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Stack | Next.js 14 App Router · shadcn/ui · Tailwind · Supabase · Vercel · Anthropic Claude API | Mainstream, fast to build, free tier covers MVP |
| LLM Model | claude-sonnet-4-6 for all LLM calls | Best balance of speed/quality/cost |
| Embeddings | OpenAI text-embedding-3-small | Simplest, Supabase pgvector docs use this natively |
| Auth | Supabase Auth — BOTH email/password AND Google SSO | Email/pass for reliable demo, Google SSO for polish. Two roles: Admin (full CRUD) and Staff (read + create). Pre-seed demo accounts: admin@carebase.demo / staff@carebase.demo |
| Custom fields | JSONB column on clients table | Configurable per-nonprofit without code changes |
| AI routes | Server-side only via /api/ai/[action] | Never call AI APIs client-side |
| AI output | Always a draft — user reviews before saving, nothing auto-saves | Non-negotiable for trust |
| Audio | Ephemeral — never stored, only transcript + structured output | Privacy by design |
| Color palette | Teal primary + Slate neutral + Amber accent (for AI badges) | Deferred — use shadcn defaults, customize later |
| Demo persona | ICM Food & Clothing Bank | Simple, relatable, great for AI demos |
| App name | CareBase | Working title, trivial to rename |

---

## Database Schema Plan:

### Tables:

**users** (extends Supabase auth.users)
- id (uuid, PK, references auth.users)
- role (text: 'admin' | 'staff')
- full_name (text)
- created_at (timestamptz)
- updated_at (timestamptz)

**clients**
- id (uuid, PK, default gen_random_uuid())
- client_id (text, unique, auto-generated human-readable ID like "CB-0001")
- first_name (text, NOT NULL)
- last_name (text, NOT NULL)
- date_of_birth (date)
- phone (text)
- email (text)
- address (text)
- custom_fields (jsonb, default '{}') — configurable demographics like household_size, dietary_restrictions, language_preference
- created_by (uuid, references users)
- created_at (timestamptz)
- updated_at (timestamptz)

**service_entries**
- id (uuid, PK, default gen_random_uuid())
- client_id (uuid, FK → clients, NOT NULL)
- service_date (date, NOT NULL)
- service_type (text, NOT NULL) — e.g., 'Food Box Pickup', 'Clothing Assistance', 'Emergency Grocery', 'Holiday Meal Kit', 'Benefits Referral'
- staff_id (uuid, FK → users)
- notes (text) — free-text case notes
- created_at (timestamptz)
- updated_at (timestamptz)

**prompts**
- id (uuid, PK)
- name (text, unique) — e.g., 'photo-intake', 'handoff-summary', 'voice-notes'
- system_prompt (text, NOT NULL)
- version (integer, default 1)
- is_active (boolean, default true)
- created_at (timestamptz)
- updated_at (timestamptz)

**note_embeddings** (for Semantic Search)
- id (uuid, PK)
- service_entry_id (uuid, FK → service_entries, unique)
- embedding (vector(1536)) — OpenAI text-embedding-3-small output dimension
- content (text) — the text that was embedded (denormalized for retrieval)
- created_at (timestamptz)

### RLS Policies:
- All tables have RLS enabled
- Admin role: full CRUD on all tables
- Staff role: SELECT + INSERT on clients and service_entries, SELECT on prompts
- Users can only see data — no public access without auth
- note_embeddings follows same policy as service_entries

### Required Extensions:
- pgvector (for semantic search embeddings)
- pg_trgm (for fuzzy text search on client names)

### RPC Functions:
- match_notes(query_embedding vector, match_threshold float, match_count int) — cosine similarity search for Semantic Search feature

---

## Seed Data Plan (ICM Food & Clothing Bank):

**12 clients** — diverse Phoenix-area names, household sizes 1–6, mix of demographics:
- Maria Garcia (STAR CLIENT — 20+ case notes, 6-month arc: job loss → food assistance → housing referral → husband employed → stabilizing)
- James Wilson, Priya Patel, Robert Thompson, Ana Morales, David Chen, Sarah Johnson, Omar Hassan, Lisa Redbird, Carlos Mendez, Fatima Al-Hassan, Michael Brown

**35+ service entries** spanning Jan–Mar 2026

**5 service types:** Food Box Pickup, Clothing Assistance, Emergency Grocery, Holiday Meal Kit, Benefits Referral

**Case notes written with varied natural language** for Semantic Search demos:
- Housing references: "Habitat for Humanity", "Section 8", "eviction notice", "apartment search", "shelter" (so "clients who need housing help" finds them all)
- Family references: "toddler", "baby", "school-age", "teenager" (so "families with young children" works)
- Health references: "diabetic", "sugar-free", "medical diet", "insulin" (so "dietary restrictions" works)

**2 pre-seeded auth accounts:**
- admin@carebase.demo / Demo1234! (Admin role)
- staff@carebase.demo / Demo1234! (Staff role)

---

## API Route Structure:

```
/api/
├── auth/
│   └── callback/          # Supabase auth callback for Google SSO
├── clients/
│   ├── route.ts           # GET (list + search), POST (create)
│   └── [id]/
│       └── route.ts       # GET (single), PATCH (update), DELETE (admin only)
├── service-entries/
│   ├── route.ts           # GET (by client_id), POST (create)
│   └── [id]/
│       └── route.ts       # GET (single), PATCH, DELETE
├── ai/
│   ├── photo-intake/
│   │   └── route.ts       # POST: image → Claude Vision → extracted fields JSON
│   ├── embed/
│   │   └── route.ts       # POST: text → OpenAI embedding → stored in note_embeddings
│   ├── search/
│   │   └── route.ts       # POST: query text → embed → pgvector cosine search → results
│   └── handoff-summary/
│       └── route.ts       # POST: client_id → fetch all notes → Claude → structured summary
└── prompts/
    └── route.ts           # GET (active prompts), POST/PATCH (admin only)
```

### AI Architecture Rules (apply to ALL /api/ai/* routes):
- try/catch with 30s timeout on every LLM call
- JSON response validation on every LLM output
- User-facing error message on failure (never raw error)
- Never put one client's PII in context with another client's data
- System prompts loaded from DB prompts table (not hardcoded)
- All AI output returned as draft — client UI shows review step before save

---

## App Page Structure:

```
/app
├── layout.tsx             # Root layout with sidebar nav
├── page.tsx               # Dashboard (redirect to /clients or show stats)
├── login/
│   └── page.tsx           # Login page (email/pass + Google SSO button)
├── clients/
│   ├── page.tsx           # Client list (search, paginated, "New Client" button)
│   ├── new/
│   │   └── page.tsx       # Client registration form (+ Photo-to-Intake button)
│   └── [id]/
│       └── page.tsx       # Client profile (demographics top, service history below, "AI Summary" button)
├── service/
│   └── new/
│       └── page.tsx       # Service/visit log form (select client, type, date, notes)
└── search/
    └── page.tsx           # Semantic search page (natural language search bar + results)
```

---

## AI Features (build in this order AFTER P0 CRUD is deployed):

### 1. Photo-to-Intake (P1, ~2–4 hours)
- Camera/upload button on client registration page
- Image sent to /api/ai/photo-intake
- Claude Vision extracts form fields, returns JSON matching client schema
- JSON pre-fills the registration form
- Staff reviews and clicks Save (nothing auto-saves)
- Cost: ~$0.01–0.05 per image

### 2. Semantic Search (P1, ~2–4 hours)
- On every service_entry save, call /api/ai/embed to generate + store embedding
- Search bar on dashboard/search page
- Query text embedded, then pgvector cosine similarity search via match_notes RPC
- Results show client name, matching note snippet, relevance score
- Seed data embeddings generated on startup via seed script
- Cost: ~$0.001 per query

### 3. AI Handoff Summary (P1, ~2–3 hours)
- "Generate Summary" button on client profile page
- Fetches ALL notes for that client via /api/ai/handoff-summary
- Claude generates structured brief: Background, Services History, Current Status, Active Needs, Risk Factors, Recommended Next Steps
- Displayed as a draft card on profile — staff can regenerate or dismiss
- Demo with Maria Garcia (20+ notes → one-page summary)
- Cost: $0.02–0.10 per summary

---

## Build Order (P0 → P1 → P2):

### P0 — Must ship first (Hours 0–12):
1. Create Supabase project + get keys
2. Scaffold Next.js 14 app with shadcn/ui + Tailwind
3. Configure .env.local, .gitignore (secrets never in source)
4. Configure Supabase Auth (email/password + Google SSO, two roles: Admin/Staff)
5. Write full DB migration SQL (all tables + pgvector + RLS policies + RPC functions)
6. Auth middleware + protected routes
7. App layout with sidebar navigation
8. Login page (email/pass fields + Google SSO button)
9. Client list page (search by name, paginated)
10. Client registration form (all fields including JSONB custom fields)
11. Client profile view (demographics top + reverse-chronological service history)
12. Service/visit log form (date, type dropdown, staff, notes)
13. Seed script (12 clients, 35+ entries, 2 demo accounts)
14. Deploy to Vercel (get public URL working)

### P1 — AI features (Hours 12–20):
1. Photo-to-Intake: /api/ai/photo-intake → Claude Vision → pre-fill registration form
2. Semantic Search: embed notes on save via /api/ai/embed, pgvector cosine search, search page
3. AI Handoff Summary: /api/ai/handoff-summary → Claude → structured brief on client profile

### P2 — Polish before submission (Hours 20–24):
1. CSV export (clients + service entries)
2. Basic dashboard stats (total clients, services this week/month)
3. WCAG audit (Lighthouse 95+ target, contrast 4.5:1, visible labels, focus rings)
4. README with one-click Vercel deploy button
5. Seed data script documented and runnable with `npm run seed`
6. Demo video recorded
7. Feature freeze → test edge cases → submit to DevPost

---

## .env vars needed:

```
NEXT_PUBLIC_SUPABASE_URL=           # from Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # from Supabase project settings
SUPABASE_SERVICE_ROLE_KEY=          # from Supabase project settings (server-side only)
ANTHROPIC_API_KEY=                  # user already has this
OPENAI_API_KEY=                     # needed for embeddings (text-embedding-3-small)
```

---

## UI Checklist (verify before calling any feature done):
- [ ] Color contrast 4.5:1
- [ ] All inputs have visible labels
- [ ] Icon-only buttons have aria-label
- [ ] Focus rings visible
- [ ] Loading state handled
- [ ] Error state shown near problem field
- [ ] Mobile works at 375px (no horizontal scroll)

---

## Unresolved:
- Supabase project not yet created (user needs to do this and provide keys)
- Color palette not finalized (using shadcn defaults, teal+slate+amber recommended)
- App name "CareBase" is working title — not confirmed
- OpenAI API key needed for embeddings (user needs to get this)
- Google Cloud Console OAuth credentials needed for Google SSO

---

# ---END---

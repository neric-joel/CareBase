# CareBase - AI-Native Nonprofit Client & Case Management

**Open-source, AI-powered case management for small nonprofits. Built for ICM Food & Clothing Bank.**

Built at **WiCS x Opportunity Hack @ ASU** | March 28-29, 2026
**Team A-Train:** Nirmalraju Kangeyan, Neric Joel Arul Joel Paulraj

---

## Demo Credentials

| Role  | Email                   | Password   |
|-------|-------------------------|------------|
| Admin | admin@carebase.demo     | Demo1234!  |
| Staff | staff@carebase.demo     | Demo1234!  |

---

## Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Framework  | Next.js 14 (App Router, TypeScript, Server Components)  |
| UI         | shadcn/ui + Tailwind CSS                                |
| Database   | Supabase (PostgreSQL + Auth + RLS + pgvector)           |
| AI         | Anthropic Claude API (Vision + Summarization)           |
| Embeddings | Google Gemini (gemini-embedding-001, 768-dim vectors)   |
| Hosting    | Vercel                                                  |

---

## Features

### Core (P0)

- **Client Registration** -- Create and manage client profiles with demographics and custom fields (household size, dietary restrictions, language preference)
- **Client Edit** -- Update client information from the profile page
- **Service Logging** -- Record visits by type: Food Box Pickup, Clothing Assistance, Emergency Grocery, Holiday Meal Kit, Benefits Referral
- **Client Profiles** -- Demographics card, full service history in reverse chronological order, AI handoff summary
- **Search** -- Fast client lookup by name with fuzzy matching (pg_trgm)
- **Role-Based Access** -- Admin (full CRUD) and Staff (read + create) roles enforced via Supabase RLS
- **CSV Import/Export** -- Bulk import clients from CSV files, export client data for reporting

### AI Features (P1)

- **Photo-to-Intake** -- Snap a photo of a paper intake form and Claude Vision extracts structured fields into the registration form. Staff reviews and edits before saving.
- **Semantic Search** -- Natural language queries across all case notes. "Who needs housing help?" returns relevant clients ranked by cosine similarity, powered by Gemini embeddings and pgvector.
- **AI Handoff Summary** -- One-click generation of a comprehensive client summary from all case notes. Designed for staff transitions, referrals, and case reviews.

### Admin & Compliance

- **Dashboard** -- At-a-glance stats (total clients, services this month, active this week), service type breakdown with bar charts, recent activity feed
- **Audit Log** -- Tracks all create/update/delete actions on clients and service entries. Admin-only access.
- **Admin Settings** -- View custom field configuration and AI system prompts
- **Configurable Prompts** -- System prompts stored in database, editable without code changes

---

## Quick Start

```bash
git clone https://github.com/neric-joel/CareBase.git
cd CareBase
npm install
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Run the migration SQL files in your Supabase SQL Editor:
1. `supabase/migrations/001_initial_schema.sql` -- Tables, RLS, functions, seed prompts
2. `supabase/migrations/002_audit_log_and_gemini.sql` -- Audit log + Gemini 768-dim vectors

Then seed demo data and start:

```bash
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the demo credentials above.

To generate embeddings for AI semantic search:

```bash
npx tsx scripts/embed-notes.ts
```

---

## Deploy to Vercel

1. Push your repo to GitHub
2. Import the project in Vercel
3. Add the five environment variables (see `.env.local.example`)
4. Run both migration SQL files in your Supabase project
5. Deploy

---

## AI Architecture

All AI functionality follows four strict principles:

1. **Server-side only** -- Every LLM and embedding call goes through `/api/ai/` server routes. No AI API keys are exposed to the client.

2. **Human-in-the-loop** -- All AI output is treated as a draft. Photo-to-Intake populates form fields for review. Handoff Summaries display with an "AI Draft" badge. Nothing auto-saves.

3. **Privacy by design** -- No cross-client PII in context windows. Each AI call operates on a single client's data only. Image inputs are ephemeral and never stored.

4. **Customizable prompts** -- System prompts are stored in the `prompts` database table, not hardcoded. Admins can iterate on prompt engineering without code changes.

### AI Route Map

```
POST /api/ai/photo-intake      Image -> Claude Vision -> structured intake fields
POST /api/ai/embed              Service note text -> Gemini -> vector stored in DB
POST /api/ai/search             Natural language query -> embedding -> pgvector cosine search
POST /api/ai/handoff-summary    Client ID -> all notes -> Claude -> narrative summary
```

---

## Project Structure

```
src/
  app/
    (auth)/          Login page
    (dashboard)/     Dashboard, Clients, Service Log, Search, Admin, Audit
    api/             REST + AI routes
  components/
    ui/              shadcn/ui components + CSV import/export
    layout/          Sidebar, Header
    ai/              Photo Intake, Semantic Search, Handoff Summary
  lib/
    supabase/        Database clients (browser + server)
    ai/              Claude + Gemini AI utilities, prompt loading
    audit.ts         Audit logging utility
scripts/
    seed.ts          Demo data seeder (12 clients, 40 service entries)
    embed-notes.ts   Batch embedding generator for semantic search
supabase/
  migrations/        SQL schema, RLS policies, seed data
```

---

## License

MIT

---

**Built at WiCS x Opportunity Hack 2026** -- Arizona State University, March 28-29, 2026

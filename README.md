<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Anthropic-Claude_AI-D4A574?style=for-the-badge&logo=anthropic&logoColor=white" alt="Claude AI" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<h1 align="center">CareBase</h1>

<p align="center">
  <strong>AI-Native Nonprofit Client & Case Management Platform</strong>
</p>

<p align="center">
  Open-source, AI-powered case management built specifically for food banks, clothing programs, and social services.<br/>
  Built for <strong>ICM Food & Clothing Bank</strong>.
</p>

<p align="center">
  <a href="https://carebase-murex.vercel.app"><strong>Live Demo</strong></a> &nbsp;·&nbsp;
  <a href="#demo-credentials"><strong>Demo Login</strong></a> &nbsp;·&nbsp;
  <a href="#features"><strong>Features</strong></a> &nbsp;·&nbsp;
  <a href="#ai-architecture"><strong>AI Architecture</strong></a>
</p>

---

## Live Demo

**[https://carebase-murex.vercel.app](https://carebase-murex.vercel.app)**

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@carebase.demo` | `Demo1234!` |
| **Staff** | `staff@carebase.demo` | `Demo1234!` |

> **Admin** has full access: client CRUD, CSV import, audit log, admin settings, delete operations.
> **Staff** has standard access: view clients, log services, use AI features, view dashboard.

---

## Hackathon

Built at **WiCS x Opportunity Hack @ ASU** | March 28--29, 2026

**Team A-Train**
- Nirmalraju Kangeyan
- Neric Joel Arul Joel Paulraj

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router, TypeScript, Server Components) |
| **UI** | shadcn/ui + Tailwind CSS |
| **Database** | Supabase (PostgreSQL + Auth + RLS + pgvector) |
| **AI - Vision & Summarization** | Anthropic Claude API (claude-sonnet-4-6) |
| **AI - Embeddings** | Google Gemini (gemini-embedding-001, 768-dim vectors) |
| **AI - Voice** | Web Speech API (browser-native speech recognition) |
| **Email** | Resend (appointment notifications) |
| **Hosting** | Vercel |

---

## Features

### Core Platform (P0)

| Feature | Description |
|---------|-------------|
| **Client Registration** | Create and manage client profiles with demographics, household info, dietary needs, language preferences, and custom fields |
| **Client Edit & Delete** | Update client information from profile page. Admin-only delete with confirmation |
| **Service Logging** | Record visits by type: Food Box Pickup, Clothing Assistance, Emergency Grocery, Holiday Meal Kit, Benefits Referral, and more |
| **Client Profiles** | Demographics card, full service history (reverse chronological), AI handoff summary generation |
| **Search** | Fast client lookup by name with fuzzy matching (pg_trgm) |
| **Role-Based Access** | Admin (full CRUD) and Staff (read + create) roles enforced via Supabase RLS + middleware |
| **CSV Import/Export** | Bulk import clients from CSV files (admin-only), export client data |
| **Dashboard** | Real-time stats, service type breakdown charts, visit trends over time, upcoming appointments, recent activity |

### AI Features (P1)

| Feature | How It Works |
|---------|-------------|
| **Photo-to-Intake** | Snap a photo of a paper intake form → Claude Vision extracts structured fields → staff reviews and edits before saving |
| **Semantic Search** | Natural language queries across all case notes → Gemini embeddings + pgvector cosine similarity → ranked results |
| **AI Handoff Summary** | One-click generation of comprehensive client summary from all case notes → designed for shift changes, referrals, case transfers |
| **Voice-to-Structured Notes** | Speak session notes via Web Speech API (or type manually) → Claude structures into professional case notes with service type, action items, risk flags, mood assessment |

### Scheduling & Notifications (P2)

| Feature | Description |
|---------|-------------|
| **Weekly Calendar** | Visual weekly calendar view with appointment management |
| **Appointment CRUD** | Create, view, complete, and cancel appointments for any client |
| **Email Notifications** | Automated email via Resend when appointments are created |
| **In-App Reminders** | Toast notifications for appointments within the next 2 hours |

### Admin & Compliance

| Feature | Description |
|---------|-------------|
| **Audit Log** | Every create/update/delete action logged with timestamp and user. PII-safe -- no client names, emails, phone numbers, or note content logged |
| **Admin Panel** | View system prompts, custom field configuration |
| **Print Support** | Print-optimized CSS for dashboard and client profiles |
| **Configurable AI Prompts** | System prompts stored in database, editable without code changes |

---

## AI Architecture

All AI functionality follows four strict principles:

1. **Server-side only** -- Every LLM and embedding call goes through `/api/ai/` server routes. No AI API keys are exposed to the client.

2. **Human-in-the-loop** -- All AI output is treated as a draft. Photo-to-Intake populates form fields for review. Handoff Summaries display with an "AI Draft" badge. Nothing auto-saves.

3. **Privacy by design** -- No cross-client PII in context windows. Each AI call operates on a single client's data only. Image inputs are ephemeral and never stored.

4. **Customizable prompts** -- System prompts are stored in the `prompts` database table, not hardcoded. Admins can iterate on prompt engineering without code changes.

### AI Route Map

```
POST /api/ai/photo-intake      Image → Claude Vision → structured intake fields
POST /api/ai/structure-note    Voice transcript → Claude → structured case note with service type, action items, risk flags
POST /api/ai/embed             Service note text → Gemini → 768-dim vector stored in DB
POST /api/ai/search            Natural language query → Gemini embedding → pgvector cosine similarity search
POST /api/ai/handoff-summary   Client ID → all notes → Claude → narrative summary with background, needs, risks
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- Anthropic API key
- Google Gemini API key

### Installation

```bash
git clone https://github.com/neric-joel/CareBase.git
cd CareBase
npm install
```

### Environment Setup

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Google Gemini (for embeddings)
GEMINI_API_KEY=AIza...

# Resend (optional - for email notifications)
RESEND_API_KEY=re_xxxxxxxxxxxx
NOTIFICATION_EMAIL=your-email@example.com
```

### Database Setup

Run the migration SQL files in your Supabase SQL Editor (in order):

1. `supabase/migrations/001_initial_schema.sql` -- Tables, RLS policies, functions, seed prompts
2. `supabase/migrations/002_audit_log_and_gemini.sql` -- Audit log table + Gemini 768-dim vector support
3. `supabase/migrations/003_appointments.sql` -- Appointments table and scheduling

### Seed & Run

```bash
npm run seed          # Seeds 12 demo clients + 40 service entries
npm run dev           # Start development server
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the demo credentials above.

### Generate Embeddings (for Semantic Search)

```bash
npx tsx scripts/embed-notes.ts
```

---

## Deploy to Vercel

1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local.example`
4. Run all three migration SQL files in your Supabase project
5. Add your Vercel URL to Supabase → Authentication → URL Configuration
6. Deploy

---

## Project Structure

```
CareBase/
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Login page (no public signup)
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/         # Stats, charts, activity feed
│   │   │   ├── clients/           # Client list, profile, edit
│   │   │   ├── service/new/       # Service entry logging
│   │   │   ├── search/            # AI semantic search
│   │   │   ├── calendar/          # Weekly appointment calendar
│   │   │   ├── admin/             # Admin settings panel
│   │   │   └── audit/             # Audit log viewer
│   │   ├── api/
│   │   │   ├── ai/                # photo-intake, structure-note, embed, search, handoff-summary
│   │   │   ├── clients/           # CRUD + CSV import
│   │   │   ├── service-entries/   # CRUD
│   │   │   ├── appointments/      # CRUD + status updates
│   │   │   ├── audit-log/         # Admin-only audit log API
│   │   │   └── notifications/     # Email notifications via Resend
│   │   └── pricing/               # Pricing page
│   ├── components/
│   │   ├── ai/                    # VoiceNoteRecorder, SemanticSearch, PhotoIntake
│   │   ├── landing/               # LandingPage, PricingPage
│   │   ├── layout/                # Sidebar, Header, AppointmentReminder
│   │   └── ui/                    # shadcn/ui, ImportCSVButton, PrintButton
│   ├── lib/
│   │   ├── supabase/              # Database clients (browser + server)
│   │   ├── ai/                    # Claude + Gemini utilities, prompt loader
│   │   └── audit.ts               # PII-safe audit logging
│   └── types/                     # database.ts, supabase.ts, speech-recognition.d.ts
├── scripts/
│   ├── seed.ts                    # Demo data (12 clients, 40 service entries)
│   └── embed-notes.ts             # Batch embedding generator
├── supabase/migrations/
│   ├── 001_initial_schema.sql     # Tables, RLS, functions, seed prompts
│   ├── 002_audit_log_and_gemini.sql
│   └── 003_appointments.sql
└── middleware.ts                   # Auth guards, session refresh, route protection
```

---

## Security & Privacy

- **Authentication** -- Supabase Auth with login-only access (no public signup). Users are admin-created.
- **Authorization** -- Row-Level Security (RLS) policies on all tables. Middleware guards all protected routes.
- **Role Enforcement** -- Dual fallback: queries `app_users` table first, falls back to `user.user_metadata.role`.
- **Audit Trail** -- Every action logged with timestamp and user ID. PII fields (name, email, phone, address, notes) are never stored in audit logs.
- **AI Privacy** -- Each AI call scoped to single client. No cross-client data leakage. Image inputs are ephemeral.

---

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

You are free to use, modify, and distribute this software. See the `LICENSE` file for details.

---

<p align="center">
  <sub>Built with care at <strong>WiCS x Opportunity Hack 2026</strong> | Arizona State University | March 28--29, 2026</sub><br/>
  <sub><strong>Team A-Train</strong> -- Nirmalraju Kangeyan & Neric Joel Arul Joel Paulraj</sub>
</p>

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
  <strong>AI-Native Nonprofit Client &amp; Case Management Platform</strong>
</p>

<p align="center">
  Open-source, AI-powered case management built specifically for food banks, clothing programs, and social services.<br/>
  Built for <strong>ICM Food &amp; Clothing Bank</strong> at WiCS x Opportunity Hack @ ASU 2026.
</p>

<p align="center">
  <a href="https://carebase-murex.vercel.app"><strong>Live Demo</strong></a> &nbsp;·&nbsp;
  <a href="https://www.youtube.com/watch?v=YtwZh96U1F8"><strong>Demo Video</strong></a> &nbsp;·&nbsp;
  <a href="#demo-credentials"><strong>Demo Login</strong></a> &nbsp;·&nbsp;
  <a href="#features"><strong>Features</strong></a>
</p>

---

## Team

**Team Name:** A-Train

**Members:**
- Nirmalraju Kangeyan
- Neric Joel Arul Joel Paulraj

**Slack Channel:** [#C0APDJC9NLD](https://app.slack.com/client/T1Q7936BH/C0APDJC9NLD)

**Hackathon:** WiCS x Opportunity Hack @ ASU | March 28--29, 2026

---

## Problem Statement

Nonprofits like ICM Food & Clothing Bank serve hundreds of clients each month — tracking food box pickups, clothing assistance, benefits referrals, and emergency aid. Today, most organizations still rely on paper forms, spreadsheets, or outdated case management software that costs $20–150 per staff member per month and offers no AI assistance.

Case managers waste hours on documentation, struggle to find client history during handoffs, and cannot detect patterns across their caseload. When a client's situation changes — job loss, housing instability, medical emergency — staff have no fast way to surface that context.

**CareBase solves this** with an affordable, AI-native platform that lets nonprofits:
- Register clients in seconds (including via photo of a paper form)
- Log services with structured, searchable notes
- Generate instant AI handoff summaries for shift changes
- Search case notes with natural language ("clients facing housing instability")
- Schedule appointments with automatic email notifications
- Track everything with a privacy-safe audit trail

Priced per organization (not per user), so onboarding a new volunteer never costs more.

---

## Links

| | Link |
|---|---|
| **Live Demo** | https://carebase-murex.vercel.app |
| **Demo Video** | https://www.youtube.com/watch?v=YtwZh96U1F8 |
| **GitHub Repo** | https://github.com/2026-ASU-WiCS-Opportunity-Hack/26-a-train |
| **Slack Channel** | https://app.slack.com/client/T1Q7936BH/C0APDJC9NLD |

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@carebase.demo` | `Demo1234!` |
| **Staff** | `staff@carebase.demo` | `Demo1234!` |

> **Admin** has full access: client CRUD, CSV import, audit log, admin settings, delete operations.
> **Staff** has standard access: view clients, log services, use AI features, view dashboard.

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

### Core Platform

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

### AI Features

| Feature | How It Works |
|---------|-------------|
| **Photo-to-Intake** | Snap a photo of a paper intake form → Claude Vision extracts structured fields → staff reviews and edits before saving |
| **Semantic Search** | Natural language queries across all case notes → Gemini embeddings + pgvector cosine similarity → ranked results |
| **AI Handoff Summary** | One-click generation of comprehensive client summary from all case notes → designed for shift changes, referrals, case transfers |
| **Voice-to-Structured Notes** | Speak session notes via Web Speech API → Claude structures into professional case notes with service type, action items, risk flags, mood assessment |

### Scheduling & Notifications

| Feature | Description |
|---------|-------------|
| **Weekly Calendar** | Visual weekly calendar view with appointment management |
| **Appointment CRUD** | Create, view, complete, and cancel appointments for any client |
| **Email Notifications** | Automated email via Resend when appointments are created |
| **In-App Reminders** | Toast notifications for appointments within the next 2 hours |

### Admin & Compliance

| Feature | Description |
|---------|-------------|
| **Audit Log** | Every create/update/delete action logged with timestamp and user. PII-safe -- no client names, emails, or note content logged |
| **Admin Panel** | View system prompts, custom field configuration |
| **Configurable AI Prompts** | System prompts stored in database, editable without code changes |

---

## How to Run Locally

### Prerequisites

- Node.js 18+
- A Supabase project (free tier works)
- Anthropic API key
- Google Gemini API key

### Installation

```bash
git clone https://github.com/2026-ASU-WiCS-Opportunity-Hack/26-a-train.git
cd 26-a-train
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

Run the migration SQL files in your Supabase SQL Editor in order:

1. `supabase/migrations/001_initial_schema.sql` — Tables, RLS policies, functions, seed prompts
2. `supabase/migrations/002_audit_log_and_gemini.sql` — Audit log table + Gemini 768-dim vector support
3. `supabase/migrations/003_appointments.sql` — Appointments table and scheduling

### Seed & Run

```bash
npm run seed          # Seeds 12 demo clients + 40 service entries
npm run dev           # Start development server at http://localhost:3000
```

Sign in with the demo credentials above.

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
│   │   └── pricing/               # Public pricing page
│   ├── components/
│   │   ├── ai/                    # VoiceNoteRecorder, SemanticSearch, PhotoIntake, HandoffSummary
│   │   ├── landing/               # LandingPage, PricingPage
│   │   ├── layout/                # Sidebar, Header, AppointmentReminder
│   │   └── ui/                    # shadcn/ui components, ImportCSVButton, PrintButton
│   ├── lib/
│   │   ├── supabase/              # Database clients (browser + server)
│   │   ├── ai/                    # Claude + Gemini utilities, prompt loader
│   │   └── audit.ts               # PII-safe audit logging
│   └── types/                     # database.ts, supabase.ts
├── scripts/
│   ├── seed.ts                    # Demo data (12 clients, 40 service entries)
│   └── embed-notes.ts             # Batch embedding generator
├── supabase/migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_audit_log_and_gemini.sql
│   └── 003_appointments.sql
└── middleware.ts                   # Auth guards, session refresh, route protection
```

---

## License

This project is licensed under the [MIT License](LICENSE).

You are free to use, modify, and distribute this software.

---

<p align="center">
  <sub>Built with care at <strong>WiCS x Opportunity Hack 2026</strong> | Arizona State University | March 28--29, 2026</sub><br/>
  <sub><strong>Team A-Train</strong> — Nirmalraju Kangeyan &amp; Neric Joel Arul Joel Paulraj</sub>
</p>

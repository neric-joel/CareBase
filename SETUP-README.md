# CareBase — Claude Code Multi-Agent Setup

## Quick Start

### 1. Copy these files into your project root:

```
your-project/
├── CLAUDE.md                    ← project instructions (all agents read this)
├── .claude/
│   ├── settings.json            ← enables agent teams + permissions
│   └── agents/
│       ├── backend.md           ← DB, API routes, auth, types
│       ├── frontend.md          ← pages, components, layout, UI
│       ├── ai-features.md       ← AI routes, Claude API, embeddings
│       └── reviewer.md          ← read-only code reviewer (runs on Haiku)
```

### 2. Enable Agent Teams globally (if not using project settings):

Add to `~/.claude/settings.json`:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### 3. Set up your environment:

Create `.env.local` in project root:
```
NEXT_PUBLIC_SUPABASE_URL=your-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
```

### 4. Start Claude Code and kick it off:

#### Option A — Agent Team (parallel, 3 agents):
```
claude

> Create an agent team to build CareBase. Read CLAUDE.md first.
> Assign: backend agent for DB + API, frontend agent for pages + UI,
> ai-features agent for AI routes + components.
> Start with P0 foundation: scaffold the app, write migration SQL,
> set up auth, then parallelize the feature pages.
```

#### Option B — Subagents (simpler, still parallel):
```
claude

> Read CLAUDE.md. Build CareBase P0 using parallel subagents:
> 1. Subagent 1: Write the full Supabase migration SQL and seed script
> 2. Subagent 2: Scaffold Next.js app with shadcn/ui, layout, and all page stubs
> 3. Subagent 3: Set up Supabase auth with middleware and login page
> Then sequentially: build each feature page, deploy to Vercel.
```

#### Option C — Sequential (safest, one agent):
```
claude

> Read CLAUDE.md. Build CareBase step by step following the P0 build order.
> Start with scaffolding, then DB schema, then auth, then each page.
```

## Agent Descriptions

| Agent | Domain | Files Owned | Model |
|-------|--------|-------------|-------|
| **backend** | DB, API, auth, types | `supabase/`, `src/lib/supabase/`, `src/app/api/`, `src/types/` | Default |
| **frontend** | Pages, components, layout | `src/app/(auth)/`, `src/app/(dashboard)/`, `src/components/` | Default |
| **ai-features** | AI routes, LLM integration | `src/app/api/ai/`, `src/lib/ai/`, `src/components/ai/` | Default |
| **reviewer** | Code review (read-only) | All files (read only) | Haiku |

## Build Order

```
PHASE 1 — Foundation (sequential):
  scaffold → migration SQL → supabase clients → auth middleware → types

PHASE 2 — Features (parallelize):
  ├── backend: API routes for clients + service entries
  ├── frontend: client list + registration + profile + service log pages
  └── ai-features: utility functions + prompt templates

PHASE 3 — AI Integration (sequential):
  photo-intake → semantic search → handoff summary

PHASE 4 — Polish:
  CSV export → dashboard stats → WCAG audit → README → deploy
```

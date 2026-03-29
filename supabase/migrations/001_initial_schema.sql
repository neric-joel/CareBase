-- ============================================================
-- CareBase — Initial Schema
-- Migration: 001_initial_schema.sql
--
-- Order: Extensions → Tables → Functions → Triggers → RLS → Indexes → Seed
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;      -- pgvector: semantic search embeddings
CREATE EXTENSION IF NOT EXISTS pg_trgm;     -- fuzzy text search on client names

-- ============================================================
-- 2. TABLES
-- ============================================================

-- users — extends auth.users with role and display name.
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'staff'
              CHECK (role IN ('admin', 'staff')),
  full_name   text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS
  'Application user profiles extending auth.users. Role controls CRUD permissions.';

-- clients — the people receiving services from the nonprofit.
CREATE TABLE IF NOT EXISTS public.clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       text UNIQUE NOT NULL DEFAULT '',   -- set by trigger: CB-0001
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  date_of_birth   date,
  phone           text,
  email           text,
  address         text,
  custom_fields   jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clients IS
  'Individuals receiving services. custom_fields holds nonprofit-configurable attributes.';
COMMENT ON COLUMN public.clients.client_id IS
  'Human-readable identifier auto-generated as CB-0001, CB-0002, etc.';

-- service_entries — each visit/service event for a client.
CREATE TABLE IF NOT EXISTS public.service_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_date    date NOT NULL,
  service_type    text NOT NULL,
  staff_id        uuid REFERENCES public.users(id) ON DELETE SET NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.service_entries IS
  'One row per service event. Notes field is the source for AI Handoff Summary and Semantic Search.';

-- prompts — editable system prompts for every AI feature, stored in DB.
CREATE TABLE IF NOT EXISTS public.prompts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text UNIQUE NOT NULL,
  system_prompt   text NOT NULL,
  version         integer NOT NULL DEFAULT 1,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.prompts IS
  'System prompts for AI features. Admins can edit via /api/prompts. name is stable identifier.';

-- note_embeddings — Voyage AI voyage-3-lite vectors for Semantic Search.
CREATE TABLE IF NOT EXISTS public.note_embeddings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_entry_id    uuid UNIQUE NOT NULL
                      REFERENCES public.service_entries(id) ON DELETE CASCADE,
  embedding           vector(512) NOT NULL,
  content             text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.note_embeddings IS
  'Vector embeddings (voyage-3-lite, 512 dims) for semantic note search via pgvector.';

-- ============================================================
-- 3. HELPER FUNCTIONS
-- ============================================================

-- Returns the current authenticated user's role from public.users.
-- Used in RLS policies. SECURITY DEFINER so it can read users table.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Sets updated_at to now() on every UPDATE.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Generates a human-readable client ID in the format CB-0001.
CREATE OR REPLACE FUNCTION public.generate_client_id()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  next_num  integer;
  new_id    text;
BEGIN
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(client_id FROM 4) AS integer)),
    0
  ) + 1
  INTO next_num
  FROM public.clients;

  new_id := 'CB-' || LPAD(next_num::text, 4, '0');

  WHILE EXISTS (SELECT 1 FROM public.clients WHERE client_id = new_id) LOOP
    next_num := next_num + 1;
    new_id := 'CB-' || LPAD(next_num::text, 4, '0');
  END LOOP;

  RETURN new_id;
END;
$$;

-- Trigger function: sets client_id before INSERT if not provided.
CREATE OR REPLACE FUNCTION public.set_client_id_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.client_id IS NULL OR NEW.client_id = '' THEN
    NEW.client_id := public.generate_client_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Handles new Supabase Auth user signup:
-- inserts a corresponding row into public.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      'staff'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- match_notes — cosine similarity search over note_embeddings.
CREATE OR REPLACE FUNCTION public.match_notes(
  query_embedding  vector(512),
  match_threshold  float    DEFAULT 0.5,
  match_count      integer  DEFAULT 10
)
RETURNS TABLE (
  id                 uuid,
  service_entry_id   uuid,
  content            text,
  similarity         float,
  client_id          uuid,
  service_date       date,
  service_type       text,
  client_first_name  text,
  client_last_name   text,
  client_human_id    text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ne.id,
    ne.service_entry_id,
    ne.content,
    1 - (ne.embedding <=> query_embedding) AS similarity,
    se.client_id,
    se.service_date,
    se.service_type,
    c.first_name  AS client_first_name,
    c.last_name   AS client_last_name,
    c.client_id   AS client_human_id
  FROM public.note_embeddings ne
  JOIN public.service_entries se ON se.id = ne.service_entry_id
  JOIN public.clients         c  ON c.id  = se.client_id
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Auto-set client_id (CB-0001 format) on INSERT
CREATE TRIGGER trg_clients_set_client_id
  BEFORE INSERT ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_client_id_on_insert();

-- updated_at maintenance
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_service_entries_updated_at
  BEFORE UPDATE ON public.service_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_prompts_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create public.users row when a new auth user signs up
CREATE OR REPLACE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_embeddings ENABLE ROW LEVEL SECURITY;

-- ---- users ----

CREATE POLICY "users: read own"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: admin read all"
  ON public.users FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "users: update own"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "users: admin update all"
  ON public.users FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "users: admin delete"
  ON public.users FOR DELETE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "users: allow insert"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- ---- clients ----

CREATE POLICY "clients: authenticated read"
  ON public.clients FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "clients: authenticated insert"
  ON public.clients FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "clients: staff update own"
  ON public.clients FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "clients: admin update all"
  ON public.clients FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "clients: admin delete"
  ON public.clients FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ---- service_entries ----

CREATE POLICY "service_entries: authenticated read"
  ON public.service_entries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "service_entries: authenticated insert"
  ON public.service_entries FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "service_entries: staff update own"
  ON public.service_entries FOR UPDATE
  USING (staff_id = auth.uid());

CREATE POLICY "service_entries: admin update all"
  ON public.service_entries FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "service_entries: admin delete"
  ON public.service_entries FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ---- prompts ----

CREATE POLICY "prompts: authenticated read"
  ON public.prompts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "prompts: admin insert"
  ON public.prompts FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "prompts: admin update"
  ON public.prompts FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "prompts: admin delete"
  ON public.prompts FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ---- note_embeddings ----

CREATE POLICY "note_embeddings: authenticated read"
  ON public.note_embeddings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "note_embeddings: authenticated insert"
  ON public.note_embeddings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "note_embeddings: authenticated update"
  ON public.note_embeddings FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "note_embeddings: admin delete"
  ON public.note_embeddings FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ============================================================
-- 6. INDEXES
-- ============================================================

-- Trigram index for fast fuzzy name search on clients
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm
  ON public.clients
  USING GIN ((first_name || ' ' || last_name) gin_trgm_ops);

-- B-tree indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_clients_client_id
  ON public.clients (client_id);

CREATE INDEX IF NOT EXISTS idx_service_entries_client_id
  ON public.service_entries (client_id);

CREATE INDEX IF NOT EXISTS idx_service_entries_service_date
  ON public.service_entries (service_date DESC);

CREATE INDEX IF NOT EXISTS idx_service_entries_staff_id
  ON public.service_entries (staff_id);

-- IVFFlat index for approximate nearest-neighbor cosine search
-- lists=100 is appropriate for tens of thousands of embeddings
CREATE INDEX IF NOT EXISTS idx_note_embeddings_vector
  ON public.note_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- 7. SEED: initial system prompts
-- ============================================================

INSERT INTO public.prompts (name, system_prompt, version, is_active)
VALUES
(
  'photo-intake',
  E'You are a client intake assistant for ICM Food & Clothing Bank, a nonprofit food assistance organization in Phoenix, Arizona.\n\nYou will receive an image of a document (ID, intake form, or handwritten form) and must extract client registration information.\n\nRespond with ONLY a valid JSON object — no markdown, no explanation. Use this exact shape:\n{\n  "first_name": string | null,\n  "last_name": string | null,\n  "date_of_birth": "YYYY-MM-DD" | null,\n  "phone": string | null,\n  "email": string | null,\n  "address": string | null,\n  "custom_fields": {\n    "household_size": number | null,\n    "dietary_restrictions": string | null,\n    "language_preference": string | null\n  }\n}\n\nRules:\n- Return null for any field you cannot confidently read from the image.\n- Normalize phone numbers to (XXX) XXX-XXXX format if possible.\n- Format date_of_birth as YYYY-MM-DD.\n- Do not infer or guess — only extract what is visibly present.',
  1,
  true
),
(
  'handoff-summary',
  E'You are a compassionate case manager assistant at ICM Food & Clothing Bank, a nonprofit food assistance organization in Phoenix, Arizona.\n\nYou will receive a client''s complete service history — a chronological list of case notes from staff members. Your task is to produce a concise, professional handoff brief that a new case worker can read in under 2 minutes.\n\nRespond with ONLY a valid JSON object — no markdown, no explanation. Use this exact shape:\n{\n  "background": string,\n  "services_history": string,\n  "current_status": string,\n  "active_needs": string[],\n  "risk_factors": string[],\n  "recommended_next_steps": string[]\n}\n\nGuidelines:\n- background: 2-3 sentences covering who the client is and their situation when first seen.\n- services_history: concise chronological summary of services received.\n- current_status: 1-2 sentences on where the client stands today based on the most recent notes.\n- active_needs: bullet list of unresolved needs (housing, food security, employment, health, etc.).\n- risk_factors: any flags from the notes (eviction risk, food insecurity, health concerns, family stress).\n- recommended_next_steps: concrete suggested actions for the next case worker.\n- Write with empathy. Use professional, non-stigmatizing language.\n- Do not include any client''s name or PII in the output.',
  1,
  true
)
ON CONFLICT (name) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  version       = EXCLUDED.version,
  updated_at    = now();

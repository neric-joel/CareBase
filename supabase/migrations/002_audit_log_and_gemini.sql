-- ============================================================
-- CareBase — Migration 002
-- 1. Audit log table
-- 2. Switch embeddings from Voyage AI (512-dim) to Gemini (768-dim)
-- ============================================================

-- ============================================================
-- 1. AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  entity_type text NOT NULL,
  entity_id   uuid,
  details     jsonb DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log: admin read"
  ON public.audit_log FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "audit_log: authenticated insert"
  ON public.audit_log FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON public.audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity
  ON public.audit_log (entity_type, entity_id);

-- ============================================================
-- 2. SWITCH TO GEMINI EMBEDDINGS (768 dims)
-- ============================================================

-- Drop existing embeddings (they are Voyage 512-dim, incompatible)
TRUNCATE public.note_embeddings;

-- Drop the old vector index
DROP INDEX IF EXISTS idx_note_embeddings_vector;

-- Alter the column from vector(512) to vector(768)
ALTER TABLE public.note_embeddings
  ALTER COLUMN embedding TYPE vector(768);

-- Recreate the IVFFlat index for 768-dim vectors
CREATE INDEX IF NOT EXISTS idx_note_embeddings_vector
  ON public.note_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Update the match_notes function for 768-dim input
CREATE OR REPLACE FUNCTION public.match_notes(
  query_embedding  vector(768),
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

COMMENT ON TABLE public.note_embeddings IS
  'Vector embeddings (Gemini embedding-001, 768 dims) for semantic note search via pgvector.';

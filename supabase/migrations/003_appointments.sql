CREATE TABLE IF NOT EXISTS public.appointments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  staff_id      uuid REFERENCES public.app_users(id) ON DELETE SET NULL,
  title         text NOT NULL,
  scheduled_at  timestamptz NOT NULL,
  duration_mins integer NOT NULL DEFAULT 30,
  notes         text,
  status        text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments: authenticated read"
  ON public.appointments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "appointments: authenticated insert"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "appointments: staff update own"
  ON public.appointments FOR UPDATE
  USING (staff_id = auth.uid());

CREATE POLICY "appointments: admin update all"
  ON public.appointments FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "appointments: admin delete"
  ON public.appointments FOR DELETE
  USING (public.get_user_role() = 'admin');

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON public.appointments (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments (client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON public.appointments (staff_id);

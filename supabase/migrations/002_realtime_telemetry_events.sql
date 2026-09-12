-- ============================================================
-- Day One CRM — Real-Time Telemetry Event Bus
-- Enables instant, event-driven TV telemetry updates without polling
-- ============================================================

CREATE TABLE IF NOT EXISTS public.telemetry_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES public.startups(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.telemetry_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "telemetry_events_select_public" ON public.telemetry_events;
CREATE POLICY "telemetry_events_select_public"
  ON public.telemetry_events
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "telemetry_events_insert_public" ON public.telemetry_events;
CREATE POLICY "telemetry_events_insert_public"
  ON public.telemetry_events
  FOR INSERT
  TO public
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'telemetry_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_events;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.notify_telemetry_event()
RETURNS TRIGGER AS $$
DECLARE
  target_startup_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'startups' THEN
    target_startup_id := COALESCE(NEW.id, OLD.id);
  ELSE
    target_startup_id := COALESCE(NEW.startup_id, OLD.startup_id);
  END IF;

  INSERT INTO public.telemetry_events (startup_id, event_type)
  VALUES (target_startup_id, TG_TABLE_NAME || '_' || TG_OP);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_tasks_telemetry ON public.tasks;
CREATE TRIGGER trg_tasks_telemetry
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.notify_telemetry_event();

DROP TRIGGER IF EXISTS trg_weekly_plans_telemetry ON public.weekly_plans;
CREATE TRIGGER trg_weekly_plans_telemetry
AFTER INSERT OR UPDATE OR DELETE ON public.weekly_plans
FOR EACH ROW EXECUTE FUNCTION public.notify_telemetry_event();

DROP TRIGGER IF EXISTS trg_domains_telemetry ON public.domains;
CREATE TRIGGER trg_domains_telemetry
AFTER INSERT OR UPDATE OR DELETE ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.notify_telemetry_event();

DROP TRIGGER IF EXISTS trg_activity_logs_telemetry ON public.activity_logs;
CREATE TRIGGER trg_activity_logs_telemetry
AFTER INSERT ON public.activity_logs
FOR EACH ROW EXECUTE FUNCTION public.notify_telemetry_event();

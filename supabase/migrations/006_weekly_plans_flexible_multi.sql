-- Drop unique constraint on (startup_id, week_start) to allow multiple plans and flexible date ranges
ALTER TABLE public.weekly_plans DROP CONSTRAINT IF EXISTS weekly_plans_startup_id_week_start_key;

-- Add optional title column to weekly_plans
ALTER TABLE public.weekly_plans ADD COLUMN IF NOT EXISTS title TEXT;

-- Add DELETE policy for weekly_plans so founders and admins can delete plans
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'weekly_plans' AND policyname = 'weekly_plans_delete'
  ) THEN
    CREATE POLICY "weekly_plans_delete" ON public.weekly_plans
      FOR DELETE USING (
        public.is_admin() OR public.is_founder_of(startup_id)
      );
  END IF;
END $$;

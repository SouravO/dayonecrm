-- Add started_at column to tasks for time tracking
-- Records when a task transitions to IN_PROGRESS
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

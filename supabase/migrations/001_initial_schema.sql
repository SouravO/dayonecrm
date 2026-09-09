-- ============================================================
-- Day One CRM — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ────────────────────────────────────────────────
-- Extends auth.users with role and display info
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  role        TEXT NOT NULL CHECK (role IN ('ADMIN', 'FOUNDER', 'STAFF')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── STARTUPS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.startups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  phone       TEXT,
  status      TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── STARTUP MEMBERS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.startup_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id  UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('FOUNDER', 'STAFF')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(startup_id, user_id)
);

-- ─── REGISTRATION REQUESTS ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.registration_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id        UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by       UUID REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── DOMAINS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.domains (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id  UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── WEEKLY PLANS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.weekly_plans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id  UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  week_start  DATE NOT NULL,
  week_end    DATE NOT NULL,
  goal        TEXT,
  created_by  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(startup_id, week_start)
);

-- ─── TASKS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id        UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  weekly_plan_id    UUID REFERENCES public.weekly_plans(id) ON DELETE SET NULL,
  domain_id         UUID REFERENCES public.domains(id) ON DELETE SET NULL,
  assigned_to       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by        UUID NOT NULL REFERENCES auth.users(id),
  title             TEXT NOT NULL,
  description       TEXT,
  priority          TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  status            TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
  due_date          DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ,
  completion_status TEXT CHECK (completion_status IN ('EARLY', 'ON_TIME', 'LATE'))
);

-- ─── TASK UPDATES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.task_updates (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  comment     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── WEEKLY PERFORMANCE ───────────────────────────────────────
-- Derived/cached analytics — computed from tasks
CREATE TABLE IF NOT EXISTS public.weekly_performance (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id              UUID NOT NULL REFERENCES public.startups(id) ON DELETE CASCADE,
  weekly_plan_id          UUID NOT NULL REFERENCES public.weekly_plans(id) ON DELETE CASCADE,
  total_tasks             INT NOT NULL DEFAULT 0,
  completed_tasks         INT NOT NULL DEFAULT 0,
  pending_tasks           INT NOT NULL DEFAULT 0,
  in_progress_tasks       INT NOT NULL DEFAULT 0,
  early_tasks             INT NOT NULL DEFAULT 0,
  on_time_tasks           INT NOT NULL DEFAULT 0,
  late_tasks              INT NOT NULL DEFAULT 0,
  overdue_tasks           INT NOT NULL DEFAULT 0,
  completion_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  early_rate              NUMERIC(5,2) NOT NULL DEFAULT 0,
  on_time_rate            NUMERIC(5,2) NOT NULL DEFAULT 0,
  late_rate               NUMERIC(5,2) NOT NULL DEFAULT 0,
  performance_status      TEXT NOT NULL DEFAULT 'ON_TRACK' CHECK (performance_status IN ('AHEAD', 'ON_TRACK', 'BEHIND', 'AT_RISK')),
  planned_end_date        DATE,
  actual_completion_date  DATE,
  days_early              INT,
  weekly_completion_status TEXT NOT NULL DEFAULT 'INCOMPLETE' CHECK (weekly_completion_status IN ('COMPLETED_EARLY', 'COMPLETED_ON_TIME', 'COMPLETED_LATE', 'INCOMPLETE')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(startup_id, weekly_plan_id)
);

-- ─── ACTIVITY LOGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id   UUID REFERENCES public.startups(id) ON DELETE SET NULL,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  action       TEXT NOT NULL,
  entity_type  TEXT,
  entity_id    UUID,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_startup_members_startup_id ON public.startup_members(startup_id);
CREATE INDEX IF NOT EXISTS idx_startup_members_user_id ON public.startup_members(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_startup_id ON public.registration_requests(startup_id);
CREATE INDEX IF NOT EXISTS idx_registration_requests_status ON public.registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_domains_startup_id ON public.domains(startup_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_startup_id ON public.weekly_plans(startup_id);
CREATE INDEX IF NOT EXISTS idx_tasks_startup_id ON public.tasks(startup_id);
CREATE INDEX IF NOT EXISTS idx_tasks_weekly_plan_id ON public.tasks(weekly_plan_id);
CREATE INDEX IF NOT EXISTS idx_tasks_domain_id ON public.tasks(domain_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_task_updates_task_id ON public.task_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_weekly_performance_startup_id ON public.weekly_performance(startup_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_startup_id ON public.activity_logs(startup_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- ─── AUTO-UPDATE TIMESTAMPS ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_startups_updated_at
  BEFORE UPDATE ON public.startups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_weekly_plans_updated_at
  BEFORE UPDATE ON public.weekly_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_weekly_performance_updated_at
  BEFORE UPDATE ON public.weekly_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Day One CRM — Row Level Security Policies
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ─── HELPER FUNCTIONS ────────────────────────────────────────

-- Get current user's role
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Get startup_id for current user (if FOUNDER or STAFF)
CREATE OR REPLACE FUNCTION public.user_startup_id()
RETURNS UUID AS $$
  SELECT startup_id FROM public.startup_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is founder of given startup
CREATE OR REPLACE FUNCTION public.is_founder_of(sid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.startup_members
    WHERE user_id = auth.uid() AND startup_id = sid AND role = 'FOUNDER'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is member (founder or staff) of given startup
CREATE OR REPLACE FUNCTION public.is_member_of(sid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.startup_members
    WHERE user_id = auth.uid() AND startup_id = sid
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── PROFILES ────────────────────────────────────────────────

-- Users can read their own profile; admins read all
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.is_admin()
  );

-- Users can insert their own profile (on registration)
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile; admins update any
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.is_admin()
  );

-- ─── STARTUPS ────────────────────────────────────────────────

-- Admins see all; founders/staff see own startup
CREATE POLICY "startups_select" ON public.startups
  FOR SELECT USING (
    public.is_admin() OR public.is_member_of(id)
  );

-- Only admins can insert startups (registration flow uses service-role via server action)
CREATE POLICY "startups_insert" ON public.startups
  FOR INSERT WITH CHECK (public.is_admin());

-- Admins can update any; founders can update own
CREATE POLICY "startups_update" ON public.startups
  FOR UPDATE USING (
    public.is_admin() OR public.is_founder_of(id)
  );

-- ─── STARTUP MEMBERS ────────────────────────────────────────

CREATE POLICY "startup_members_select" ON public.startup_members
  FOR SELECT USING (
    public.is_admin() OR public.is_member_of(startup_id)
  );

CREATE POLICY "startup_members_insert" ON public.startup_members
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_founder_of(startup_id)
  );

CREATE POLICY "startup_members_delete" ON public.startup_members
  FOR DELETE USING (
    public.is_admin() OR public.is_founder_of(startup_id)
  );

-- ─── REGISTRATION REQUESTS ──────────────────────────────────

-- Admins see all; founders see own startup's request
CREATE POLICY "registration_requests_select" ON public.registration_requests
  FOR SELECT USING (
    public.is_admin() OR startup_id = public.user_startup_id()
  );

CREATE POLICY "registration_requests_insert" ON public.registration_requests
  FOR INSERT WITH CHECK (public.is_admin());

-- Only admins can approve/reject (update)
CREATE POLICY "registration_requests_update" ON public.registration_requests
  FOR UPDATE USING (public.is_admin());

-- ─── DOMAINS ─────────────────────────────────────────────────

CREATE POLICY "domains_select" ON public.domains
  FOR SELECT USING (
    public.is_admin() OR public.is_member_of(startup_id)
  );

-- Founders can create domains for their startup
CREATE POLICY "domains_insert" ON public.domains
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_founder_of(startup_id)
  );

CREATE POLICY "domains_update" ON public.domains
  FOR UPDATE USING (
    public.is_admin() OR public.is_founder_of(startup_id)
  );

CREATE POLICY "domains_delete" ON public.domains
  FOR DELETE USING (
    public.is_admin() OR public.is_founder_of(startup_id)
  );

-- ─── WEEKLY PLANS ─────────────────────────────────────────────

CREATE POLICY "weekly_plans_select" ON public.weekly_plans
  FOR SELECT USING (
    public.is_admin() OR public.is_member_of(startup_id)
  );

-- Founders and admins can create weekly plans
CREATE POLICY "weekly_plans_insert" ON public.weekly_plans
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_founder_of(startup_id)
  );

CREATE POLICY "weekly_plans_update" ON public.weekly_plans
  FOR UPDATE USING (
    public.is_admin() OR public.is_founder_of(startup_id)
  );

-- ─── TASKS ───────────────────────────────────────────────────

CREATE POLICY "tasks_select" ON public.tasks
  FOR SELECT USING (
    public.is_admin() OR public.is_member_of(startup_id)
  );

-- Founders and staff can create tasks in their startup
CREATE POLICY "tasks_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_member_of(startup_id)
  );

-- Founders can update any task; staff can update tasks they created or are assigned to
CREATE POLICY "tasks_update" ON public.tasks
  FOR UPDATE USING (
    public.is_admin()
    OR public.is_founder_of(startup_id)
    OR (public.is_member_of(startup_id) AND (created_by = auth.uid() OR assigned_to = auth.uid()))
  );

CREATE POLICY "tasks_delete" ON public.tasks
  FOR DELETE USING (
    public.is_admin() OR public.is_founder_of(startup_id)
  );

-- ─── TASK UPDATES ────────────────────────────────────────────

CREATE POLICY "task_updates_select" ON public.task_updates
  FOR SELECT USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id AND public.is_member_of(t.startup_id)
    )
  );

CREATE POLICY "task_updates_insert" ON public.task_updates
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_id AND public.is_member_of(t.startup_id)
    )
  );

-- ─── WEEKLY PERFORMANCE ───────────────────────────────────────

CREATE POLICY "weekly_performance_select" ON public.weekly_performance
  FOR SELECT USING (
    public.is_admin() OR public.is_member_of(startup_id)
  );

-- Allow upsert from server actions (using service role context via server)
CREATE POLICY "weekly_performance_insert" ON public.weekly_performance
  FOR INSERT WITH CHECK (
    public.is_admin() OR public.is_founder_of(startup_id)
  );

CREATE POLICY "weekly_performance_update" ON public.weekly_performance
  FOR UPDATE USING (
    public.is_admin() OR public.is_founder_of(startup_id)
  );

-- ─── ACTIVITY LOGS ───────────────────────────────────────────

-- Admins see all; founders/staff see own startup
CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT USING (
    public.is_admin()
    OR (startup_id IS NOT NULL AND public.is_member_of(startup_id))
  );

-- Any authenticated user can insert activity logs
CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (user_id = auth.uid());

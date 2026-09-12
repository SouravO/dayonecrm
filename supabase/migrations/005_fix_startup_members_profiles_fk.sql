-- ============================================================
-- Migration 005: Foreign Key Between startup_members and profiles
-- Enables PostgREST nested queries and allows startup members to view teammates
-- ============================================================

-- 1. Add email column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id;

-- 2. Add foreign key from startup_members to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_startup_members_profiles'
  ) THEN
    ALTER TABLE public.startup_members 
    ADD CONSTRAINT fk_startup_members_profiles 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Helper function: Check if two users belong to the same startup
CREATE OR REPLACE FUNCTION public.is_same_startup(target_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.startup_members sm1
    JOIN public.startup_members sm2 ON sm1.startup_id = sm2.startup_id
    WHERE sm1.user_id = auth.uid() AND sm2.user_id = target_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 4. Update profiles_select policy
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR public.is_admin() 
    OR public.is_same_startup(id)
  );

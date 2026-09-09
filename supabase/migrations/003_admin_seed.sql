-- ============================================================
-- Day One CRM — Admin Seed Script
-- Creates the first Day One Admin account
-- Run AFTER migrations 001 and 002
-- ============================================================

-- Step 1: Create admin user in Supabase Auth
-- (Do this via Supabase Dashboard → Authentication → Users → Add User)
-- OR use this SQL approach with the auth schema:

-- INSERT INTO auth.users (
--   id, email, encrypted_password, email_confirmed_at,
--   raw_app_meta_data, raw_user_meta_data, created_at, updated_at
-- )
-- VALUES (
--   uuid_generate_v4(),
--   'admin@dayone.studio',
--   crypt('YourSecurePassword123!', gen_salt('bf')),
--   NOW(),
--   '{"provider":"email","providers":["email"]}',
--   '{}',
--   NOW(),
--   NOW()
-- );

-- Step 2: After creating the user in Supabase Auth Dashboard,
-- insert their profile. Replace the UUID with the actual user ID
-- from auth.users table.

-- Example (replace 'REPLACE_WITH_ACTUAL_AUTH_USER_UUID'):
-- INSERT INTO public.profiles (id, full_name, phone, role)
-- VALUES (
--   'REPLACE_WITH_ACTUAL_AUTH_USER_UUID',
--   'Day One Admin',
--   NULL,
--   'ADMIN'
-- );

-- ─── QUICK SETUP INSTRUCTIONS ────────────────────────────────
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User" → fill email (e.g. admin@dayone.studio) and password
-- 3. Copy the new user's UUID from the users list
-- 4. Run this query (replace the UUID):

-- INSERT INTO public.profiles (id, full_name, phone, role)
-- VALUES ('<paste-uuid-here>', 'Day One Admin', NULL, 'ADMIN')
-- ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';

-- ─── VERIFY ──────────────────────────────────────────────────
-- SELECT p.id, p.full_name, p.role, u.email
-- FROM public.profiles p
-- JOIN auth.users u ON u.id = p.id
-- WHERE p.role = 'ADMIN';

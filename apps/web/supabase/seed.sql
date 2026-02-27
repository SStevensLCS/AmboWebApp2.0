-- Seed: ensure admin user with phone 7604848038 exists
-- Run this after migrations. Uses upsert so it's idempotent.

INSERT INTO public.users (first_name, last_name, phone, email, role)
VALUES (
  'Super',
  'Admin',
  '7604848038',
  'admin@ambo.local',  -- set this to the real admin email used for Supabase Auth
  'admin'
)
ON CONFLICT (phone) DO UPDATE SET
  role = 'admin',
  email = COALESCE(EXCLUDED.email, public.users.email),
  first_name = COALESCE(public.users.first_name, 'Super'),
  last_name = COALESCE(public.users.last_name, 'Admin');

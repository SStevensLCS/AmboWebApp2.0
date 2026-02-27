-- Fix Foreign Key on push_subscriptions
-- The previous migration referenced auth.users, but our session uses IDs from public.users (managed manually/custom auth).
-- We need to repoint the FK to public.users.

ALTER TABLE public.push_subscriptions
DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;

ALTER TABLE public.push_subscriptions
ADD CONSTRAINT push_subscriptions_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.users(id)
ON DELETE CASCADE;

-- Restore permissive SELECT policy on users table for all authenticated users.
--
-- The 20260218_fix_users_rls migration fixed an infinite recursion bug but
-- accidentally dropped the "Authenticated users can view profiles" policy
-- without adding it back. This left students only able to see their own row,
-- which breaks user joins on posts, comments, events, RSVPs, and chat
-- (all return null for other users' info).
--
-- This adds back a read-only policy so all authenticated users can see
-- basic profile info (names, avatars, roles) needed for the app to function.

CREATE POLICY "Authenticated users can view profiles"
ON public.users FOR SELECT
USING (auth.role() = 'authenticated');

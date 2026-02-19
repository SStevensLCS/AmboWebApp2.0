-- Fix infinite recursion on users table RLS policies
-- The "Users can read own row" policy queries public.users from within itself, causing recursion.

-- 1. Create a SECURITY DEFINER function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE email = (auth.jwt()->>'email')
    AND (role = 'admin' OR role = 'superadmin')
  );
$$;

-- 2. Drop the old recursive SELECT policy on users
DROP POLICY IF EXISTS "Users can read own row" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.users;

-- 3. Create new non-recursive SELECT policy on users
CREATE POLICY "Users can read own row"
ON public.users FOR SELECT
USING (
  email = (auth.jwt()->>'email')
  OR is_admin_user()
);

-- 4. Fix the INSERT policy for admins
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;

CREATE POLICY "Admins can insert users"
ON public.users FOR INSERT
WITH CHECK (is_admin_user());

-- 5. Fix the UPDATE policy for admins
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

CREATE POLICY "Admins can update users"
ON public.users FOR UPDATE
USING (is_admin_user());

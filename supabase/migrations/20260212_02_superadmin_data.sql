-- Update specific user to superadmin
UPDATE public.users 
SET role = 'superadmin' 
WHERE phone = '7604848038';

-- Update RLS policies to include superadmin

DROP POLICY IF EXISTS "Users can read own row" ON public.users;
CREATE POLICY "Users can read own row"
  ON public.users FOR SELECT
  USING (
    email = (auth.jwt()->>'email')
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.email = (auth.jwt()->>'email')
      AND (u.role = 'admin' OR u.role = 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.email = (auth.jwt()->>'email')
      AND (u.role = 'admin' OR u.role = 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.email = (auth.jwt()->>'email')
      AND (u.role = 'admin' OR u.role = 'superadmin')
    )
  );

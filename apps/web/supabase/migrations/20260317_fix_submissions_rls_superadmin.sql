-- Fix submissions RLS to include superadmin role

DROP POLICY IF EXISTS "Users can read own submissions" ON public.submissions;
CREATE POLICY "Users can read own submissions"
  ON public.submissions FOR SELECT
  USING (
    user_id IN (SELECT id FROM public.users WHERE email = (auth.jwt()->>'email'))
    OR
    EXISTS (SELECT 1 FROM public.users u WHERE u.email = (auth.jwt()->>'email') AND u.role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Admins can update submissions" ON public.submissions;
CREATE POLICY "Admins can update submissions"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.email = (auth.jwt()->>'email') AND u.role IN ('admin', 'superadmin'))
  );

DROP POLICY IF EXISTS "Admins can insert submissions" ON public.submissions;
CREATE POLICY "Admins can insert submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.email = (auth.jwt()->>'email') AND u.role IN ('admin', 'superadmin'))
  );

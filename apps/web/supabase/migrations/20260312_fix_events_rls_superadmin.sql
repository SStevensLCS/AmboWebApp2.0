-- Fix events RLS policies to allow superadmin role
DROP POLICY "Admins can insert events" ON public.events;
CREATE POLICY "Admins can insert events" ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt()->>'email' AND role IN ('admin', 'superadmin'))
  );

DROP POLICY "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events" ON public.events FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt()->>'email' AND role IN ('admin', 'superadmin'))
  );

DROP POLICY "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events" ON public.events FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt()->>'email' AND role IN ('admin', 'superadmin'))
  );

-- Add a default for the type column so mobile inserts work without specifying it
ALTER TABLE public.events ALTER COLUMN type SET DEFAULT 'General';

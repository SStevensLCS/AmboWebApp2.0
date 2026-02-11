-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  type TEXT NOT NULL, -- e.g., "Tour", "Meeting", "Social"
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event RSVPs
CREATE TABLE public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('going', 'maybe', 'no')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Event Comments
CREATE TABLE public.event_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- Events Policies
CREATE POLICY "Everyone can view events"
  ON public.events FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert events"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt()->>'email' AND role = 'admin')
  );

CREATE POLICY "Admins can update events"
  ON public.events FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt()->>'email' AND role = 'admin')
  );

CREATE POLICY "Admins can delete events"
  ON public.events FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt()->>'email' AND role = 'admin')
  );

-- RSVP Policies
CREATE POLICY "Everyone can view RSVPs"
  ON public.event_rsvps FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can manage their own RSVPs"
  ON public.event_rsvps FOR ALL
  USING (auth.uid() = user_id) -- Assuming auth.uid() matches user_id in users table? 
  -- Wait, public.users.id is the foreign key. auth.users.id is usually the same.
  -- But we link public.users by email usually. Let's check how user_id is handled.
  -- In submissions we used: user_id IN (SELECT id FROM public.users WHERE email = auth.jwt()->>'email')
  -- We should stick to that pattern for consistency if we aren't using strict auth.uid() mapping yet.
  WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE email = auth.jwt()->>'email')
  );

-- Let's refine the RSVP policy to match the existing pattern
DROP POLICY "Users can manage their own RSVPs" ON public.event_rsvps;
CREATE POLICY "Users can insert own RSVPs"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can update own RSVPs"
  ON public.event_rsvps FOR UPDATE
  USING (
    user_id IN (SELECT id FROM public.users WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can delete own RSVPs"
  ON public.event_rsvps FOR DELETE
  USING (
    user_id IN (SELECT id FROM public.users WHERE email = auth.jwt()->>'email')
  );


-- Comments Policies
CREATE POLICY "Everyone can view comments"
  ON public.event_comments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own comments"
  ON public.event_comments FOR INSERT
  WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE email = auth.jwt()->>'email')
  );

CREATE POLICY "Users can delete own comments"
  ON public.event_comments FOR DELETE
  USING (
    user_id IN (SELECT id FROM public.users WHERE email = auth.jwt()->>'email')
  );

-- Create table for custom RSVP options per event
CREATE TABLE public.event_rsvp_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add column to link RSVPs to a specific option
ALTER TABLE public.event_rsvps
  ADD COLUMN rsvp_option_id UUID REFERENCES public.event_rsvp_options(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.event_rsvp_options ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view RSVP options
CREATE POLICY "Authenticated can view rsvp options"
  ON public.event_rsvp_options
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admins and superadmins can manage RSVP options
CREATE POLICY "Admins can manage rsvp options"
  ON public.event_rsvp_options
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE email = auth.jwt()->>'email'
        AND role IN ('admin', 'superadmin')
    )
  );

-- Index for fast lookup by event
CREATE INDEX idx_event_rsvp_options_event ON public.event_rsvp_options(event_id);

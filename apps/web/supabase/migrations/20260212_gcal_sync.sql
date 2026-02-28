-- Add Google Calendar event ID column for sync tracking
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT;

-- Add calendar_tokens column to users table for per-user Google Calendar integration
-- This allows students to connect their personal Google Calendars without
-- overwriting the admin's master calendar connection in system_settings.
ALTER TABLE public.users ADD COLUMN calendar_tokens JSONB DEFAULT NULL;

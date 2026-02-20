CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users (phone);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON public.event_rsvps (event_id);
CREATE INDEX IF NOT EXISTS idx_event_comments_event_id ON public.event_comments (event_id);

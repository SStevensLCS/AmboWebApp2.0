-- Create notification_preferences table for per-user notification controls.
-- Each toggle controls whether the user receives push notifications for that category.
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  chat_messages BOOLEAN NOT NULL DEFAULT TRUE,
  new_posts BOOLEAN NOT NULL DEFAULT TRUE,
  post_comments BOOLEAN NOT NULL DEFAULT TRUE,
  event_comments BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "Users can view own notification preferences"
ON notification_preferences FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
ON notification_preferences FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "Users can update own notification preferences"
ON notification_preferences FOR UPDATE
USING (user_id = auth.uid());

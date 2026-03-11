-- Store Expo push tokens for mobile app notifications.
-- Separate from push_subscriptions which stores Web Push (VAPID) subscriptions.
CREATE TABLE IF NOT EXISTS expo_push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT expo_push_tokens_token_key UNIQUE (token)
);

ALTER TABLE expo_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own expo tokens"
ON expo_push_tokens FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own expo tokens"
ON expo_push_tokens FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expo tokens"
ON expo_push_tokens FOR DELETE TO authenticated
USING (auth.uid() = user_id);

GRANT ALL ON expo_push_tokens TO authenticated;
GRANT ALL ON expo_push_tokens TO service_role;

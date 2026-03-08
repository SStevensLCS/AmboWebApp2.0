-- Mobile push token storage for Expo native push notifications
CREATE TABLE IF NOT EXISTS mobile_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  device_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Index for looking up tokens by user
CREATE INDEX IF NOT EXISTS idx_mobile_push_tokens_user_id ON mobile_push_tokens(user_id);

-- RLS
ALTER TABLE mobile_push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens
CREATE POLICY "Users can insert own tokens"
  ON mobile_push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own tokens"
  ON mobile_push_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON mobile_push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can read all tokens (for sending notifications)
CREATE POLICY "Service role can read all tokens"
  ON mobile_push_tokens FOR SELECT
  USING (auth.role() = 'service_role');

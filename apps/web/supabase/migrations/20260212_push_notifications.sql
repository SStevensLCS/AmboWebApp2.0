-- Push Subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can manage own subscriptions"
  ON public.push_subscriptions
  USING (
    user_id IN (SELECT id FROM public.users WHERE email = auth.jwt()->>'email')
  )
  WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE email = auth.jwt()->>'email')
  );

-- Admins can view all (for debugging)
CREATE POLICY "Admins can view all subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt()->>'email' AND role = 'admin')
  );

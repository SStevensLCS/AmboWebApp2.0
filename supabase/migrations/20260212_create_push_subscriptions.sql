
-- Create the push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id),
    CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint)
);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions" 
ON public.push_subscriptions 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. Users can view their own subscriptions (for debugging/checking)
CREATE POLICY "Users can view their own subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 3. Users can delete their own subscriptions (e.g. logout)
CREATE POLICY "Users can delete their own subscriptions" 
ON public.push_subscriptions 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 4. Admins (service role) can do everything
-- Note: Service role bypasses RLS, but explicit policy is good for admin clients using auth
CREATE POLICY "Admins can view all subscriptions" 
ON public.push_subscriptions 
FOR SELECT 
TO service_role 
USING (true);

-- Grant access to authenticated users
GRANT ALL ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

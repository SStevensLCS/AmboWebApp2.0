
-- Create debug_logs table
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    level text NOT NULL, -- 'info', 'error', etc.
    message text NOT NULL,
    data jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT debug_logs_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;

-- Allow anyone (even unauthenticated SW if needed, but preferably restricted) to insert
-- Since SW might not be authenticated in all contexts (though it should be if session cookie persists),
-- we'll allow anon insert for debugging purposes temporarily.
CREATE POLICY "Allow anon insert for debugging" 
ON public.debug_logs 
FOR INSERT 
TO anon, authenticated, service_role 
WITH CHECK (true);

-- Allow admins to view
CREATE POLICY "Allow admins to view logs" 
ON public.debug_logs 
FOR SELECT 
TO service_role, authenticated 
USING (true);

GRANT ALL ON public.debug_logs TO anon;
GRANT ALL ON public.debug_logs TO authenticated;
GRANT ALL ON public.debug_logs TO service_role;

-- System Settings table for storing app-wide configs (like Google Tokens)
CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view/edit system settings
CREATE POLICY "Admins can manage system settings"
    ON public.system_settings
    USING (
        EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt()->>'email' AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt()->>'email' AND role = 'admin')
    );

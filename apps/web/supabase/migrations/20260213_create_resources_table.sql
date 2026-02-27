-- Create resources table
CREATE TABLE public.resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Policies for resources table
-- Everyone can view
CREATE POLICY "Everyone can view resources" ON public.resources
    FOR SELECT USING (true);

-- Admins can insert/update/delete
-- Note: 'auth.jwt()' might not work if we use custom auth, but we usually bypass RLS in API or use service role.
-- However, if accessing via client, we need policies.
-- Given our Session logic, we might need to rely on API-level checks if using `supabase-js` client with anon key.
-- But for now, let's allow all authenticated users to view, and only Service Role (API) to write?
-- Actually, the user wants "Every kind of user visit and download".

-- Create Storage Bucket 'resources'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Everyone can read
CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING ( bucket_id = 'resources' );

-- Details for upload handled by API (Service Role) usually.
-- But if we upload from client, we need policy. 
-- We will likely use backend API for upload to keep control.

-- Create applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected'
    current_step INTEGER NOT NULL DEFAULT 1,
    
    -- Personal Info
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    
    -- Academic Info
    grade_current TEXT,
    grade_entry TEXT, -- "What grade were you in when you came to Linfield?"
    gpa NUMERIC(4, 2), -- constrained in UI, loose here but could add CHECK
    transcript_url TEXT,
    
    -- References
    referrer_academic_name TEXT,
    referrer_academic_email TEXT,
    referrer_bible_name TEXT,
    referrer_bible_email TEXT,
    
    -- Questionnaire
    q_involvement TEXT,
    q_why_ambassador TEXT,
    q_faith TEXT, -- "Have you accepted Jesus..."
    q_love_linfield TEXT,
    q_change_linfield TEXT,
    q_family_decision TEXT,
    q_strengths TEXT,
    q_weaknesses TEXT,
    q_time_commitment TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index on phone_number to support "login" by phone
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_phone ON public.applications(phone_number);

-- Enable RLS
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now - Service Role will bypass, but we need public access for the form)
-- Ideally, we'd have auth, but we are using "phone number" as identity. 
-- For the public form to work without real auth, we might need to allow anon access 
-- aimed at specific phone numbers, OR just use Service Role in our Next.js Server Actions.
-- Since we are using Server Actions, we can use the Service Role Key to bypass RLS.
-- So we don't strictly *need* permissive RLS policies for Anon if everything goes through Server Actions.

-- Create Storage Bucket for Transcripts if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('transcripts', 'transcripts', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Access to Transcripts"
ON storage.objects FOR SELECT
USING ( bucket_id = 'transcripts' );

CREATE POLICY "Upload Transcripts"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'transcripts' );

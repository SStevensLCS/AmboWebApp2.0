-- Add avatar_url column to users table for profile pictures
ALTER TABLE public.users ADD COLUMN avatar_url TEXT DEFAULT NULL;

-- Create avatars storage bucket (public access for serving images)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies for the avatars bucket
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

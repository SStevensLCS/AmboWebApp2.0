import { createClient } from '@supabase/supabase-js';

// Access the service role key from the environment
// NOTE: This key bypasses Row Level Security (RLS) and should only be used in secure server-side contexts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase URL or Service Role Key');
}

export const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const createAdminClient = () => adminClient;

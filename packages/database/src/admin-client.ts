import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or Service Role Key');
  }

  _adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _adminClient;
}

export const createAdminClient = () => getAdminClient();

/** @deprecated Use createAdminClient() instead */
export const adminClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getAdminClient() as any)[prop];
  },
});

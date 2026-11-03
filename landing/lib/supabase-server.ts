import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedServerClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client configured with the service_role secret key.
 * This client is strictly intended for server-side route handlers and
 * has administrative authority to bypass Row Level Security (RLS) to manage
 * the waitlist_signups table.
 *
 * NEVER expose this client or SUPABASE_SERVICE_ROLE_KEY to the browser bundle.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (cachedServerClient) {
    return cachedServerClient;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.EXPO_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  cachedServerClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedServerClient;
}


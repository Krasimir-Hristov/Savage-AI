import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';

/**
 * Service-role admin client — bypasses RLS.
 * Use ONLY for trusted server-side operations (e.g. triggers, migrations).
 * Never expose this client or its key to the browser.
 */
export function createAdminClient(): ReturnType<typeof createClient<Database>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

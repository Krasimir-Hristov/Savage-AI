import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/database';

export const createClient = (): ReturnType<typeof createBrowserClient<Database>> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  return createBrowserClient<Database>(url, key);
};

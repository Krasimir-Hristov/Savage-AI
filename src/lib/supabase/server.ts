import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@/types/database';

export async function createClient(): Promise<ReturnType<typeof createServerClient<Database>>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL');
  if (!key) throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // setAll called from a Server Component — cookies cannot be mutated.
          // This is expected in read-only contexts; session will be refreshed by proxy.ts.
          console.debug('[Supabase] Cookie mutation skipped (read-only context):', error);
        }
      },
    },
  });
}

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/types/database';

export const createClient = (): ReturnType<typeof createBrowserClient<Database>> =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );

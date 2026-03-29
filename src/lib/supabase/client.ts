// Browser (client-side) Supabase client.
// Use in Client Components ("use client") for auth and real-time.
// Creates one instance per call — memoize at call site if needed.

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

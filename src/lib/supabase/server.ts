// Server-side Supabase clients.
// Import these in Server Components, Route Handlers, and Server Actions only.
// Never import in Client Components — use src/lib/supabase/client.ts there.

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Cookie-backed server client.
 * Reads the user's auth session from cookies (set by the browser client / middleware).
 * Subject to RLS policies — use for all normal data access in Server Components and Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component where cookies() is read-only.
            // The middleware will refresh the session token on the next request.
          }
        },
      },
    }
  );
}

/**
 * Service-role admin client.
 * Bypasses RLS — use ONLY for:
 *   - Seed scripts
 *   - Operations that genuinely need elevated access (e.g. creating demo accounts)
 *   - Server-side embedding writes that run outside user context
 *
 * NEVER expose this client's results to the browser or use it in response to
 * untrusted user input without explicit authorization checks.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

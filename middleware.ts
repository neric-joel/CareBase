// Auth middleware — runs on every request matching the config.matcher pattern.
// Responsibilities:
//   1. Refresh the Supabase auth session (keep cookies up to date).
//   2. Redirect unauthenticated users to /login.
//   3. Pass authenticated users through to their destination.

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login', '/pricing', '/api/auth'];

function isPublicRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/pricing') return true;
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Build a mutable response that we can attach updated cookies to
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          // Write new cookie values into both the request (for this handler)
          // and the response (so the browser receives updated tokens).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() must be called to refresh the session.
  // Do NOT use getSession() here — it's not safe in middleware.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // If Supabase is unreachable, treat as unauthenticated
    user = null;
  }

  // Allow public routes (login, auth callbacks) regardless of auth state
  if (isPublicRoute(pathname)) {
    // If the user is already logged in and hits /login, redirect to /dashboard
    if (user && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return supabaseResponse;
  }

  // Unauthenticated request to a protected route — redirect to /login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    // Preserve the intended destination so we can redirect after login
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — pass through with refreshed session cookies
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match every route except:
     *   - _next/static  (static assets)
     *   - _next/image   (image optimization)
     *   - favicon.ico
     *   - public image/font files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};

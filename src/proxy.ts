import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/chat', '/knowledge'];
const AUTH_PATHS = ['/login', '/signup'];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Pass through if env vars are missing (e.g., during build)
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        // Refresh cookies in the request (for downstream handlers)
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        // Rebuild response with updated session cookies
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    // getSession() reads from cookie ONLY — no DB calls (optimistic check)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
    const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

    // Unauthenticated user accessing protected route → redirect to /login
    if (isProtectedPath && !session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Authenticated user accessing auth pages → redirect to /chat
    if (isAuthPath && session) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }
  } catch (error) {
    // Fail open: if session check fails (e.g. Supabase unavailable), pass through.
    // The DAL's verifySession() will enforce auth at the page/route level.
    console.error('[proxy] Session check failed:', error instanceof Error ? error.message : error);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};

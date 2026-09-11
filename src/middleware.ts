import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Edge middleware: gate the authenticated areas before a page is ever rendered.
 *
 * This is a first line of defence for *navigation*, not the authorisation
 * boundary. Every API route independently calls `requireUser` / `requireAdmin`,
 * because a middleware matcher is a routing rule and routing rules can be
 * bypassed — an attacker calls the API directly rather than clicking a link.
 * Defence in depth: the middleware improves the experience, the route handler
 * enforces the rule.
 */

const PROTECTED = ['/account', '/bookings', '/favourites', '/checkout'];
const ADMIN_ONLY = ['/admin'];

async function readRole(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      issuer: 'eventora',
      audience: 'eventora-web',
      algorithms: ['HS256'],
    });
    return payload.role === 'ADMIN' ? 'ADMIN' : 'USER';
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const needsAdmin = ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const needsAuth =
    needsAdmin || PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!needsAuth) return NextResponse.next();

  const role = await readRole(request.cookies.get('eventora_session')?.value);

  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (needsAdmin && role !== 'ADMIN') {
    const url = request.nextUrl.clone();
    url.pathname = '/403';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*', '/bookings/:path*', '/favourites/:path*', '/checkout/:path*', '/admin/:path*'],
};

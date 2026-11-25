import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify, errors as joseErrors } from 'jose';
import { authJwtSecret, sessionClaimsValid } from '@/lib/db/mode';

// ============================================================
// Admin session check (edge-safe)
// ============================================================
// The middleware runs on the edge and cannot reach the database: it checks
// the session token's signature itself, then asks the app (same container,
// over loopback) for the live role, so a demoted, banned or signed-out
// staff member loses the dashboard at once. The browser mirrors its session
// into the `sb-access-token` cookie (lib/supabase.ts, app/admin/login).

const SESSION_COOKIE = 'sb-access-token';

/** The container serves on 0.0.0.0:3000; override with INTERNAL_APP_ORIGIN. */
function internalOrigin(request: NextRequest): string {
    if (process.env.INTERNAL_APP_ORIGIN) return process.env.INTERNAL_APP_ORIGIN.replace(/\/+$/, '');
    if (process.env.NODE_ENV !== 'production') return request.nextUrl.origin;
    return 'http://127.0.0.1:3000';
}

const ROLE_CACHE_TTL_MS = 30 * 1000;
const roleCache = new Map<string, { userId: string; role: string; fetchedAt: number }>();

type TokenCheck =
    | { status: 'ok'; userId: string; role: string }
    /** No usable session: expired. */
    | { status: 'expired' }
    /** Bad signature, wrong kind of token, revoked, or no profile. */
    | { status: 'invalid' }
    /** Signature is valid but the role lookup could not run (app unreachable). */
    | { status: 'unverified'; userId: string };

/** The same signing secret lib/db/auth.ts uses (AUTH_JWT_SECRET, JWT_SECRET or SUPABASE_JWT_SECRET). */
function jwtSecret(): string | null {
    try {
        return authJwtSecret();
    } catch {
        return null;
    }
}

async function checkToken(request: NextRequest, token: string): Promise<TokenCheck> {
    const secret = jwtSecret();
    if (!secret) return { status: 'invalid' };
    let userId: string;
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), { algorithms: ['HS256'] });
        // A session access token for this app: not a refresh token, not the
        // anon/service key, has an expiry, a subject and this app's audience.
        if (!sessionClaimsValid(payload as Record<string, unknown>)) return { status: 'invalid' };
        userId = payload.sub as string;
    } catch (e) {
        return { status: e instanceof joseErrors.JWTExpired ? 'expired' : 'invalid' };
    }

    const now = Date.now();
    const cached = roleCache.get(token);
    if (cached && now - cached.fetchedAt < ROLE_CACHE_TTL_MS) {
        return { status: 'ok', userId: cached.userId, role: cached.role };
    }
    try {
        const res = await fetch(`${internalOrigin(request)}/api/auth/session-role`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });
        if (res.status === 401) return { status: 'invalid' };
        if (!res.ok) return { status: 'unverified', userId };
        const body = (await res.json()) as { userId?: string; role?: string };
        if (!body.userId || !body.role) return { status: 'invalid' };
        if (roleCache.size > 500) roleCache.clear();
        roleCache.set(token, { userId: body.userId, role: body.role, fetchedAt: now });
        return { status: 'ok', userId: body.userId, role: body.role };
    } catch {
        return { status: 'unverified', userId };
    }
}

function toLogin(request: NextRequest, params: Record<string, string>): NextResponse {
    const loginUrl = new URL('/admin/login', request.url);
    for (const [k, v] of Object.entries(params)) loginUrl.searchParams.set(k, v);
    const res = NextResponse.redirect(loginUrl);
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res;
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next();

    // Add extra security headers for admin routes
    if (pathname.startsWith('/admin')) {
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

        // The login page itself needs no session.
        if (pathname === '/admin/login') return response;

        // Server-side auth check: the session token the browser mirrors into
        // the sb-access-token cookie (see lib/supabase.ts).
        const token = request.cookies.get(SESSION_COOKIE)?.value;
        if (!token) return toLogin(request, { redirect: pathname });

        const check = await checkToken(request, token);
        if (check.status === 'expired' || check.status === 'invalid') {
            return toLogin(request, { redirect: pathname, error: 'session_expired' });
        }
        if (check.status === 'unverified') {
            // The role lookup could not run (app restarting, database blip).
            // The signature is valid, so staff are not locked out by a
            // restart; the admin layout still checks the role, and
            // row-level security and the server routes' own role checks
            // still guard every read and write.
            console.error(`[Middleware] role lookup unavailable; letting a validly signed session through (user ${check.userId}, ${pathname})`);
        } else if (check.role !== 'admin' && check.role !== 'staff') {
            return toLogin(request, { error: 'unauthorized' });
        }
    }

    return response;
}

export const config = {
    matcher: ['/admin/:path*'],
};

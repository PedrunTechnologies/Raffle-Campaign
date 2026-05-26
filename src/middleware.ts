import { NextRequest, NextResponse } from "next/server";

/**
 * Routes that require authentication.
 * Any path starting with these prefixes will be protected.
 */
const PROTECTED_PREFIXES = [
  "/tasks",
  "/voucher",
  "/result",
  "/profile",
  "/link-socials",
  "/voucher-detail",
  "/closed",
];

/**
 * Routes only accessible when NOT authenticated (redirect to / if already logged in).
 */
const AUTH_ONLY_ROUTES = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read the Firebase ID token stored as a cookie after login
  const token = req.cookies.get("pedrun_token")?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY_ROUTES.some((p) => pathname.startsWith(p));

  // Not authenticated, trying to visit a protected page → redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already authenticated, trying to visit login/signup → send home
  if (isAuthOnly && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon, public assets
     * - API routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};

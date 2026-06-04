import { NextRequest, NextResponse } from "next/server";

/**
 * Participant routes that require authentication.
 */

const PARTICIPANT_PROTECTED = [
  "/tasks",
  "/voucher",
  "/result",
  "/profile",
  "/link-socials",
  "/voucher-detail",
  "/closed",
  "/dashboard",
];

/**
 * Participant routes only accessible when NOT authenticated.
 */
const PARTICIPANT_AUTH_ONLY = ["/login", "/signup"];

/**
 * Vendor routes that require authentication.
 */
const VENDOR_PROTECTED = [
  "/vendor/dashboard",
  "/vendor/opt-in",
  "/vendor/profile",
  "/vendor/redemptions",
  "/vendor/settings",
  "/vendor/verify",
];

/**
 * Vendor routes only accessible when NOT authenticated.
 */
const VENDOR_AUTH_ONLY = ["/vendor/login", "/vendor/apply"];

/**
 * Admin login page — the only admin route accessible without a token.
 */
const ADMIN_AUTH_ONLY = ["/admin/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes ───────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    const adminToken = req.cookies.get("pedrun_admin_token")?.value;
    const isAdminAuthOnly = ADMIN_AUTH_ONLY.some((p) => pathname.startsWith(p));

    if (!isAdminAuthOnly && !adminToken) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isAdminAuthOnly && adminToken) {
      return NextResponse.redirect(new URL("/admin/overview", req.url));
    }

    return NextResponse.next();
  }

  // ── Vendor routes ──────────────────────────────────────────────
  const isVendorProtected = VENDOR_PROTECTED.some((p) => pathname.startsWith(p));
  const isVendorAuthOnly = VENDOR_AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (isVendorProtected || isVendorAuthOnly) {
    const vendorToken = req.cookies.get("pedrun_vendor_token")?.value;

    if (isVendorProtected && !vendorToken) {
      const loginUrl = new URL("/vendor/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isVendorAuthOnly && vendorToken) {
      return NextResponse.redirect(new URL("/vendor/dashboard", req.url));
    }

    return NextResponse.next();
  }

  // ── Participant routes ─────────────────────────────────────────
  const participantToken = req.cookies.get("pedrun_token")?.value;

  const isParticipantProtected = PARTICIPANT_PROTECTED.some((p) => pathname.startsWith(p));
  const isParticipantAuthOnly = PARTICIPANT_AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (isParticipantProtected && !participantToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isParticipantAuthOnly && participantToken) {
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


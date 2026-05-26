import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const BASE         = process.env.NEXT_PUBLIC_APP_URL!;
const CLIENT_ID    = process.env.INSTAGRAM_CLIENT_ID!;
const CLIENT_SECRET= process.env.INSTAGRAM_CLIENT_SECRET!;
const REDIRECT_URI = `${BASE}/api/auth/instagram/callback`;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  /* ── user cancelled ── */
  if (error || !code) {
    return NextResponse.redirect(new URL("/link-socials?error=cancelled", BASE));
  }

  /* ── verify state to prevent CSRF ── */
  const storedState = req.cookies.get("ig_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/link-socials?error=state_mismatch", BASE));
  }

  /* ── identify the logged-in user ── */
  const idToken = req.cookies.get("pedrun_token")?.value;
  if (!idToken) {
    return NextResponse.redirect(new URL("/login", BASE));
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.redirect(new URL("/login", BASE));
  }

  try {
    /* ── exchange code for short-lived access token ── */
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    "authorization_code",
        redirect_uri:  REDIRECT_URI,
        code,
      }),
    });
    const tokenData = await tokenRes.json() as { access_token?: string; user_id?: number };
    if (!tokenData.access_token) throw new Error("No access token");

    /* ── exchange for long-lived token ── */
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${CLIENT_SECRET}&access_token=${tokenData.access_token}`
    );
    const longData = await longRes.json() as { access_token?: string };
    const accessToken = longData.access_token ?? tokenData.access_token;

    /* ── fetch username ── */
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=username&access_token=${accessToken}`
    );
    const profile = await profileRes.json() as { username?: string };
    const handle  = profile.username ? `@${profile.username}` : `id:${tokenData.user_id}`;

    /* ── persist to Firestore ── */
    await adminDb.doc(`users/${uid}`).update({
      "socials.instagram": {
        platform:    "instagram",
        handle,
        accessToken, // store server-side only
        linkedAt:    FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    const res = NextResponse.redirect(new URL("/link-socials?linked=instagram", BASE));
    res.cookies.set("ig_oauth_state", "", { maxAge: 0 });
    return res;

  } catch (err) {
    console.error("[instagram/callback]", err);
    return NextResponse.redirect(new URL("/link-socials?error=instagram_failed", BASE));
  }
}

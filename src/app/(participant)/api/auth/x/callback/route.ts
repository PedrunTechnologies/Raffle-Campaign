import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const BASE          = process.env.NEXT_PUBLIC_APP_URL!;
const CLIENT_ID     = process.env.X_CLIENT_ID!;
const CLIENT_SECRET = process.env.X_CLIENT_SECRET!;
const REDIRECT_URI  = `${BASE}/api/auth/x/callback`;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/link-socials?error=cancelled", BASE));
  }

  const storedState    = req.cookies.get("x_oauth_state")?.value;
  const codeVerifier   = req.cookies.get("x_code_verifier")?.value;

  if (!storedState || storedState !== state || !codeVerifier) {
    return NextResponse.redirect(new URL("/link-socials?error=state_mismatch", BASE));
  }

  const idToken = req.cookies.get("pedrun_token")?.value;
  if (!idToken) return NextResponse.redirect(new URL("/login", BASE));

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.redirect(new URL("/login", BASE));
  }

  try {
    /* ── exchange code for access token (PKCE) ── */
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        code,
        grant_type:    "authorization_code",
        redirect_uri:  REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) throw new Error("No access token");

    /* ── fetch username ── */
    const profileRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json() as { data?: { username?: string } };
    const handle      = profileData.data?.username
      ? `@${profileData.data.username}`
      : "unknown";

    /* ── persist ── */
    await adminDb.doc(`users/${uid}`).update({
      "socials.x": {
        platform:    "x",
        handle,
        accessToken: tokenData.access_token,
        linkedAt:    FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    const res = NextResponse.redirect(new URL("/link-socials?linked=x", BASE));
    res.cookies.set("x_oauth_state",    "", { maxAge: 0 });
    res.cookies.set("x_code_verifier",  "", { maxAge: 0 });
    return res;

  } catch (err) {
    console.error("[x/callback]", err);
    return NextResponse.redirect(new URL("/link-socials?error=x_failed", BASE));
  }
}

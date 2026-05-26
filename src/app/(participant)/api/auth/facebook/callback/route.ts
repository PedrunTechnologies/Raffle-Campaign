import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const BASE          = process.env.NEXT_PUBLIC_APP_URL!;
const CLIENT_ID     = process.env.FACEBOOK_CLIENT_ID!;
const CLIENT_SECRET = process.env.FACEBOOK_CLIENT_SECRET!;
const REDIRECT_URI  = `${BASE}/api/auth/facebook/callback`;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/link-socials?error=cancelled", BASE));
  }

  const storedState = req.cookies.get("fb_oauth_state")?.value;
  if (!storedState || storedState !== state) {
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
    /* ── exchange code for access token ── */
    const tokenUrl = new URL("https://graph.facebook.com/v20.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id",     CLIENT_ID);
    tokenUrl.searchParams.set("client_secret", CLIENT_SECRET);
    tokenUrl.searchParams.set("redirect_uri",  REDIRECT_URI);
    tokenUrl.searchParams.set("code",          code);

    const tokenRes  = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json() as { access_token?: string };
    if (!tokenData.access_token) throw new Error("No access token");

    /* ── fetch name ── */
    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=name&access_token=${tokenData.access_token}`
    );
    const profile = await profileRes.json() as { name?: string; id?: string };
    const handle  = profile.name ?? `id:${profile.id}`;

    /* ── persist ── */
    await adminDb.doc(`users/${uid}`).update({
      "socials.facebook": {
        platform:    "facebook",
        handle,
        accessToken: tokenData.access_token,
        linkedAt:    FieldValue.serverTimestamp(),
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    const res = NextResponse.redirect(new URL("/link-socials?linked=facebook", BASE));
    res.cookies.set("fb_oauth_state", "", { maxAge: 0 });
    return res;

  } catch (err) {
    console.error("[facebook/callback]", err);
    return NextResponse.redirect(new URL("/link-socials?error=facebook_failed", BASE));
  }
}

export type SocialPlatform = "instagram" | "facebook" | "x";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function callbackUrl(platform: SocialPlatform) {
  return `${BASE}/api/auth/${platform}/callback`;
}

/* ── Instagram (Basic Display API) ─────────────────────────────────── */
export function buildInstagramAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id:     process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID!,
    redirect_uri:  callbackUrl("instagram"),
    scope:         "user_profile,user_media",
    response_type: "code",
    state,
  });
  return `https://api.instagram.com/oauth/authorize?${params}`;
}

/* ── Facebook (Graph API) ───────────────────────────────────────────── */
export function buildFacebookAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id:     process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID!,
    redirect_uri:  callbackUrl("facebook"),
    scope:         "public_profile,user_link",
    response_type: "code",
    state,
  });
  return `https://www.facebook.com/v20.0/dialog/oauth?${params}`;
}

/* ── X / Twitter (OAuth 2.0 PKCE) ──────────────────────────────────── */
export function buildXAuthUrl(state: string, codeChallenge: string) {
  const params = new URLSearchParams({
    response_type:          "code",
    client_id:              process.env.NEXT_PUBLIC_X_CLIENT_ID!,
    redirect_uri:           callbackUrl("x"),
    scope:                  "tweet.read users.read offline.access",
    state,
    code_challenge:         codeChallenge,
    code_challenge_method:  "S256",
  });
  return `https://twitter.com/i/oauth2/authorize?${params}`;
}

/* ── PKCE helpers (used for X) ──────────────────────────────────────── */
export async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array    = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  const encoded    = new TextEncoder().encode(verifier);
  const hashBuf    = await crypto.subtle.digest("SHA-256", encoded);
  const hashArray  = Array.from(new Uint8Array(hashBuf));
  const challenge  = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  return { verifier, challenge };
}

/* ── CSRF state helper ──────────────────────────────────────────────── */
export function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

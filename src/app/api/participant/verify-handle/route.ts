// import { NextRequest, NextResponse } from "next/server";

// /**
//  * GET /api/participant/verify-handle?platform=instagram&handle=someuser
//  *
//  * Checks whether a handle exists on the given platform using public-facing
//  * API calls. No OAuth required — these are public profile lookups only.
//  *
//  * Returns: { exists: boolean }
//  *
//  * Platform notes:
//  *   instagram — Instagram Basic Display API or oEmbed (public profiles only)
//  *   facebook  — Graph API oEmbed or page lookup (public pages only)
//  *   x         — Twitter API v2 users/by/username (public accounts only)
//  *
//  * Rate limits: all three are called server-side using app-level tokens,
//  * so participant IPs are never rate-limited directly.
//  */

// type Platform = "instagram" | "facebook" | "x";

// export async function GET(req: NextRequest) {
//   const { searchParams } = req.nextUrl;
//   const platform = searchParams.get("platform") as Platform | null;
//   const handle   = searchParams.get("handle")?.trim().replace(/^@/, "");

//   if (!platform || !handle) {
//     return NextResponse.json({ error: "platform and handle are required." }, { status: 400 });
//   }

//   if (!["instagram", "facebook", "x"].includes(platform)) {
//     return NextResponse.json({ error: "Invalid platform." }, { status: 400 });
//   }

//   // Basic handle sanity check — alphanumeric, underscores, dots, hyphens
//   if (!/^[a-zA-Z0-9._-]{1,50}$/.test(handle)) {
//     return NextResponse.json({ exists: false });
//   }

//   try {
//     const exists = await checkHandle(platform, handle);
//     return NextResponse.json({ exists });
//   } catch (err) {
//     console.error(`[verify-handle] ${platform}/${handle}:`, err);
//     // On unexpected errors, don't block the participant — return exists:true
//     // so they can proceed; admin spot-check will catch bad handles anyway.
//     return NextResponse.json({ exists: true });
//   }
// }

// /* ── platform checkers ───────────────────────────────────────────────── */

// async function checkHandle(platform: Platform, handle: string): Promise<boolean> {
//   switch (platform) {
//     case "instagram": return checkInstagram(handle);
//     case "facebook":  return checkFacebook(handle);
//     case "x":         return checkX(handle);
//   }
// }

// /**
//  * Instagram — uses the oEmbed endpoint which is public and doesn't require
//  * user auth. Returns 404 if the profile doesn't exist or is private.
//  */
// async function checkInstagram(handle: string): Promise<boolean> {
//   try {
//     const res = await fetch(
//       `https://graph.instagram.com/v20.0/instagram_oembed?url=https://www.instagram.com/${handle}/&access_token=${process.env.INSTAGRAM_APP_TOKEN}`,
//       { next: { revalidate: 300 } } // cache 5 min to avoid hammering
//     );
//     return res.ok;
//   } catch {
//     return false;
//   }
// }

// /**
//  * Facebook — uses the Graph API to look up a public page or user profile.
//  * Requires a standard app access token (app_id|app_secret).
//  */
// async function checkFacebook(handle: string): Promise<boolean> {
//   const appToken = `${process.env.FACEBOOK_CLIENT_ID}|${process.env.FACEBOOK_CLIENT_SECRET}`;
//   try {
//     const res = await fetch(
//       `https://graph.facebook.com/v20.0/${encodeURIComponent(handle)}?fields=id&access_token=${appToken}`,
//       { next: { revalidate: 300 } }
//     );
//     if (!res.ok) return false;
//     const data = await res.json() as { id?: string; error?: unknown };
//     return !!data.id && !data.error;
//   } catch {
//     return false;
//   }
// }

// /**
//  * X (Twitter) — uses API v2 users/by/username.
//  * Requires a Bearer token (no user auth needed for public lookups).
//  */
// async function checkX(handle: string): Promise<boolean> {
//   try {
//     const res = await fetch(
//       `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}`,
//       {
//         headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` },
//         next:    { revalidate: 300 },
//       }
//     );
//     if (!res.ok) return false;
//     const data = await res.json() as { data?: { id: string }; errors?: unknown[] };
//     return !!data.data?.id && !data.errors?.length;
//   } catch {
//     return false;
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireParticipant } from "@/lib/require-participant";

type Platform = "instagram" | "facebook" | "x";

export async function GET(req: NextRequest) {
  const result = await requireParticipant(req);

  if ("error" in result) {
    return result.error;
  }

  const { uid } = result;

  const { searchParams } = req.nextUrl;

  const platform = searchParams.get("platform") as Platform | null;

  const handle = searchParams
    .get("handle")
    ?.trim()
    .replace(/^@/, "")
    .toLowerCase();

  if (!platform || !handle) {
    return NextResponse.json(
      {
        error: "platform and handle are required.",
      },
      {
        status: 400,
      }
    );
  }

  if (!["instagram", "facebook", "x"].includes(platform)) {
    return NextResponse.json(
      {
        error: "Invalid platform.",
      },
      {
        status: 400,
      }
    );
  }

  // alphanumeric + underscore + dots + hyphens
  if (!/^[a-zA-Z0-9._-]{1,50}$/.test(handle)) {
    return NextResponse.json({
      exists: false,
      taken: false,
    });
  }

  try {
    /**
     * 1. Verify external account exists
     */
    // const exists = await checkHandle(platform, handle);

    // if (!exists) {
    //   return NextResponse.json({
    //     exists: false,
    //     taken: false,
    //   });
    // }

    /**
     * 2. Check if another participant already uses this handle
     */
    const snap = await adminDb
      .collection("users")
      .where(`socials.${platform}.handle`, "==", handle)
      .get();

    /**
     * Ignore current participant
     */
    const taken = snap.docs.some((doc) => doc.id !== uid);

    return NextResponse.json({
      exists: true,
      taken,
    });
  } catch (err) {
    console.error(
      `[verify-handle] ${platform}/${handle}:`,
      err
    );

    /**
     * Graceful fallback:
     * allow participant to continue
     */
    return NextResponse.json({
      exists: true,
      taken: false,
    });
  }
}

/* ── platform checkers ─────────────────────────────────────────────── */

async function checkHandle(
  platform: Platform,
  handle: string
): Promise<boolean> {
  switch (platform) {
    case "instagram":
      return checkInstagram(handle);

    case "facebook":
      return checkFacebook(handle);

    case "x":
      return checkX(handle);
  }
}

/**
 * Instagram
 */
async function checkInstagram(handle: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/v20.0/instagram_oembed?url=https://www.instagram.com/${handle}/&access_token=${process.env.INSTAGRAM_APP_TOKEN}`,
      {
        next: { revalidate: 300 },
      }
    );

    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Facebook
 */
async function checkFacebook(handle: string): Promise<boolean> {
  const appToken =
    `${process.env.FACEBOOK_CLIENT_ID}|${process.env.FACEBOOK_CLIENT_SECRET}`;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${encodeURIComponent(handle)}?fields=id&access_token=${appToken}`,
      {
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) return false;

    const data = (await res.json()) as {
      id?: string;
      error?: unknown;
    };

    return !!data.id && !data.error;
  } catch {
    return false;
  }
}

/**
 * X (Twitter)
 */
async function checkX(handle: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`,
        },

        next: {
          revalidate: 300,
        },
      }
    );

    if (!res.ok) return false;

    const data = (await res.json()) as {
      data?: { id: string };
      errors?: unknown[];
    };

    return !!data.data?.id && !data.errors?.length;
  } catch {
    return false;
  }
}
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

type Platform = "instagram" | "facebook" | "x";

interface SocialEntry {
  platform: Platform;
  handle: string;
}

export async function POST(req: NextRequest) {
  /* ── auth ── */
  const cookie = req.cookies.get("pedrun_token")?.value;
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(cookie);
    uid = decoded.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? "";
    if (code === "auth/id-token-expired") {
      return NextResponse.json({ error: "TOKEN_EXPIRED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  /* ── validate body ── */
  const body = await req.json() as { socials?: SocialEntry[] };

  if (!Array.isArray(body.socials) || body.socials.length === 0) {
    return NextResponse.json({ error: "No socials provided." }, { status: 400 });
  }

  const valid: Platform[] = ["instagram", "facebook", "x"];
  const socials = body.socials.filter(
    (s) => valid.includes(s.platform) && s.handle?.trim()
  );

  if (!socials.length) {
    return NextResponse.json({ error: "No valid socials provided." }, { status: 400 });
  }

  /* ── build update object ── */
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  for (const { platform, handle } of socials) {
    const clean = handle.trim().replace(/^@/, "").replace(/^fb\//, "");
    updates[`socials.${platform}`] = {
      platform,
      handle: clean,
      linkedAt: FieldValue.serverTimestamp(),
    };
  }

  /* ── write to Firestore ── */
  await adminDb.doc(`users/${uid}`).update(updates);

  return NextResponse.json({ ok: true });
}

/* ── DELETE — remove a single platform handle ── */
export async function DELETE(req: NextRequest) {
  const cookie = req.cookies.get("pedrun_token")?.value;
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(cookie);
    uid = decoded.uid;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? "";
    if (code === "auth/id-token-expired") {
      return NextResponse.json({ error: "TOKEN_EXPIRED" }, { status: 401 });
    }
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { platform } = await req.json() as { platform?: Platform };

  if (!platform || !["instagram", "facebook", "x"].includes(platform)) {
    return NextResponse.json({ error: "Invalid platform." }, { status: 400 });
  }

  // const { deleteField } = await import("firebase-admin/firestore");

  // await adminDb.doc(`users/${uid}`).update({
  //   [`socials.${platform}`]: deleteField(),
  //   updatedAt:               FieldValue.serverTimestamp(),
  // });
  await adminDb.doc(`users/${uid}`).update({
    [`socials.${platform}`]: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}

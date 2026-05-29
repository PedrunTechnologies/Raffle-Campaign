/**
 * POST /api/participant/fcm-token
 * Body: { token: string }
 *
 * Saves (arrayUnion) or removes (DELETE, arrayRemove) an FCM token
 * on the participant's user doc.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireParticipant } from "@/lib/require-participant";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  const result = await requireParticipant(req);
  if ("error" in result) return result.error;
  const { uid } = result;

  const { token } = await req.json() as { token?: string };
  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  await adminDb.doc(`users/${uid}`).update({
    fcmTokens: FieldValue.arrayUnion(token),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const result = await requireParticipant(req);
  if ("error" in result) return result.error;
  const { uid } = result;

  const { token } = await req.json() as { token?: string };
  if (!token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  await adminDb.doc(`users/${uid}`).update({
    fcmTokens: FieldValue.arrayRemove(token),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}

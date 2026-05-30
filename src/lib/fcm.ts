/**
 * lib/fcm.ts
 *
 * Server-side FCM helpers. All functions run in API routes (Node.js / Edge
 * with node runtime). Uses Firebase Admin Messaging.
 *
 * Token hygiene: after each multicast we remove tokens that FCM reports as
 * unregistered or invalid so they don't accumulate in Firestore.
 */

import { adminDb, adminMessaging } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { MulticastMessage } from "firebase-admin/messaging";

/* ── types ────────────────────────────────────────────────────────────── */

interface NotificationPayload {
  title: string;
  body:  string;
  data?: Record<string, string>;
}

/* ── low-level multicast ─────────────────────────────────────────────── */

export async function sendToTokens(
  tokens: string[],
  notification: NotificationPayload,
  docRef: FirebaseFirestore.DocumentReference,
): Promise<void> {
  if (tokens.length === 0) return;

  const message: MulticastMessage = {
    tokens,
    notification: {
      title: notification.title,
      body:  notification.body,
    },
    data: notification.data ?? {},
    webpush: {
      notification: {
        title: notification.title,
        body:  notification.body,
        icon:  "/icon.png",
        badge: "/icon.png",
      },
      fcmOptions: {
        link: notification.data?.url ?? "/",
      },
    },
    apns: {
      payload: {
        aps: { sound: "default", badge: 1 },
      },
    },
  };

  const response = await adminMessaging.sendEachForMulticast(message);

  console.log(`[FCM] sent to ${tokens.length} token(s): ` +
    `${response.successCount} ok, ${response.failureCount} failed`);

  // Log individual failures so we can see exactly what's going wrong
  const staleTokens: string[] = [];
  response.responses.forEach((res, i) => {
    if (!res.success) {
      console.warn(`[FCM] token[${i}] failed:`, res.error?.code, res.error?.message);
      const code = res.error?.code ?? "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        staleTokens.push(tokens[i]);
      }
    }
  });

  if (staleTokens.length > 0) {
    await docRef.update({
      fcmTokens: FieldValue.arrayRemove(...staleTokens),
    });
  }
}

/* ── broadcast helpers ───────────────────────────────────────────────── */

export async function notifyParticipantsDrawDone(cycleNumber: number): Promise<void> {
  // No role filter — query all users. Add .where("role","==","participant")
  // only if your user docs reliably have a role field.
  const snap = await adminDb
    .collection("users")
    .select("fcmTokens")
    .get();

  console.log(`[FCM] notifyParticipantsDrawDone: ${snap.size} user doc(s) found`);

  const sends = snap.docs.map((doc) => {
    const tokens: string[] = doc.data().fcmTokens ?? [];
    if (tokens.length === 0) return Promise.resolve();
    return sendToTokens(
      tokens,
      {
        title: "🎉 The draw is in!",
        body:  `Cycle #${cycleNumber} results are ready — check your voucher now.`,
        data:  { url: "/", type: "draw_done", cycleNumber: String(cycleNumber) },
      },
      doc.ref,
    );
  });

  await Promise.allSettled(sends);
}

export async function notifyVendorsDrawDone(cycleNumber: number): Promise<void> {
  const snap = await adminDb
    .collection("vendors")
    .where("status", "==", "active")
    .select("fcmTokens")
    .get();

  console.log(`[FCM] notifyVendorsDrawDone: ${snap.size} vendor doc(s) found`);

  const sends = snap.docs.map((doc) => {
    const tokens: string[] = doc.data().fcmTokens ?? [];
    if (tokens.length === 0) return Promise.resolve();
    return sendToTokens(
      tokens,
      {
        title: "📋 Draw complete — redemptions open",
        body:  `Cycle #${cycleNumber} draw is done. Voucher redemptions are now active.`,
        data:  { url: "/vendor/dashboard", type: "draw_done", cycleNumber: String(cycleNumber) },
      },
      doc.ref,
    );
  });

  await Promise.allSettled(sends);
}

export async function notifyParticipantsNewCycle(cycleNumber: number): Promise<void> {
  const snap = await adminDb
    .collection("users")
    .select("fcmTokens")
    .get();

  console.log(`[FCM] notifyParticipantsNewCycle: ${snap.size} user doc(s) found`);

  const sends = snap.docs.map((doc) => {
    const tokens: string[] = doc.data().fcmTokens ?? [];
    if (tokens.length === 0) return Promise.resolve();
    return sendToTokens(
      tokens,
      {
        title: "🍽️ A new cycle just started!",
        body:  "Complete today's tasks to enter the draw for a free meal.",
        data:  { url: "/", type: "new_cycle", cycleNumber: String(cycleNumber) },
      },
      doc.ref,
    );
  });

  await Promise.allSettled(sends);
}

export async function notifyVendorsNewCycle(cycleNumber: number): Promise<void> {
  const snap = await adminDb
    .collection("vendors")
    .where("status", "==", "active")
    .select("fcmTokens")
    .get();

  console.log(`[FCM] notifyVendorsNewCycle: ${snap.size} vendor doc(s) found`);

  const sends = snap.docs.map((doc) => {
    const tokens: string[] = doc.data().fcmTokens ?? [];
    if (tokens.length === 0) return Promise.resolve();
    return sendToTokens(
      tokens,
      {
        title: "🔔 New cycle started",
        body:  `Cycle #${cycleNumber} is live. Participants are completing tasks now.`,
        data:  { url: "/vendor/dashboard", type: "new_cycle", cycleNumber: String(cycleNumber) },
      },
      doc.ref,
    );
  });

  await Promise.allSettled(sends);
}
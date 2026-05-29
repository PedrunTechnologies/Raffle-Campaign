/**
 * hooks/useFcmToken.ts
 *
 * Requests notification permission, retrieves the FCM registration token,
 * and saves it to the backend (arrayUnion — idempotent, multi-device safe).
 *
 * The service worker is served dynamically from /firebase-messaging-sw.js
 * (an API route) so Firebase config env vars are available inside it.
 *
 * Usage:
 *   useFcmToken({ tokenEndpoint: "/api/participant/fcm-token" })
 *   useFcmToken({ tokenEndpoint: "/api/vendor/fcm-token" })
 */

"use client";

import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { getFirebaseMessaging, auth } from "@/lib/firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

interface Options {
  tokenEndpoint: string;
}

export function useFcmToken({ tokenEndpoint }: Options) {
  useEffect(() => {
    let cancelled = false;

    async function register() {
      try {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator))  return;

        /* Request notification permission */
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        /* Get FCM messaging instance (null if browser unsupported) */
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        /* Register the SW explicitly so we control the URL.
           The SW is served by an API route that injects Firebase config. */
        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
          { scope: "/firebase-cloud-messaging-push-scope" }
        );

        /* Wait for the SW to be active before asking for a token */
        await navigator.serviceWorker.ready;

        if (cancelled) return;

        const token = await getToken(messaging, {
          vapidKey:            VAPID_KEY,
          serviceWorkerRegistration: registration,
        });

        if (!token || cancelled) return;

        /* Save token to backend */
        const user = auth.currentUser;
        if (!user) return;
        const idToken = await user.getIdToken();

        await fetch(tokenEndpoint, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token }),
        });
      } catch (err) {
        console.warn("[useFcmToken] registration failed:", err);
      }
    }

    register();
    return () => { cancelled = true; };
  }, [tokenEndpoint]);
}
